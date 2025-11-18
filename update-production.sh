#!/bin/bash

# Pay4U Production Update Script
# This script updates an existing Pay4U deployment with new changes
# Run this script on your production server to deploy updates

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="pay4u"
APP_USER="pay4u"
APP_DIR="/opt/pay4u"
APP_PATH="$APP_DIR/app"
BACKUP_DIR="$APP_DIR/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_PATH="$BACKUP_DIR/backup_$DATE"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

check_app_exists() {
    if [ ! -d "$APP_PATH" ]; then
        log_error "Application directory $APP_PATH not found. Please run fresh deployment first."
        exit 1
    fi
}

ensure_ownership() {
    log_info "Ensuring application files are owned by user '$APP_USER'..."
    # Ensure core directories exist
    mkdir -p "$APP_DIR/logs" "$APP_PATH" "$APP_DIR/.pm2"
    
    # Fix ownership to prevent npm EACCES errors
    chown -R $APP_USER:$APP_USER "$APP_PATH" || log_warning "Failed to chown $APP_PATH"
    chown -R $APP_USER:$APP_USER "$APP_DIR/logs" || log_warning "Failed to chown $APP_DIR/logs"
    chown -R $APP_USER:$APP_USER "$APP_DIR/.pm2" || log_warning "Failed to chown $APP_DIR/.pm2"
    
    log_success "Ownership corrected for $APP_PATH, logs, and PM2 home"
}

create_backup() {
    log_info "Creating backup of current application..."
    mkdir -p "$BACKUP_DIR"
    
    # Backup application files
    cp -r "$APP_PATH" "$BACKUP_PATH"
    
    # Backup database
    mongodump --db pay4u_production --out "$BACKUP_PATH/database" 2>/dev/null || log_warning "Database backup failed"
    
    log_success "Backup created at $BACKUP_PATH"
}

stop_services() {
    log_info "Stopping application services..."
    
    # Stop PM2 processes
    sudo -u $APP_USER pm2 stop all 2>/dev/null || log_warning "PM2 processes not running"
    
    # Stop systemd service if exists
    systemctl stop pay4u 2>/dev/null || log_warning "Systemd service not running"
    
    log_success "Services stopped"
}

update_code() {
    log_info "Updating application code..."
    
    cd "$APP_PATH"
    
    # Stash any local changes
    sudo -u $APP_USER git stash 2>/dev/null || true
    
    # Pull latest changes
    sudo -u $APP_USER git pull origin main
    
    log_success "Code updated successfully"
}

update_backend() {
    log_info "Updating backend dependencies..."
    
    cd "$APP_PATH/backend"
    
    # Install/update dependencies with fallback if lock file is out of sync
    if ! sudo -u $APP_USER npm ci --production; then
        log_warning "npm ci failed (lock mismatch). Falling back to 'npm install --production'"
        sudo -u $APP_USER npm install --production
    fi
    
    # Run any database migrations if they exist
    if [ -d "migrations" ]; then
        log_info "Running database migrations..."
        sudo -u $APP_USER node migrations/migrate.js 2>/dev/null || log_warning "No migrations to run"
    fi
    
    log_success "Backend updated successfully"
}

update_frontend() {
    log_info "Building updated frontend..."
    
    cd "$APP_PATH/frontend"
    
    # Install dependencies with fallback if lock file is out of sync
    if ! sudo -u $APP_USER npm ci; then
        log_warning "npm ci failed (lock mismatch). Falling back to 'npm install'"
        sudo -u $APP_USER npm install
    fi
    
    # Build production version
    sudo -u $APP_USER npm run build
    
    # Set proper permissions
    chown -R $APP_USER:$APP_USER build/
    
    log_success "Frontend built successfully"
}

restart_services() {
    log_info "Starting application services..."
    
    cd "$APP_PATH"
    
    # Start with PM2
    sudo -u $APP_USER pm2 start ecosystem.config.js
    
    # Save PM2 configuration
    sudo -u $APP_USER pm2 save
    
    # Start systemd service if exists
    systemctl start pay4u 2>/dev/null || log_warning "Systemd service not configured"
    
    # Reload nginx
    systemctl reload nginx
    
    log_success "Services started successfully"
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Wait for services to start
    sleep 10
    
    # Check PM2 status
    if sudo -u $APP_USER pm2 list | grep -q "online"; then
        log_success "PM2 processes are running"
    else
        log_error "PM2 processes failed to start"
        return 1
    fi
    
    # Check if backend is responding
    if curl -f http://localhost:5000/api/health >/dev/null 2>&1; then
        log_success "Backend API is responding"
    else
        log_warning "Backend API health check failed"
    fi
    
    # Check nginx status
    if systemctl is-active --quiet nginx; then
        log_success "Nginx is running"
    else
        log_error "Nginx is not running"
    fi
    
    log_success "Deployment verification completed"
}

rollback() {
    log_error "Deployment failed. Rolling back..."
    
    if [ -d "$BACKUP_PATH" ]; then
        # Stop current services
        sudo -u $APP_USER pm2 stop all 2>/dev/null || true
        
        # Restore backup
        rm -rf "$APP_PATH"
        cp -r "$BACKUP_PATH" "$APP_PATH"
        
        # Restart services
        cd "$APP_PATH"
        sudo -u $APP_USER pm2 start ecosystem.config.js
        
        log_success "Rollback completed"
    else
        log_error "No backup found for rollback"
    fi
}

cleanup_old_backups() {
    log_info "Cleaning up old backups (keeping last 5)..."
    
    cd "$BACKUP_DIR"
    ls -t | tail -n +6 | xargs -r rm -rf
    
    log_success "Old backups cleaned up"
}

# Main execution
main() {
    log_info "Starting Pay4U production update..."
    
    # Pre-flight checks
    check_root
    check_app_exists
    
    # Create backup
    create_backup
    
    # Update process
    if ! (
        stop_services &&
        update_code &&
        ensure_ownership &&
        update_backend &&
        update_frontend &&
        restart_services &&
        verify_deployment
    ); then
        rollback
        exit 1
    fi
    
    # Cleanup
    cleanup_old_backups
    
    log_success "🎉 Pay4U update completed successfully!"
    log_info "Application is now running with the latest changes"
    log_info "Backup created at: $BACKUP_PATH"
}

# Run main function
main "$@"
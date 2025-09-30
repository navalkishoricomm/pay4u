#!/bin/bash

# Pay4U Quick Deployment Script
# For rapid updates and deployments

set -e

# Configuration
PROJECT_DIR="/var/www/pay4u"
DOMAIN="pay4u.co.in"
BACKUP_DIR="/var/backups/pay4u"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Function to show usage
show_usage() {
    echo "Pay4U Quick Deployment Script"
    echo "============================="
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  deploy     - Full deployment (pull, build, restart)"
    echo "  update     - Quick update (pull and restart only)"
    echo "  restart    - Restart services only"
    echo "  status     - Show application status"
    echo "  logs       - Show application logs"
    echo "  backup     - Create backup of current deployment"
    echo "  rollback   - Rollback to previous backup"
    echo "  ssl        - Setup/renew SSL certificate"
    echo "  clean      - Clean build files and restart"
    echo "  help       - Show this help message"
    echo ""
}

# Create backup
create_backup() {
    log_info "Creating backup..."
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"
    
    sudo mkdir -p $BACKUP_DIR
    sudo cp -r $PROJECT_DIR $BACKUP_PATH
    
    # Keep only last 5 backups
    sudo find $BACKUP_DIR -maxdepth 1 -type d -name "backup_*" | sort -r | tail -n +6 | sudo xargs rm -rf
    
    log_success "Backup created: $BACKUP_PATH"
}

# Rollback to previous backup
rollback() {
    log_info "Rolling back to previous backup..."
    
    LATEST_BACKUP=$(sudo find $BACKUP_DIR -maxdepth 1 -type d -name "backup_*" | sort -r | head -n 1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        log_error "No backup found!"
        exit 1
    fi
    
    log_info "Rolling back to: $LATEST_BACKUP"
    
    # Stop services
    pm2 stop pay4u-backend pay4u-frontend || true
    
    # Restore backup
    sudo rm -rf $PROJECT_DIR
    sudo cp -r $LATEST_BACKUP $PROJECT_DIR
    sudo chown -R $USER:$USER $PROJECT_DIR
    
    # Restart services
    cd $PROJECT_DIR
    pm2 start pay4u-backend pay4u-frontend
    
    log_success "Rollback completed!"
}

# Deploy function
deploy() {
    log_info "Starting full deployment..."
    
    cd $PROJECT_DIR
    
    # Create backup first
    create_backup
    
    # Pull latest code
    log_info "Pulling latest code..."
    git pull origin main
    
    # Install backend dependencies
    log_info "Installing backend dependencies..."
    npm install --production
    
    # Build frontend
    if [ -d "frontend" ]; then
        log_info "Building frontend..."
        cd frontend
        npm install
        npm run build
        cd ..
    fi
    
    # Restart services
    restart_services
    
    log_success "Full deployment completed!"
}

# Quick update function
update() {
    log_info "Starting quick update..."
    
    cd $PROJECT_DIR
    
    # Pull latest code
    log_info "Pulling latest code..."
    git pull origin main
    
    # Restart services
    restart_services
    
    log_success "Quick update completed!"
}

# Restart services
restart_services() {
    log_info "Restarting services..."
    
    # Restart PM2 processes
    pm2 restart pay4u-backend || pm2 start server.js --name pay4u-backend --env production
    
    if [ -d "frontend/build" ]; then
        pm2 restart pay4u-frontend || pm2 start "serve -s frontend/build -l 3001" --name pay4u-frontend
    fi
    
    # Reload Nginx
    sudo systemctl reload nginx
    
    log_success "Services restarted!"
}

# Show status
show_status() {
    log_info "Application Status"
    echo "=================="
    
    echo ""
    echo "🔧 PM2 Processes:"
    pm2 status
    
    echo ""
    echo "🌐 Nginx Status:"
    sudo systemctl status nginx --no-pager -l
    
    echo ""
    echo "🗄️ MongoDB Status:"
    sudo systemctl status mongod --no-pager -l
    
    echo ""
    echo "💾 Disk Usage:"
    df -h $PROJECT_DIR
    
    echo ""
    echo "🔗 Application URLs:"
    echo "Frontend: https://$DOMAIN"
    echo "Backend API: https://$DOMAIN/api"
    
    echo ""
    echo "📊 Recent Git Commits:"
    cd $PROJECT_DIR
    git log --oneline -5
}

# Show logs
show_logs() {
    log_info "Application Logs"
    echo "================="
    
    echo ""
    echo "🔧 PM2 Logs:"
    pm2 logs --lines 20
    
    echo ""
    echo "🌐 Nginx Access Logs:"
    sudo tail -20 /var/log/nginx/access.log
    
    echo ""
    echo "❌ Nginx Error Logs:"
    sudo tail -20 /var/log/nginx/error.log
}

# Setup SSL
setup_ssl() {
    log_info "Setting up SSL certificate..."
    
    # Install certbot if not present
    if ! command -v certbot >/dev/null 2>&1; then
        log_info "Installing certbot..."
        sudo apt install certbot python3-certbot-nginx -y
    fi
    
    # Get/renew certificate
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN
    
    # Setup auto-renewal if not exists
    if ! crontab -l 2>/dev/null | grep -q certbot; then
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
        log_info "Auto-renewal cron job added"
    fi
    
    log_success "SSL setup completed!"
}

# Clean build files
clean_build() {
    log_info "Cleaning build files..."
    
    cd $PROJECT_DIR
    
    # Remove node_modules and build files
    rm -rf node_modules frontend/node_modules frontend/build
    
    # Reinstall and rebuild
    npm install --production
    
    if [ -d "frontend" ]; then
        cd frontend
        npm install
        npm run build
        cd ..
    fi
    
    # Restart services
    restart_services
    
    log_success "Clean build completed!"
}

# Main execution
case "${1:-help}" in
    deploy)
        deploy
        ;;
    update)
        update
        ;;
    restart)
        restart_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    backup)
        create_backup
        ;;
    rollback)
        rollback
        ;;
    ssl)
        setup_ssl
        ;;
    clean)
        clean_build
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        log_error "Unknown command: $1"
        show_usage
        exit 1
        ;;
esac

echo ""
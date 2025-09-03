#!/bin/bash

# Pay4U Docker Update Script
# This script updates a Docker-based Pay4U deployment
# Run this script to update your containerized Pay4U application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="pay4u"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
BACKUP_PATH="$BACKUP_DIR/backup_$DATE"
COMPOSE_FILE="docker-compose.yml"

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

check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    log_success "Docker and Docker Compose are available"
}

check_compose_file() {
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Docker Compose file ($COMPOSE_FILE) not found"
        exit 1
    fi
    
    log_success "Docker Compose file found"
}

create_backup() {
    log_info "Creating backup of current deployment..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    log_info "Backing up database..."
    docker-compose exec -T mongodb mongodump --db pay4u_production --archive > "$BACKUP_PATH-database.archive" 2>/dev/null || {
        log_warning "Database backup failed - container might not be running"
    }
    
    # Backup volumes
    log_info "Backing up volumes..."
    docker run --rm -v pay4u_mongodb_data:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/backup_$DATE-volumes.tar.gz -C /data . 2>/dev/null || {
        log_warning "Volume backup failed"
    }
    
    # Backup application files
    log_info "Backing up application files..."
    tar czf "$BACKUP_PATH-app.tar.gz" --exclude=node_modules --exclude=.git --exclude=backups . 2>/dev/null || {
        log_warning "Application files backup failed"
    }
    
    log_success "Backup created with prefix: backup_$DATE"
}

update_code() {
    log_info "Updating application code..."
    
    # Stash any local changes
    git stash 2>/dev/null || true
    
    # Pull latest changes
    git pull origin main
    
    log_success "Code updated successfully"
}

stop_services() {
    log_info "Stopping Docker services..."
    
    docker-compose down
    
    log_success "Services stopped"
}

rebuild_images() {
    log_info "Rebuilding Docker images..."
    
    # Remove old images to force rebuild
    docker-compose build --no-cache
    
    log_success "Images rebuilt successfully"
}

start_services() {
    log_info "Starting updated services..."
    
    docker-compose up -d
    
    log_success "Services started successfully"
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Wait for services to start
    sleep 30
    
    # Check container status
    if docker-compose ps | grep -q "Up"; then
        log_success "Containers are running"
    else
        log_error "Some containers failed to start"
        docker-compose ps
        return 1
    fi
    
    # Check backend health
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:5000/api/health >/dev/null 2>&1; then
            log_success "Backend API is responding"
            break
        else
            log_info "Waiting for backend to start (attempt $attempt/$max_attempts)..."
            sleep 10
            ((attempt++))
        fi
    done
    
    if [ $attempt -gt $max_attempts ]; then
        log_warning "Backend API health check failed after $max_attempts attempts"
    fi
    
    # Check frontend
    if curl -f http://localhost:80 >/dev/null 2>&1; then
        log_success "Frontend is accessible"
    else
        log_warning "Frontend accessibility check failed"
    fi
    
    log_success "Deployment verification completed"
}

rollback() {
    log_error "Deployment failed. Rolling back..."
    
    # Stop current containers
    docker-compose down
    
    # Restore database if backup exists
    if [ -f "$BACKUP_PATH-database.archive" ]; then
        log_info "Restoring database..."
        docker-compose up -d mongodb
        sleep 10
        docker-compose exec -T mongodb mongorestore --db pay4u_production --archive < "$BACKUP_PATH-database.archive"
    fi
    
    # Restore volumes if backup exists
    if [ -f "$BACKUP_DIR/backup_$DATE-volumes.tar.gz" ]; then
        log_info "Restoring volumes..."
        docker run --rm -v pay4u_mongodb_data:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar xzf /backup/backup_$DATE-volumes.tar.gz -C /data
    fi
    
    # Start services
    docker-compose up -d
    
    log_success "Rollback completed"
}

cleanup_old_backups() {
    log_info "Cleaning up old backups (keeping last 5)..."
    
    cd "$BACKUP_DIR" 2>/dev/null || return
    
    # Remove old backup files (keep last 5 sets)
    ls -t backup_*-app.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm -f
    ls -t backup_*-database.archive 2>/dev/null | tail -n +6 | xargs -r rm -f
    ls -t backup_*-volumes.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm -f
    
    cd - >/dev/null
    
    log_success "Old backups cleaned up"
}

cleanup_docker() {
    log_info "Cleaning up unused Docker resources..."
    
    # Remove unused images
    docker image prune -f >/dev/null 2>&1 || true
    
    # Remove unused containers
    docker container prune -f >/dev/null 2>&1 || true
    
    log_success "Docker cleanup completed"
}

show_logs() {
    log_info "Recent container logs:"
    echo "========================"
    docker-compose logs --tail=20
    echo "========================"
}

# Main execution
main() {
    log_info "Starting Pay4U Docker update..."
    
    # Pre-flight checks
    check_docker
    check_compose_file
    
    # Create backup
    create_backup
    
    # Update process
    if ! (
        update_code &&
        stop_services &&
        rebuild_images &&
        start_services &&
        verify_deployment
    ); then
        show_logs
        rollback
        exit 1
    fi
    
    # Cleanup
    cleanup_old_backups
    cleanup_docker
    
    log_success "🎉 Pay4U Docker update completed successfully!"
    log_info "Application is now running with the latest changes"
    log_info "Frontend: http://localhost:80"
    log_info "Backend API: http://localhost:5000"
    log_info "Backup created with prefix: backup_$DATE"
    
    # Show final status
    echo ""
    log_info "Container status:"
    docker-compose ps
}

# Handle script arguments
case "${1:-}" in
    "rollback")
        if [ -z "$2" ]; then
            log_error "Please specify backup date (format: YYYYMMDD_HHMMSS)"
            log_info "Available backups:"
            ls -1 $BACKUP_DIR/backup_*-app.tar.gz 2>/dev/null | sed 's/.*backup_\(.*\)-app.tar.gz/\1/' || echo "No backups found"
            exit 1
        fi
        DATE="$2"
        BACKUP_PATH="$BACKUP_DIR/backup_$DATE"
        rollback
        ;;
    "logs")
        show_logs
        ;;
    "status")
        docker-compose ps
        ;;
    "")
        main
        ;;
    *)
        echo "Usage: $0 [rollback YYYYMMDD_HHMMSS|logs|status]"
        echo "  (no args)    - Update application"
        echo "  rollback     - Rollback to specific backup"
        echo "  logs         - Show recent container logs"
        echo "  status       - Show container status"
        exit 1
        ;;
esac
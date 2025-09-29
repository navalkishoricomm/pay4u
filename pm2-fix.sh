#!/bin/bash

# PM2 Process Management and Fix Script
# Handles common PM2 issues and process management

set -e

# Configuration
BACKEND_PM2_NAME="pay4u-backend"
FRONTEND_PM2_NAME="pay4u-frontend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

echo "🔧 PM2 Process Management Script"
echo "==============================="
echo ""

# Function to show current PM2 status
show_status() {
    log_step "Current PM2 Status:"
    pm2 status || log_warn "No PM2 processes found"
    echo ""
}

# Function to clean up orphaned processes
cleanup_processes() {
    log_step "Cleaning up orphaned processes..."
    
    # Kill any orphaned processes
    pm2 kill 2>/dev/null || true
    
    # Clear PM2 logs and dumps
    pm2 flush
    
    # Remove PM2 dump file
    rm -f ~/.pm2/dump.pm2
    
    log_info "✅ Cleanup completed"
}

# Function to restart processes with environment update
restart_with_env() {
    log_step "Restarting processes with updated environment..."
    
    # Navigate to backend directory
    cd /var/www/pay4u/backend
    
    # Start backend with environment update
    if pm2 describe "$BACKEND_PM2_NAME" > /dev/null 2>&1; then
        log_info "Restarting existing backend process..."
        NODE_ENV=production pm2 restart "$BACKEND_PM2_NAME" --update-env
    else
        log_info "Starting new backend process..."
        NODE_ENV=production pm2 start server.js --name "$BACKEND_PM2_NAME" --update-env
    fi
    
    # Start frontend if serve is available
    if command -v serve > /dev/null 2>&1; then
        cd /var/www/pay4u/frontend
        if pm2 describe "$FRONTEND_PM2_NAME" > /dev/null 2>&1; then
            log_info "Restarting existing frontend process..."
            pm2 restart "$FRONTEND_PM2_NAME" --update-env
        else
            log_info "Starting new frontend process..."
            pm2 start serve --name "$FRONTEND_PM2_NAME" -- -s build -l 3000
        fi
    fi
    
    # Save PM2 configuration
    pm2 save
    
    log_info "✅ Processes restarted successfully"
}

# Function to fix common PM2 issues
fix_pm2_issues() {
    log_step "Fixing common PM2 issues..."
    
    # Reset PM2 God Daemon
    pm2 kill
    sleep 2
    
    # Resurrect processes from saved config
    pm2 resurrect 2>/dev/null || log_warn "No saved PM2 configuration found"
    
    log_info "✅ PM2 issues fixed"
}

# Main menu
case "${1:-}" in
    "status")
        show_status
        ;;
    "cleanup")
        cleanup_processes
        show_status
        ;;
    "restart")
        restart_with_env
        show_status
        ;;
    "fix")
        fix_pm2_issues
        show_status
        ;;
    "reset")
        log_step "Performing complete PM2 reset..."
        cleanup_processes
        fix_pm2_issues
        restart_with_env
        show_status
        ;;
    *)
        echo "Usage: $0 {status|cleanup|restart|fix|reset}"
        echo ""
        echo "Commands:"
        echo "  status   - Show current PM2 process status"
        echo "  cleanup  - Clean up orphaned processes and logs"
        echo "  restart  - Restart processes with updated environment"
        echo "  fix      - Fix common PM2 daemon issues"
        echo "  reset    - Complete reset (cleanup + fix + restart)"
        echo ""
        show_status
        exit 1
        ;;
esac

log_info "PM2 management completed! 🚀"
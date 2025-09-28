#!/bin/bash

# Pay4U Backend Deployment Script
# This script automates the deployment of the backend server

set -e  # Exit on any error

echo "🚀 Starting Pay4U Backend Deployment..."
echo "======================================"

# Configuration
APP_DIR="/var/www/pay4u"
BACKEND_DIR="$APP_DIR/backend"
PM2_APP_NAME="pay4u-backend"
GIT_REPO="https://github.com/navalkishoricomm/pay4u.git"
NODE_ENV="production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
   log_warn "Running as root. Consider using a non-root user for security."
fi

# Step 1: Navigate to application directory
log_info "Navigating to application directory: $APP_DIR"
if [ ! -d "$APP_DIR" ]; then
    log_error "Application directory $APP_DIR does not exist!"
    log_info "Creating directory and cloning repository..."
    sudo mkdir -p "$APP_DIR"
    sudo chown $USER:$USER "$APP_DIR"
    cd "$APP_DIR"
    git clone "$GIT_REPO" .
else
    cd "$APP_DIR"
fi

# Step 2: Stop existing PM2 process
log_info "Stopping existing backend process..."
pm2 stop "$PM2_APP_NAME" 2>/dev/null || log_warn "No existing process found"

# Step 3: Pull latest changes from Git
log_info "Pulling latest changes from Git..."
git fetch origin
git reset --hard origin/main
log_info "✅ Git pull completed"

# Step 4: Navigate to backend directory
log_info "Navigating to backend directory..."
cd "$BACKEND_DIR"

# Step 5: Install/Update dependencies
log_info "Installing/Updating Node.js dependencies..."
npm ci --production
log_info "✅ Dependencies installed"

# Step 6: Create/Update environment file
log_info "Setting up environment configuration..."
if [ ! -f ".env" ]; then
    log_warn "No .env file found. Creating from template..."
    cp .env.example .env 2>/dev/null || {
        log_warn "No .env.example found. Please create .env manually."
    }
fi

# Step 7: Run database migrations (if any)
log_info "Running database setup..."
# Add your database migration commands here if needed
# npm run migrate

# Step 8: Start the application with PM2
log_info "Starting backend server with PM2..."
NODE_ENV="$NODE_ENV" pm2 start server.js --name "$PM2_APP_NAME" --update-env

# Step 9: Save PM2 configuration
log_info "Saving PM2 configuration..."
pm2 save

# Step 10: Show status
log_info "Deployment completed! Checking status..."
pm2 status "$PM2_APP_NAME"

echo ""
echo "🎉 Backend deployment completed successfully!"
echo "======================================"
echo "Application: $PM2_APP_NAME"
echo "Directory: $BACKEND_DIR"
echo "Environment: $NODE_ENV"
echo ""
echo "Useful commands:"
echo "  pm2 status $PM2_APP_NAME    - Check status"
echo "  pm2 logs $PM2_APP_NAME      - View logs"
echo "  pm2 restart $PM2_APP_NAME   - Restart app"
echo "  pm2 stop $PM2_APP_NAME      - Stop app"
echo ""
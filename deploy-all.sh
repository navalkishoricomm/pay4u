#!/bin/bash

# Pay4U Complete Deployment Script
# This script deploys both backend and frontend in one command

set -e  # Exit on any error

echo "🚀 Pay4U Complete Deployment Script"
echo "==================================="
echo "This will deploy both backend and frontend"
echo ""

# Configuration
APP_DIR="/var/www/pay4u"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
WEB_DIR="/var/www/html/pay4u"
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
log_step "Checking prerequisites..."

if ! command_exists git; then
    log_error "Git is not installed"
    exit 1
fi

if ! command_exists node; then
    log_error "Node.js is not installed"
    exit 1
fi

if ! command_exists npm; then
    log_error "npm is not installed"
    exit 1
fi

if ! command_exists pm2; then
    log_error "PM2 is not installed. Install with: npm install -g pm2"
    exit 1
fi

log_info "✅ All prerequisites met"

# Check if application directory exists
if [ ! -d "$APP_DIR" ]; then
    log_error "Application directory $APP_DIR does not exist!"
    log_error "Please run the server setup script first."
    exit 1
fi

# Navigate to application directory
log_step "Navigating to application directory..."
cd "$APP_DIR"

# Create backup
log_step "Creating backup..."
BACKUP_DIR="$APP_DIR.backup.$(date +%Y%m%d_%H%M%S)"
log_info "Creating backup at $BACKUP_DIR"
cp -r "$APP_DIR" "$BACKUP_DIR" 2>/dev/null || log_warn "Backup creation failed"

# Stop existing processes
log_step "Stopping existing processes..."
pm2 stop "$BACKEND_PM2_NAME" 2>/dev/null || log_warn "Backend process not running"
pm2 stop "$FRONTEND_PM2_NAME" 2>/dev/null || log_warn "Frontend process not running"

# Pull latest changes
log_step "Pulling latest changes from Git..."
git fetch origin
git reset --hard origin/main
log_info "✅ Latest code pulled"

# Deploy Backend
log_step "Deploying Backend..."
cd "$BACKEND_DIR"

# Install/Update backend dependencies
log_info "Installing backend dependencies..."
npm ci --production

# Check if .env exists
if [ ! -f ".env" ]; then
    log_warn "No .env file found in backend directory"
    log_warn "Please create .env file with required configuration"
    if [ -f "$APP_DIR/.env.server.template" ]; then
        log_info "Copying template .env file..."
        cp "$APP_DIR/.env.server.template" ".env"
        log_warn "Please update the .env file with your actual configuration"
    fi
fi

# Start backend
log_info "Starting backend server..."
NODE_ENV=production pm2 start server.js --name "$BACKEND_PM2_NAME" --update-env

log_info "✅ Backend deployed successfully"

# Deploy Frontend
log_step "Deploying Frontend..."
cd "$FRONTEND_DIR"

# Install/Update frontend dependencies
log_info "Installing frontend dependencies..."
npm ci

# Create production environment if not exists
if [ ! -f ".env.production" ]; then
    log_warn "No .env.production file found"
    log_info "Creating default production environment..."
    cat > .env.production << EOF
REACT_APP_API_URL=https://$(hostname -f)/api
REACT_APP_SOCKET_URL=https://$(hostname -f)
REACT_APP_ENV=production
GENERATE_SOURCEMAP=false
EOF
    log_warn "Please update .env.production with your actual domain"
fi

# Build frontend
log_info "Building React application..."
NODE_ENV=production npm run build

# Deploy to web directory
log_info "Deploying to web server..."
sudo mkdir -p "$WEB_DIR"

# Backup existing web files
if [ -d "$WEB_DIR/static" ]; then
    sudo mv "$WEB_DIR" "$WEB_DIR.backup.$(date +%Y%m%d_%H%M%S)"
    sudo mkdir -p "$WEB_DIR"
fi

# Copy new build
sudo cp -r build/* "$WEB_DIR/"
sudo chown -R www-data:www-data "$WEB_DIR"
sudo chmod -R 755 "$WEB_DIR"

# Start frontend serve process (optional)
if command_exists serve; then
    log_info "Starting frontend serve process..."
    pm2 start serve --name "$FRONTEND_PM2_NAME" -- -s build -l 3000
else
    log_warn "'serve' not installed. Frontend will be served by Nginx only."
fi

log_info "✅ Frontend deployed successfully"

# Save PM2 configuration
log_step "Saving PM2 configuration..."
pm2 save

# Reload Nginx if available
if command_exists nginx; then
    log_step "Reloading Nginx..."
    sudo nginx -t && sudo systemctl reload nginx
    log_info "✅ Nginx reloaded"
else
    log_warn "Nginx not found. Please reload your web server manually."
fi

# Health check
log_step "Performing health check..."
sleep 5

# Check backend health
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    log_info "✅ Backend health check passed"
else
    log_warn "⚠️ Backend health check failed"
fi

# Check frontend health
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    log_info "✅ Frontend health check passed"
else
    log_warn "⚠️ Frontend health check failed (may be normal if using Nginx only)"
fi

# Show final status
log_step "Deployment Status"
pm2 status

echo ""
echo "🎉 Complete Deployment Finished!"
echo "================================"
echo "Timestamp: $(date)"
echo "Backend: $BACKEND_PM2_NAME"
echo "Frontend: $FRONTEND_PM2_NAME"
echo "Web Directory: $WEB_DIR"
echo "Backup Created: $BACKUP_DIR"
echo ""
echo "Next Steps:"
echo "1. Test your application: https://your-domain.com"
echo "2. Check logs if needed: pm2 logs"
echo "3. Monitor status: pm2 monit"
echo ""
echo "Useful Commands:"
echo "  pm2 status                    - Check all processes"
echo "  pm2 logs                      - View all logs"
echo "  pm2 restart $BACKEND_PM2_NAME  - Restart backend"
echo "  pm2 restart $FRONTEND_PM2_NAME - Restart frontend"
echo "  sudo systemctl status nginx   - Check Nginx status"
echo ""

# Cleanup old backups (keep last 5)
log_step "Cleaning up old backups..."
find "$(dirname $APP_DIR)" -name "$(basename $APP_DIR).backup.*" -type d | sort -r | tail -n +6 | xargs rm -rf 2>/dev/null || true
log_info "✅ Old backups cleaned up"

log_info "Deployment completed successfully! 🚀"
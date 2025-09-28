#!/bin/bash

# Pay4U Frontend Deployment Script
# This script automates the deployment of the React frontend

set -e  # Exit on any error

echo "🚀 Starting Pay4U Frontend Deployment..."
echo "======================================"

# Configuration
APP_DIR="/var/www/pay4u"
FRONTEND_DIR="$APP_DIR/frontend"
BUILD_DIR="$FRONTEND_DIR/build"
NGINX_DIR="/var/www/html/pay4u"
PM2_APP_NAME="pay4u-frontend"
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
    log_error "Please run the backend deployment script first."
    exit 1
fi

cd "$APP_DIR"

# Step 2: Pull latest changes (should already be done by backend script)
log_info "Ensuring latest code is available..."
git status

# Step 3: Navigate to frontend directory
log_info "Navigating to frontend directory..."
cd "$FRONTEND_DIR"

# Step 4: Install/Update dependencies
log_info "Installing/Updating Node.js dependencies..."
npm ci --production=false
log_info "✅ Dependencies installed"

# Step 5: Create production environment file
log_info "Setting up production environment..."
cat > .env.production << EOF
# Production Environment Configuration
REACT_APP_API_URL=https://your-domain.com/api
REACT_APP_SOCKET_URL=https://your-domain.com
REACT_APP_ENV=production
GENERATE_SOURCEMAP=false
EOF

log_info "✅ Production environment configured"

# Step 6: Build the React application
log_info "Building React application for production..."
NODE_ENV=production npm run build
log_info "✅ Build completed successfully"

# Step 7: Deploy to web server directory
log_info "Deploying to web server directory..."

# Create nginx directory if it doesn't exist
sudo mkdir -p "$NGINX_DIR"

# Backup existing deployment (if any)
if [ -d "$NGINX_DIR/static" ]; then
    log_info "Creating backup of existing deployment..."
    sudo mv "$NGINX_DIR" "$NGINX_DIR.backup.$(date +%Y%m%d_%H%M%S)"
    sudo mkdir -p "$NGINX_DIR"
fi

# Copy build files to nginx directory
log_info "Copying build files to $NGINX_DIR..."
sudo cp -r "$BUILD_DIR"/* "$NGINX_DIR/"
sudo chown -R www-data:www-data "$NGINX_DIR"
sudo chmod -R 755 "$NGINX_DIR"

log_info "✅ Files deployed to web server"

# Step 8: Optional - Start with serve for development/testing
log_info "Setting up serve process with PM2 (optional)..."
npm install -g serve 2>/dev/null || log_warn "Serve already installed or failed to install"

# Stop existing serve process
pm2 stop "$PM2_APP_NAME" 2>/dev/null || log_warn "No existing frontend process found"

# Start serve process
pm2 start serve --name "$PM2_APP_NAME" -- -s "$BUILD_DIR" -l 3000

# Step 9: Save PM2 configuration
log_info "Saving PM2 configuration..."
pm2 save

# Step 10: Test the deployment
log_info "Testing deployment..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    log_info "✅ Frontend is accessible on port 3000"
else
    log_warn "Frontend may not be accessible on port 3000"
fi

# Step 11: Reload nginx (if configured)
if command -v nginx > /dev/null 2>&1; then
    log_info "Reloading nginx configuration..."
    sudo nginx -t && sudo systemctl reload nginx
    log_info "✅ Nginx reloaded"
else
    log_warn "Nginx not found. Please configure your web server manually."
fi

echo ""
echo "🎉 Frontend deployment completed successfully!"
echo "======================================"
echo "Build Directory: $BUILD_DIR"
echo "Web Directory: $NGINX_DIR"
echo "PM2 Process: $PM2_APP_NAME"
echo ""
echo "Access your application:"
echo "  Local (serve): http://localhost:3000"
echo "  Web Server: http://your-domain.com"
echo ""
echo "Useful commands:"
echo "  pm2 status $PM2_APP_NAME     - Check status"
echo "  pm2 logs $PM2_APP_NAME       - View logs"
echo "  pm2 restart $PM2_APP_NAME    - Restart serve"
echo "  sudo systemctl status nginx  - Check nginx status"
echo ""
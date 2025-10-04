#!/bin/bash

# TraePay4U Production Deployment Script
# Run this script on your production server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 TraePay4U Production Deployment${NC}"
echo -e "${BLUE}====================================${NC}"

# Configuration - UPDATE THESE VALUES
APP_DIR="/var/www/pay4u"  # Change this to your app directory
BACKUP_DIR="/var/backups/pay4u"
GIT_REPO="https://github.com/yourusername/traePay4U.git"  # Update with your repo URL
BRANCH="main"  # or master

# Function to print status
print_status() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run this script with sudo or as root${NC}"
    exit 1
fi

print_status "Step 1: Creating backup..."
BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/$BACKUP_TIMESTAMP"

mkdir -p "$BACKUP_PATH"
if [ -d "$APP_DIR" ]; then
    cp -r "$APP_DIR"/* "$BACKUP_PATH/" 2>/dev/null || true
    print_success "Backup created at $BACKUP_PATH"
else
    print_status "No existing app directory found, creating new deployment"
fi

print_status "Step 2: Pulling latest code..."
if [ -d "$APP_DIR/.git" ]; then
    cd "$APP_DIR"
    git fetch origin
    git reset --hard origin/$BRANCH
    print_success "Code updated from Git repository"
else
    print_status "Cloning repository..."
    rm -rf "$APP_DIR"
    git clone "$GIT_REPO" "$APP_DIR"
    cd "$APP_DIR"
    git checkout "$BRANCH"
    print_success "Repository cloned successfully"
fi

print_status "Step 3: Installing backend dependencies..."
cd "$APP_DIR/backend"
npm install --production
print_success "Backend dependencies installed"

print_status "Step 4: Building frontend..."
cd "$APP_DIR/frontend"
npm install
npm run build
print_success "Frontend built successfully"

print_status "Step 5: Setting up environment..."
cd "$APP_DIR/backend"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    cat > .env << EOF
NODE_ENV=production
PORT=5001
DATABASE_URI=mongodb://localhost:27017/pay4u
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90
EOF
    print_status "Created default .env file - PLEASE UPDATE WITH YOUR VALUES!"
    echo -e "${RED}⚠️  IMPORTANT: Update the .env file with your actual values before proceeding!${NC}"
fi

print_status "Step 6: Running admin user setup..."
if [ -f "serverAdminReset.js" ]; then
    node serverAdminReset.js
    print_success "Admin user setup completed"
else
    print_error "serverAdminReset.js not found"
fi

print_status "Step 7: Managing application process..."

# Stop existing processes
if command -v pm2 &> /dev/null; then
    pm2 stop pay4u-backend 2>/dev/null || true
    pm2 delete pay4u-backend 2>/dev/null || true
    
    # Start with PM2
    pm2 start app.js --name "pay4u-backend" --env production
    pm2 save
    pm2 startup
    print_success "Application started with PM2"
else
    # Kill existing node processes (be careful with this)
    pkill -f "node.*app.js" 2>/dev/null || true
    
    # Start in background
    nohup node app.js > /var/log/pay4u-backend.log 2>&1 &
    print_success "Application started in background"
fi

print_status "Step 8: Setting up frontend serving..."
# Copy frontend build to web server directory (adjust path as needed)
if [ -d "/var/www/html" ]; then
    cp -r "$APP_DIR/frontend/build"/* "/var/www/html/"
    print_success "Frontend deployed to /var/www/html"
else
    print_status "Web server directory not found. Frontend build available at: $APP_DIR/frontend/build"
fi

print_status "Step 9: Final checks..."
sleep 3

# Check if backend is running
if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
    print_success "Backend is running on port 5001"
else
    print_error "Backend may not be running properly - check logs"
fi

echo -e "\n${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "\n${BLUE}📋 Deployment Summary:${NC}"
echo -e "${BLUE}Backend URL: http://your-server:5001${NC}"
echo -e "${BLUE}Frontend URL: http://your-server${NC}"
echo -e "${BLUE}Admin Credentials: admin@pay4u.co.in / admin123456${NC}"
echo -e "\n${YELLOW}⚠️  Post-Deployment Tasks:${NC}"
echo -e "1. Update .env file with your actual MongoDB URI and JWT secret"
echo -e "2. Configure your web server (Nginx/Apache) for production"
echo -e "3. Set up SSL certificates (Let's Encrypt recommended)"
echo -e "4. Configure firewall rules (allow ports 80, 443, 5001)"
echo -e "5. Set up monitoring and log rotation"
echo -e "\n${YELLOW}📊 Useful Commands:${NC}"
echo -e "View backend logs: pm2 logs pay4u-backend"
echo -e "Restart backend: pm2 restart pay4u-backend"
echo -e "Check status: pm2 status"
echo -e "\n${GREEN}Deployment script completed!${NC}"
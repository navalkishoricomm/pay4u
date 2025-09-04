#!/bin/bash

# 🚀 Backend Service Fix Script
# This script provides alternative ways to start the backend when ecosystem.config.js is missing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🚀 Pay4U Backend Service Fix"
echo "============================"
echo ""

print_status "Checking current directory and backend files..."

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    print_error "Backend directory not found. Please navigate to your project root directory."
    echo "  Example: cd /opt/pay4u/app or cd /path/to/your/project"
    exit 1
fi

if [ ! -f "backend/server.js" ]; then
    print_error "Backend server.js not found in backend directory."
    exit 1
fi

print_success "Backend files found"

# Stop any existing backend processes
print_status "Stopping existing backend processes..."
pm2 stop pay4u-backend 2>/dev/null || echo "No existing pay4u-backend process found"
pm2 delete pay4u-backend 2>/dev/null || echo "No existing pay4u-backend process to delete"

# Method 1: Start with PM2 directly (recommended)
print_status "Starting backend with PM2 directly..."
cd backend

# Start the backend service with PM2
pm2 start server.js --name "pay4u-backend" \
  --instances max \
  --exec-mode cluster \
  --env NODE_ENV=production \
  --env PORT=5000 \
  --max-memory-restart 1G \
  --restart-delay 4000 \
  --max-restarts 10 \
  --min-uptime 10s \
  --no-autorestart false

if [ $? -eq 0 ]; then
    print_success "Backend started successfully with PM2"
    
    # Save PM2 configuration
    pm2 save
    
    # Show PM2 status
    echo ""
    print_status "Current PM2 status:"
    pm2 status
    
    echo ""
    print_status "Testing backend health..."
    sleep 3
    
    # Test the backend
    HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health 2>/dev/null || echo "000")
    if [ "$HEALTH_RESPONSE" = "200" ]; then
        print_success "Backend health check passed (HTTP $HEALTH_RESPONSE)"
        echo ""
        print_success "🎉 Backend is now running successfully!"
        echo ""
        echo "You can now:"
        echo "1. Test login: curl -X POST http://localhost:5000/api/auth/login -H 'Content-Type: application/json' -d '{\"username\":\"admin\",\"password\":\"your-password\"}'"
        echo "2. Test external access: curl https://pay4u.co.in:5000/api/health"
        echo "3. Check logs: pm2 logs pay4u-backend"
        echo "4. Monitor: pm2 monit"
    else
        print_error "Backend health check failed (HTTP $HEALTH_RESPONSE)"
        echo "Check logs with: pm2 logs pay4u-backend"
    fi
else
    print_error "Failed to start backend with PM2"
    echo ""
    print_status "Trying alternative method - direct Node.js start..."
    
    # Method 2: Direct Node.js start (fallback)
    echo "Starting backend directly with Node.js..."
    echo "Note: This will run in foreground. Press Ctrl+C to stop."
    echo "For production, use PM2 method above."
    echo ""
    
    NODE_ENV=production PORT=5000 node server.js
fi

echo ""
print_status "Backend service management complete."
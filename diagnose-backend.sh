#!/bin/bash

# 🔍 Backend Diagnostic Script for Pay4U
# This script diagnoses backend API issues and provides solutions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🔍 Pay4U Backend Diagnostic Tool"
echo "================================="
echo ""

# Check 1: PM2 Status
print_status "Checking PM2 process status..."
if command -v pm2 &> /dev/null; then
    PM2_STATUS=$(pm2 jlist 2>/dev/null || echo "[]")
    if echo "$PM2_STATUS" | grep -q "pay4u"; then
        print_success "PM2 processes found"
        pm2 status | grep pay4u || true
    else
        print_error "No Pay4U processes found in PM2"
        echo "  Solution: Start backend with 'pm2 start ecosystem.config.js --env production'"
    fi
else
    print_error "PM2 not installed"
    echo "  Solution: Install PM2 with 'npm install -g pm2'"
fi

echo ""

# Check 2: Port 5000 Status
print_status "Checking if port 5000 is in use..."
PORT_CHECK=$(netstat -tlnp 2>/dev/null | grep :5000 || echo "")
if [ -n "$PORT_CHECK" ]; then
    print_success "Port 5000 is in use"
    echo "$PORT_CHECK"
else
    print_error "Port 5000 is not in use"
    echo "  Solution: Backend service is not running"
fi

echo ""

# Check 3: Backend Health Test
print_status "Testing backend health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health 2>/dev/null || echo "000")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    print_success "Backend health endpoint responding (HTTP $HEALTH_RESPONSE)"
    curl -s http://localhost:5000/api/health | jq . 2>/dev/null || curl -s http://localhost:5000/api/health
else
    print_error "Backend health endpoint not responding (HTTP $HEALTH_RESPONSE)"
    echo "  Solution: Backend service needs to be started or restarted"
fi

echo ""

# Check 4: External HTTPS Access
print_status "Testing external HTTPS access..."
HTTPS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://pay4u.co.in:5000/api/health 2>/dev/null || echo "000")
if [ "$HTTPS_RESPONSE" = "200" ]; then
    print_success "External HTTPS access working (HTTP $HTTPS_RESPONSE)"
else
    print_error "External HTTPS access failing (HTTP $HTTPS_RESPONSE)"
    echo "  Possible causes: Firewall blocking port 5000, SSL certificate issues, or backend not running"
fi

echo ""

# Check 5: Nginx Configuration
print_status "Checking Nginx configuration..."
if command -v nginx &> /dev/null; then
    NGINX_TEST=$(nginx -t 2>&1)
    if echo "$NGINX_TEST" | grep -q "successful"; then
        print_success "Nginx configuration is valid"
    else
        print_error "Nginx configuration has issues"
        echo "$NGINX_TEST"
    fi
    
    # Check if Nginx is running
    if systemctl is-active --quiet nginx; then
        print_success "Nginx service is running"
    else
        print_error "Nginx service is not running"
        echo "  Solution: Start Nginx with 'sudo systemctl start nginx'"
    fi
else
    print_warning "Nginx not found or not accessible"
fi

echo ""

# Check 6: MongoDB Status
print_status "Checking MongoDB status..."
if systemctl is-active --quiet mongod; then
    print_success "MongoDB service is running"
elif systemctl is-active --quiet mongodb; then
    print_success "MongoDB service is running"
else
    print_error "MongoDB service is not running"
    echo "  Solution: Start MongoDB with 'sudo systemctl start mongod'"
fi

echo ""

# Provide Quick Fix Commands
echo "🔧 Quick Fix Commands:"
echo "====================="
echo ""
echo "1. Restart Backend Service:"
echo "   pm2 restart pay4u-backend"
echo ""
echo "2. Start Backend if not running:"
echo "   cd /path/to/project/backend"
echo "   pm2 start ecosystem.config.js --env production"
echo "   pm2 save"
echo ""
echo "3. Check Backend Logs:"
echo "   pm2 logs pay4u-backend --lines 20"
echo ""
echo "4. Test Backend Manually:"
echo "   curl http://localhost:5000/api/health"
echo "   curl https://pay4u.co.in:5000/api/health"
echo ""
echo "5. Restart All Services:"
echo "   sudo systemctl restart nginx"
echo "   pm2 restart all"
echo ""

print_status "Diagnostic complete. Check the results above for issues and solutions."
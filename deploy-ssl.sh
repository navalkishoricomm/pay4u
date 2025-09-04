#!/bin/bash

# SSL Deployment Script for Pay4U
# Run this script on your Linux server after pulling from Git

set -e  # Exit on any error

echo "🚀 Pay4U SSL Deployment Script"
echo "=============================="
echo ""

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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

# Variables
PROJECT_DIR="/var/www/pay4u"
DOMAIN="pay4u.co.in"

print_status "Starting SSL deployment for $DOMAIN"

# Step 1: Navigate to project directory
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Project directory $PROJECT_DIR not found!"
    exit 1
fi

cd "$PROJECT_DIR"
print_success "Changed to project directory: $PROJECT_DIR"

# Step 2: Stop services
print_status "Stopping services..."
if command -v pm2 &> /dev/null; then
    pm2 stop all || print_warning "PM2 stop failed or no processes running"
fi

if systemctl is-active --quiet pay4u; then
    systemctl stop pay4u || print_warning "Failed to stop pay4u service"
fi

# Step 3: Pull latest changes
print_status "Pulling latest changes from Git..."
git pull origin main || git pull origin master
print_success "Git pull completed"

# Step 4: Configure Nginx for SSL
print_status "Configuring Nginx for SSL..."

# Check if SSL certificate exists
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    print_error "SSL certificate not found for $DOMAIN"
    print_error "Please run: sudo certbot --nginx -d $DOMAIN"
    exit 1
fi

# Create Nginx SSL configuration
cat > /etc/nginx/sites-available/pay4u << 'EOF'
server {
    listen 80;
    server_name pay4u.co.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pay4u.co.in;

    ssl_certificate /etc/letsencrypt/live/pay4u.co.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pay4u.co.in/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Frontend
    location / {
        root /var/www/pay4u/frontend/build;
        try_files $uri $uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
}
EOF

print_success "Nginx SSL configuration created"

# Test Nginx configuration
print_status "Testing Nginx configuration..."
if nginx -t; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# Step 5: Build Frontend
print_status "Building frontend..."
cd "$PROJECT_DIR/frontend"

if [ -f "package.json" ]; then
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    # Build frontend
    npm run build
    print_success "Frontend built successfully"
else
    print_warning "Frontend package.json not found"
fi

# Step 6: Install Backend Dependencies
print_status "Setting up backend..."
cd "$PROJECT_DIR/backend"

if [ -f "package.json" ]; then
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing backend dependencies..."
        npm install
    fi
    print_success "Backend dependencies ready"
else
    print_warning "Backend package.json not found"
fi

# Step 7: Start Services
print_status "Starting services..."

# Reload Nginx
systemctl reload nginx
if systemctl is-active --quiet nginx; then
    print_success "Nginx reloaded successfully"
else
    print_error "Failed to reload Nginx"
    systemctl status nginx
    exit 1
fi

# Start backend
cd "$PROJECT_DIR/backend"
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js
elif [ -f "server.js" ]; then
    pm2 start server.js --name "pay4u-backend"
else
    print_warning "No server file found to start"
fi

# Save PM2 configuration
pm2 save
print_success "Backend services started"

# Step 8: Test SSL Setup
print_status "Testing SSL setup..."

echo ""
echo "🧪 Running SSL Tests..."
echo "====================="

# Test HTTPS response
print_status "Testing HTTPS response..."
if curl -I -s --connect-timeout 10 "https://$DOMAIN" | grep -q "200 OK\|301\|302"; then
    print_success "HTTPS is responding"
else
    print_warning "HTTPS test failed or returned unexpected response"
fi

# Test HTTP to HTTPS redirect
print_status "Testing HTTP to HTTPS redirect..."
if curl -I -s --connect-timeout 10 "http://$DOMAIN" | grep -q "301\|302"; then
    print_success "HTTP to HTTPS redirect is working"
else
    print_warning "HTTP to HTTPS redirect test failed"
fi

# Test API endpoint
print_status "Testing API endpoint..."
if curl -I -s --connect-timeout 10 "https://$DOMAIN/api/health" | grep -q "200 OK\|404"; then
    print_success "API endpoint is accessible via HTTPS"
else
    print_warning "API endpoint test failed"
fi

# Show PM2 status
print_status "Backend service status:"
pm2 status

echo ""
echo "✅ SSL Deployment Complete!"
echo "==========================="
echo ""
print_success "Your Pay4U application is now SSL-enabled!"
print_success "Visit: https://$DOMAIN"
echo ""
print_status "Next steps:"
echo "1. Test the application thoroughly"
echo "2. Test geolocation functionality"
echo "3. Monitor logs for any issues"
echo ""
print_status "Monitoring commands:"
echo "- Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "- Backend logs: pm2 logs"
echo "- SSL certificate: sudo certbot certificates"
echo ""
print_success "🎉 Geolocation API should now work with HTTPS! 🎉"
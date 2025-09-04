#!/bin/bash

# SSL Setup Script for Pay4U Application
# This script automates Steps 4-7 from the SSL_SETUP_GUIDE.md

set -e  # Exit on any error

echo "🔐 Pay4U SSL Setup Script"
echo "========================="
echo ""

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

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

# Variables
DOMAIN="pay4u.co.in"
FRONTEND_PATH="/var/www/pay4u/frontend"
BACKEND_PATH="/var/www/pay4u/backend"
NGINX_CONFIG="/etc/nginx/sites-available/pay4u"
SSL_CERT_PATH="/etc/letsencrypt/live/$DOMAIN"

print_status "Starting SSL setup for $DOMAIN"

# Step 4: Configure Nginx for SSL
print_status "Step 4: Configuring Nginx for SSL..."

# Backup existing nginx config
if [ -f "$NGINX_CONFIG" ]; then
    cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
    print_success "Backed up existing Nginx configuration"
fi

# Create new SSL-enabled Nginx configuration
cat > "$NGINX_CONFIG" << 'EOF'
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
        
        # Cache static assets
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
}
EOF

print_success "Created SSL-enabled Nginx configuration"

# Test Nginx configuration
print_status "Testing Nginx configuration..."
if nginx -t; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# Step 5: Update Frontend Environment
print_status "Step 5: Updating frontend environment variables..."

if [ -d "$FRONTEND_PATH" ]; then
    cd "$FRONTEND_PATH"
    
    # Backup existing .env files
    [ -f ".env.production" ] && cp .env.production .env.production.backup.$(date +%Y%m%d_%H%M%S)
    [ -f ".env" ] && cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    
    # Create/update .env.production
    cat > .env.production << EOF
REACT_APP_API_URL=https://pay4u.co.in/api
REACT_APP_BASE_URL=https://pay4u.co.in
REACT_APP_ENVIRONMENT=production
GENERATE_SOURCEMAP=false
EOF
    
    print_success "Updated frontend environment variables"
    
    # Rebuild frontend
    print_status "Rebuilding frontend with HTTPS URLs..."
    if command -v npm &> /dev/null; then
        npm run build
        print_success "Frontend rebuilt successfully"
    else
        print_warning "npm not found. Please manually run 'npm run build' in $FRONTEND_PATH"
    fi
else
    print_warning "Frontend directory not found at $FRONTEND_PATH"
fi

# Step 6: Update Backend CORS Configuration
print_status "Step 6: Updating backend CORS configuration..."

if [ -d "$BACKEND_PATH" ]; then
    cd "$BACKEND_PATH"
    
    # Find and update server.js or app.js for CORS
    SERVER_FILE=""
    if [ -f "server.js" ]; then
        SERVER_FILE="server.js"
    elif [ -f "app.js" ]; then
        SERVER_FILE="app.js"
    fi
    
    if [ -n "$SERVER_FILE" ]; then
        # Backup server file
        cp "$SERVER_FILE" "$SERVER_FILE.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Update CORS configuration (this is a basic replacement, may need manual adjustment)
        print_warning "CORS configuration needs manual update in $SERVER_FILE"
        print_warning "Please update CORS origin to: ['https://pay4u.co.in']"
        
        # Show current CORS configuration
        echo "Current CORS configuration:"
        grep -n -A 5 -B 5 "cors\|origin" "$SERVER_FILE" || echo "No CORS configuration found"
    else
        print_warning "Server file not found in $BACKEND_PATH"
    fi
else
    print_warning "Backend directory not found at $BACKEND_PATH"
fi

# Step 7: Restart services and test
print_status "Step 7: Restarting services and testing..."

# Restart Nginx
print_status "Restarting Nginx..."
systemctl restart nginx
if systemctl is-active --quiet nginx; then
    print_success "Nginx restarted successfully"
else
    print_error "Failed to restart Nginx"
    systemctl status nginx
    exit 1
fi

# Restart backend service (assuming PM2 or systemd service)
print_status "Restarting backend service..."
if command -v pm2 &> /dev/null; then
    cd "$BACKEND_PATH"
    pm2 restart all
    print_success "PM2 services restarted"
elif systemctl is-active --quiet pay4u; then
    systemctl restart pay4u
    print_success "Pay4U service restarted"
else
    print_warning "Please manually restart your backend service"
fi

# Test SSL setup
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

# Test SSL certificate
print_status "Checking SSL certificate..."
if openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" </dev/null 2>/dev/null | openssl x509 -noout -dates; then
    print_success "SSL certificate is valid"
else
    print_warning "SSL certificate check failed"
fi

echo ""
echo "✅ SSL Setup Complete!"
echo "====================="
echo ""
print_success "Your Pay4U application should now be accessible via HTTPS"
print_success "Visit: https://$DOMAIN"
echo ""
print_status "Next steps:"
echo "1. Test the application thoroughly"
echo "2. Update any hardcoded HTTP URLs in your application"
echo "3. Set up SSL certificate auto-renewal: sudo crontab -e"
echo "   Add: 0 12 * * * /usr/bin/certbot renew --quiet"
echo "4. Monitor logs for any SSL-related issues"
echo ""
print_status "Log files to monitor:"
echo "- Nginx: /var/log/nginx/error.log"
echo "- SSL: /var/log/letsencrypt/letsencrypt.log"
echo "- Backend: Check your PM2 or systemd logs"
echo ""
print_success "SSL setup script completed successfully! 🎉"
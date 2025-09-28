#!/bin/bash

# Pay4U Server Setup Script
# This script sets up a fresh Ubuntu/Debian server for Pay4U application

set -e  # Exit on any error

echo "🚀 Pay4U Server Setup Script"
echo "==========================="
echo "This script will install and configure:"
echo "  - Node.js & npm"
echo "  - MongoDB"
echo "  - PM2 Process Manager"
echo "  - Nginx Web Server"
echo "  - SSL Certificate (Let's Encrypt)"
echo "  - Firewall Configuration"
echo ""

# Configuration
DOMAIN="your-domain.com"  # Change this to your actual domain
APP_DIR="/var/www/pay4u"
GIT_REPO="https://github.com/navalkishoricomm/pay4u.git"
NODE_VERSION="18"  # LTS version

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

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root (use sudo)"
   exit 1
fi

# Get non-root user
if [ -z "$SUDO_USER" ]; then
    read -p "Enter the username for the application: " APP_USER
else
    APP_USER="$SUDO_USER"
fi

log_info "Setting up Pay4U for user: $APP_USER"

# Step 1: Update system
log_step "Updating system packages..."
apt update && apt upgrade -y
log_info "✅ System updated"

# Step 2: Install essential packages
log_step "Installing essential packages..."
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
log_info "✅ Essential packages installed"

# Step 3: Install Node.js
log_step "Installing Node.js $NODE_VERSION..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt install -y nodejs
log_info "✅ Node.js $(node --version) installed"
log_info "✅ npm $(npm --version) installed"

# Step 4: Install MongoDB
log_step "Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod
log_info "✅ MongoDB installed and started"

# Step 5: Install PM2
log_step "Installing PM2 Process Manager..."
npm install -g pm2
pm2 startup
log_info "✅ PM2 installed"

# Step 6: Install Nginx
log_step "Installing Nginx..."
apt install -y nginx
systemctl start nginx
systemctl enable nginx
log_info "✅ Nginx installed and started"

# Step 7: Configure Firewall
log_step "Configuring UFW Firewall..."
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 3000  # For development
ufw allow 5000  # Backend API
log_info "✅ Firewall configured"

# Step 8: Create application directory
log_step "Setting up application directory..."
mkdir -p "$APP_DIR"
chown "$APP_USER":"$APP_USER" "$APP_DIR"
log_info "✅ Application directory created: $APP_DIR"

# Step 9: Clone repository
log_step "Cloning Pay4U repository..."
sudo -u "$APP_USER" git clone "$GIT_REPO" "$APP_DIR"
log_info "✅ Repository cloned"

# Step 10: Install application dependencies
log_step "Installing application dependencies..."
cd "$APP_DIR/backend"
sudo -u "$APP_USER" npm install
cd "$APP_DIR/frontend"
sudo -u "$APP_USER" npm install
log_info "✅ Application dependencies installed"

# Step 11: Create environment files
log_step "Creating environment configuration..."
cat > "$APP_DIR/backend/.env" << EOF
# Pay4U Backend Configuration
PORT=5000
MONGO_URI=mongodb://localhost:27017/pay4u
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=production

# API Keys (Update these with your actual keys)
RECHARGE_API_KEY=your_recharge_api_key
BILL_PAYMENT_API_KEY=your_bill_payment_api_key
DMT_API_KEY=your_dmt_api_key
AEPS_API_KEY=your_aeps_api_key

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# SMS Configuration
SMS_API_KEY=your_sms_api_key
SMS_SENDER_ID=PAY4U
EOF

cat > "$APP_DIR/frontend/.env.production" << EOF
# Pay4U Frontend Production Configuration
REACT_APP_API_URL=https://$DOMAIN/api
REACT_APP_SOCKET_URL=https://$DOMAIN
REACT_APP_ENV=production
GENERATE_SOURCEMAP=false
EOF

chown "$APP_USER":"$APP_USER" "$APP_DIR/backend/.env"
chown "$APP_USER":"$APP_USER" "$APP_DIR/frontend/.env.production"
log_info "✅ Environment files created"

# Step 12: Configure Nginx
log_step "Configuring Nginx..."
cat > /etc/nginx/sites-available/pay4u << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration (will be updated by certbot)
    ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Frontend (React build)
    location / {
        root /var/www/html/pay4u;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)\$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/pay4u /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
log_info "✅ Nginx configured"

# Step 13: Install SSL Certificate
log_step "Installing SSL certificate..."
apt install -y certbot python3-certbot-nginx
log_warn "SSL certificate setup requires manual intervention."
log_info "Run the following command after DNS is configured:"
log_info "certbot --nginx -d $DOMAIN -d www.$DOMAIN"

# Step 14: Create deployment scripts
log_step "Making deployment scripts executable..."
chmod +x "$APP_DIR/deploy-backend.sh"
chmod +x "$APP_DIR/deploy-frontend.sh"
chmod +x "$APP_DIR/server-setup.sh"
log_info "✅ Deployment scripts ready"

# Step 15: Initial deployment
log_step "Running initial deployment..."
cd "$APP_DIR"
sudo -u "$APP_USER" ./deploy-backend.sh
sudo -u "$APP_USER" ./deploy-frontend.sh

echo ""
echo "🎉 Pay4U Server Setup Completed!"
echo "================================"
echo "Server Configuration:"
echo "  Domain: $DOMAIN"
echo "  App Directory: $APP_DIR"
echo "  User: $APP_USER"
echo ""
echo "Next Steps:"
echo "1. Configure your domain DNS to point to this server"
echo "2. Run: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "3. Update API keys in $APP_DIR/backend/.env"
echo "4. Configure MongoDB authentication (recommended)"
echo "5. Set up monitoring and backups"
echo ""
echo "Application URLs:"
echo "  Frontend: https://$DOMAIN"
echo "  Backend API: https://$DOMAIN/api"
echo ""
echo "Management Commands:"
echo "  Deploy Backend: cd $APP_DIR && ./deploy-backend.sh"
echo "  Deploy Frontend: cd $APP_DIR && ./deploy-frontend.sh"
echo "  PM2 Status: pm2 status"
echo "  Nginx Status: systemctl status nginx"
echo "  MongoDB Status: systemctl status mongod"
echo ""
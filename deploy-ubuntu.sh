#!/bin/bash

# Pay4U Ubuntu 24.04 Deployment Script
# This script automates the deployment of Pay4U application on Ubuntu 24.04

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="pay4u"
APP_USER="pay4u"
APP_DIR="/opt/pay4u"
APP_PATH="$APP_DIR/app"
LOG_DIR="$APP_DIR/logs"
BACKUP_DIR="$APP_DIR/backups"
REPO_URL="https://github.com/navalkishoricomm/pay4u.git"
DOMAIN="pay4u.co.in"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

check_ubuntu() {
    if ! grep -q "Ubuntu 24.04" /etc/os-release; then
        log_warning "This script is designed for Ubuntu 24.04. Proceeding anyway..."
    fi
}

update_system() {
    log_info "Updating system packages..."
    apt update && apt upgrade -y
    log_success "System updated successfully"
}

install_nodejs() {
    log_info "Installing Node.js 18.x..."
    
    # Check if Node.js is already installed
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ $NODE_VERSION -ge 18 ]]; then
            log_success "Node.js $NODE_VERSION is already installed"
            return
        fi
    fi
    
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    # Verify installation
    node --version
    npm --version
    log_success "Node.js installed successfully"
}

install_mongodb() {
    log_info "Installing MongoDB 6.0..."
    
    # Check if MongoDB is already installed
    if systemctl is-active --quiet mongod; then
        log_success "MongoDB is already installed and running"
        return
    fi
    
    # Import MongoDB public GPG key
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
    
    # Add MongoDB repository
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-6.0.list
    
    # Update and install
    apt update
    apt install -y mongodb-org
    
    # Start and enable MongoDB
    systemctl start mongod
    systemctl enable mongod
    
    log_success "MongoDB installed and started successfully"
}

install_nginx() {
    log_info "Installing Nginx..."
    
    if systemctl is-active --quiet nginx; then
        log_success "Nginx is already installed and running"
        return
    fi
    
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    
    log_success "Nginx installed and started successfully"
}

install_pm2() {
    log_info "Installing PM2..."
    
    if command -v pm2 &> /dev/null; then
        log_success "PM2 is already installed"
        return
    fi
    
    npm install -g pm2
    log_success "PM2 installed successfully"
}

install_git() {
    log_info "Installing Git..."
    
    if command -v git &> /dev/null; then
        log_success "Git is already installed"
        return
    fi
    
    apt install -y git
    log_success "Git installed successfully"
}

create_app_user() {
    log_info "Creating application user..."
    
    if id "$APP_USER" &>/dev/null; then
        log_success "User $APP_USER already exists"
    else
        adduser --system --group --home $APP_DIR $APP_USER
        log_success "User $APP_USER created successfully"
    fi
    
    # Create directories
    mkdir -p $APP_DIR $LOG_DIR $BACKUP_DIR
    chown -R $APP_USER:$APP_USER $APP_DIR
}

clone_repository() {
    log_info "Cloning application repository..."
    
    if [[ -d "$APP_PATH" ]]; then
        log_info "Repository already exists, pulling latest changes..."
        
        # Fix Git ownership issues
        log_info "Fixing Git repository ownership..."
        chown -R $APP_USER:$APP_USER $APP_PATH
        sudo -u $APP_USER git config --global --add safe.directory $APP_PATH
        
        cd $APP_PATH
        sudo -u $APP_USER git pull
    else
        log_info "Cloning fresh repository..."
        sudo -u $APP_USER git clone $REPO_URL $APP_PATH
        
        # Set proper ownership
        chown -R $APP_USER:$APP_USER $APP_PATH
        sudo -u $APP_USER git config --global --add safe.directory $APP_PATH
    fi
    
    log_success "Repository cloned/updated successfully"
}

setup_environment() {
    log_info "Setting up environment variables..."
    
    # Backend environment
    if [[ ! -f "$APP_PATH/backend/.env" ]]; then
        # Check if .env.production exists
        if [[ -f "$APP_PATH/backend/.env.production" ]]; then
            sudo -u $APP_USER cp $APP_PATH/backend/.env.production $APP_PATH/backend/.env
            log_success "Copied .env.production to .env"
        else
            log_error "Environment file .env.production not found at $APP_PATH/backend/.env.production"
            log_info "Creating basic .env file..."
            
            # Create basic .env file
            sudo -u $APP_USER cat > $APP_PATH/backend/.env << EOF
# Production Environment Configuration
# Database
MONGO_URI=mongodb://localhost:27017/pay4u_production

# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Configuration
JWT_SECRET=temp_jwt_secret_change_this
JWT_EXPIRE=7d

# CORS Configuration
CLIENT_URL=http://$DOMAIN

# API Keys (Replace with actual production keys)
RECHARGE_API_KEY=your_production_recharge_api_key
RECHARGE_API_URL=https://api.rechargeservice.com
EOF
        fi
        
        # Generate random JWT secret
        JWT_SECRET=$(openssl rand -base64 32)
        # Escape special characters in JWT_SECRET for sed
        JWT_SECRET_ESCAPED=$(echo "$JWT_SECRET" | sed 's/[[\/.*^$()+?{|]/\\&/g')
        sudo -u $APP_USER sed -i "s/temp_jwt_secret_change_this/$JWT_SECRET_ESCAPED/g" $APP_PATH/backend/.env
        sudo -u $APP_USER sed -i "s/your_super_secure_jwt_secret_key_here_change_this_in_production/$JWT_SECRET_ESCAPED/g" $APP_PATH/backend/.env
        
        log_success "Environment variables configured"
    else
        log_success "Environment file already exists"
    fi
}

install_dependencies() {
    log_info "Installing application dependencies..."
    
    # Backend dependencies
    cd $APP_PATH/backend
    log_info "Updating backend package-lock.json..."
    sudo -u $APP_USER npm install --package-lock-only
    sudo -u $APP_USER npm ci --production
    
    # Frontend dependencies and build
    cd $APP_PATH/frontend
    log_info "Updating frontend package-lock.json..."
    sudo -u $APP_USER npm install --package-lock-only
    
    log_info "Installing frontend dependencies..."
    if ! sudo -u $APP_USER npm ci; then
        log_error "Failed to install frontend dependencies"
        exit 1
    fi
    
    log_info "Building React application..."
    if ! sudo -u $APP_USER npm run build; then
        log_error "React build process failed"
        exit 1
    fi
    
    # Check if build directory was created
    if [ ! -d "$APP_PATH/frontend/build" ]; then
        log_error "Build directory was not created: $APP_PATH/frontend/build"
        log_info "Attempting to create build directory manually..."
        sudo -u $APP_USER mkdir -p $APP_PATH/frontend/build
    fi
    
    # Verify build was successful
    if [ ! -f "$APP_PATH/frontend/build/index.html" ]; then
        log_error "Build failed: index.html not found in build directory"
        log_info "Contents of frontend directory:"
        ls -la $APP_PATH/frontend/
        if [ -d "$APP_PATH/frontend/build" ]; then
            log_info "Contents of build directory:"
            ls -la $APP_PATH/frontend/build/
        fi
        exit 1
    fi
    
    # Set proper permissions for build directory
    chown -R $APP_USER:$APP_USER $APP_PATH/frontend/build
    chmod -R 755 $APP_PATH/frontend/build
    
    # Fix directory permissions for Nginx access (prevents 403 errors)
    log_info "Setting proper directory permissions for Nginx access..."
    chmod 755 $APP_DIR
    chmod 755 $APP_PATH
    chmod 755 $APP_PATH/frontend
    chmod 755 $APP_PATH/frontend/build
    
    log_success "Dependencies installed and frontend built successfully"
}

setup_database() {
    log_info "Setting up MongoDB database..."
    
    # Wait for MongoDB to be ready
    sleep 5
    
    # Create database and user (if not exists)
    mongo --eval "
        use pay4u_production;
        if (!db.getUser('pay4u')) {
            db.createUser({
                user: 'pay4u',
                pwd: 'secure_password_$(openssl rand -base64 12)',
                roles: [{ role: 'readWrite', db: 'pay4u_production' }]
            });
        }
    " 2>/dev/null || true
    
    log_success "Database setup completed"
}

setup_nginx() {
    log_info "Configuring Nginx..."
    
    # Copy Nginx configuration
    cp $APP_PATH/nginx-ubuntu.conf /etc/nginx/sites-available/$APP_NAME
    
    # Update domain in configuration
    sed -i "s/your-domain.com/$DOMAIN/g" /etc/nginx/sites-available/$APP_NAME
    
    # Enable site
    ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Test configuration
    nginx -t
    
    # Reload Nginx
    systemctl reload nginx
    
    log_success "Nginx configured successfully"
}

start_application() {
    log_info "Starting application with PM2..."
    
    cd $APP_PATH
    
    # Start application
    sudo -u $APP_USER pm2 start ecosystem.config.js --env production
    
    # Save PM2 configuration
    sudo -u $APP_USER pm2 save
    
    # Setup PM2 startup
    sudo -u $APP_USER pm2 startup systemd -u $APP_USER --hp $APP_DIR
    
    log_success "Application started successfully"
}

setup_firewall() {
    log_info "Configuring firewall..."
    
    # Install ufw if not present
    apt install -y ufw
    
    # Configure firewall rules
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    
    log_success "Firewall configured successfully"
}

setup_ssl() {
    log_info "Setting up SSL certificate..."
    
    # Install certbot
    apt install -y certbot python3-certbot-nginx
    
    # Get certificate (this will fail if domain is not pointing to server)
    if certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN 2>/dev/null; then
        log_success "SSL certificate obtained successfully"
    else
        log_warning "SSL certificate setup failed. Please run 'sudo certbot --nginx -d $DOMAIN' manually after DNS is configured"
    fi
}

show_status() {
    echo ""
    log_success "=== Pay4U Deployment Completed ==="
    echo ""
    echo "📋 Service Status:"
    echo "   MongoDB: $(systemctl is-active mongod)"
    echo "   Nginx: $(systemctl is-active nginx)"
    echo "   Application: $(sudo -u $APP_USER pm2 list | grep -c 'online' || echo '0') processes online"
    echo ""
    echo "🌐 Access Information:"
    echo "   Frontend: http://$DOMAIN"
    echo "   Backend API: http://$DOMAIN/api"
    echo ""
    echo "📁 Important Paths:"
    echo "   Application: $APP_PATH"
    echo "   Logs: $LOG_DIR"
    echo "   Backups: $BACKUP_DIR"
    echo ""
    echo "🔧 Management Commands:"
    echo "   View logs: sudo -u $APP_USER pm2 logs"
    echo "   Restart app: sudo -u $APP_USER pm2 restart all"
    echo "   Stop app: sudo -u $APP_USER pm2 stop all"
    echo "   Nginx reload: sudo systemctl reload nginx"
    echo ""
}

# Main deployment process
main() {
    log_info "Starting Pay4U deployment on Ubuntu 24.04..."
    
    check_root
    check_ubuntu
    
    # System setup
    update_system
    install_git
    install_nodejs
    install_mongodb
    install_nginx
    install_pm2
    
    # Application setup
    create_app_user
    clone_repository
    setup_environment
    install_dependencies
    setup_database
    
    # Service configuration
    setup_nginx
    start_application
    setup_firewall
    
    # Optional SSL setup
    read -p "Do you want to setup SSL certificate? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_ssl
    fi
    
    show_status
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
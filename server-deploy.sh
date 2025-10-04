#!/bin/bash

# Pay4U Automated Server Deployment Script
# This script automates the complete server setup and deployment process

set -e  # Exit on any error

echo "🚀 Starting Pay4U Server Deployment..."
echo "======================================"

# Configuration Variables
DOMAIN="pay4u.co.in"
PROJECT_DIR="/var/www/pay4u"
GIT_REPO="https://github.com/navalkishoricomm/pay4u.git"
DB_NAME="pay4u"
JWT_SECRET="your-super-secret-jwt-key-Radhey-$(date +%s)"  # Generate unique secret

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: System Update and Prerequisites
install_prerequisites() {
    log_info "Installing system prerequisites..."
    
    sudo apt update && sudo apt upgrade -y
    
    # Install Node.js 18
    if ! command_exists node; then
        log_info "Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        log_success "Node.js already installed: $(node --version)"
    fi
    
    # Install PM2
    if ! command_exists pm2; then
        log_info "Installing PM2..."
        sudo npm install -g pm2
    else
        log_success "PM2 already installed: $(pm2 --version)"
    fi
    
    # Install serve
    if ! command_exists serve; then
        log_info "Installing serve..."
        sudo npm install -g serve
    else
        log_success "serve already installed"
    fi
    
    # Install Nginx
    if ! command_exists nginx; then
        log_info "Installing Nginx..."
        sudo apt install nginx -y
    else
        log_success "Nginx already installed"
    fi
    
    # Install Git
    if ! command_exists git; then
        log_info "Installing Git..."
        sudo apt install git -y
    else
        log_success "Git already installed"
    fi
    
    log_success "Prerequisites installation completed!"
}

# Step 2: Setup Project Directory
setup_project() {
    log_info "Setting up project directory..."
    
    # Create project directory
    sudo mkdir -p $PROJECT_DIR
    sudo chown $USER:$USER $PROJECT_DIR
    
    # Clone or update repository
    if [ -d "$PROJECT_DIR/.git" ]; then
        log_info "Updating existing repository..."
        cd $PROJECT_DIR
        git pull origin main
    else
        log_info "Cloning repository..."
        cd /var/www
        git clone $GIT_REPO pay4u
    fi
    
    cd $PROJECT_DIR
    chmod +x *.sh 2>/dev/null || true
    
    log_success "Project setup completed!"
}

# Step 3: Environment Configuration
setup_environment() {
    log_info "Setting up environment configuration..."
    
    # Backend environment
    cat > backend/.env << EOF
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb://localhost:27017/$DB_NAME
JWT_SECRET=$JWT_SECRET
EOF
    
    # Frontend environment
    cat > frontend/.env.production << EOF
REACT_APP_API_URL=https://$DOMAIN/api
EOF
    
    log_success "Environment configuration completed!"
}

# Step 4: Install Dependencies and Build
install_and_build() {
    log_info "Installing dependencies and building application..."
    
    # Backend dependencies
    if [ -d "backend" ]; then
        log_info "Installing backend dependencies..."
        cd backend
        npm install --production
        cd ..
    else
        log_error "Backend directory not found!"
        exit 1
    fi
    
    # Frontend dependencies and build
    if [ -d "frontend" ]; then
        log_info "Installing frontend dependencies and building..."
        cd frontend
        npm install
        npm run build
        cd ..
    else
        log_error "Frontend directory not found!"
        exit 1
    fi
    
    log_success "Dependencies and build completed!"
}

# Step 4.5: Setup Admin User
setup_admin_user() {
    log_info "Setting up admin user..."
    
    if [ -f "backend/serverAdminReset.js" ]; then
        cd backend
        log_info "Running admin user setup script..."
        node serverAdminReset.js
        cd ..
        log_success "Admin user setup completed!"
        log_info "Admin credentials: admin@pay4u.co.in / admin123456"
    else
        log_warning "serverAdminReset.js not found, skipping admin setup"
    fi
}

# Step 5: Setup MongoDB
setup_mongodb() {
    log_info "Setting up MongoDB..."
    
    if ! command_exists mongod; then
        log_info "Installing MongoDB..."
        wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
        echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
        sudo apt update
        sudo apt install -y mongodb-org
    fi
    
    # Start and enable MongoDB
    sudo systemctl start mongod
    sudo systemctl enable mongod
    
    log_success "MongoDB setup completed!"
}

# Step 6: Setup PM2 Services
setup_pm2() {
    log_info "Setting up PM2 services..."
    
    # Stop existing processes
    pm2 delete pay4u-backend 2>/dev/null || true
    pm2 delete pay4u-frontend 2>/dev/null || true
    
    # Start backend
    if [ -f "backend/server.js" ]; then
        cd backend
        pm2 start server.js --name pay4u-backend --env production
        cd ..
    else
        log_error "Backend server.js not found!"
        exit 1
    fi
    
    # Start frontend
    if [ -d "frontend/build" ]; then
        pm2 start "serve -s frontend/build -l 3001" --name pay4u-frontend
    else
        log_error "Frontend build directory not found!"
        exit 1
    fi
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup
    pm2 startup | grep -E '^sudo' | bash || true
    
    log_success "PM2 services setup completed!"
}

# Step 7: Configure Nginx
setup_nginx() {
    log_info "Configuring Nginx..."
    
    # Create Nginx configuration
    sudo tee /etc/nginx/sites-available/pay4u << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Frontend (React build)
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/pay4u /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test and restart Nginx
    sudo nginx -t
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    
    log_success "Nginx configuration completed!"
}

# Step 8: Setup SSL (Optional)
setup_ssl() {
    log_info "Setting up SSL certificate..."
    
    if ! command_exists certbot; then
        sudo apt install certbot python3-certbot-nginx -y
    fi
    
    # Get SSL certificate (interactive)
    log_warning "SSL setup requires manual interaction..."
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN
    
    # Setup auto-renewal
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    
    log_success "SSL setup completed!"
}

# Step 9: Create Management Scripts
setup_management_scripts() {
    log_info "Creating management scripts..."
    
    # Create deployment script
    cat > deploy.sh << 'EOF'
#!/bin/bash
echo "🔄 Starting deployment..."

# Pull latest code
git pull origin main

# Install backend dependencies
if [ -d "backend" ]; then
    cd backend
    npm install --production
    cd ..
fi

# Build frontend
if [ -d "frontend" ]; then
    cd frontend
    npm install
    npm run build
    cd ..
fi

# Setup/Reset admin user if script exists
if [ -f "backend/serverAdminReset.js" ]; then
    echo "🔑 Setting up admin user..."
    cd backend
    node serverAdminReset.js
    cd ..
    echo "Admin credentials: admin@pay4u.co.in / admin123456"
fi

# Restart services
pm2 restart pay4u-backend
pm2 restart pay4u-frontend

# Reload Nginx
sudo systemctl reload nginx

echo "✅ Deployment completed!"
EOF
    
    # Create status check script
    cat > status.sh << 'EOF'
#!/bin/bash
echo "📊 Pay4U Application Status"
echo "==========================="

echo "\n🔧 PM2 Processes:"
pm2 status

echo "\n🌐 Nginx Status:"
sudo systemctl status nginx --no-pager -l

echo "\n🗄️ MongoDB Status:"
sudo systemctl status mongod --no-pager -l

echo "\n📈 System Resources:"
df -h /
free -h
EOF
    
    chmod +x deploy.sh status.sh
    
    log_success "Management scripts created!"
}

# Step 10: Final Verification
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check PM2 processes
    pm2 status
    
    # Check Nginx
    sudo systemctl status nginx --no-pager
    
    # Test endpoints
    sleep 5
    
    if curl -f http://localhost:3001 >/dev/null 2>&1; then
        log_success "Frontend is responding on port 3001"
    else
        log_error "Frontend is not responding on port 3001"
    fi
    
    if curl -f http://localhost:5001 >/dev/null 2>&1; then
        log_success "Backend is responding on port 5001"
    else
        log_warning "Backend might not be responding on port 5001 (check if health endpoint exists)"
    fi
    
    log_success "Deployment verification completed!"
}

# Main execution
main() {
    echo "🎯 Pay4U Automated Deployment Script"
    echo "===================================="
    echo "Domain: $DOMAIN"
    echo "Project Directory: $PROJECT_DIR"
    echo "===================================="
    
    read -p "Do you want to proceed with the deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "Deployment cancelled by user."
        exit 0
    fi
    
    install_prerequisites
    setup_project
    setup_environment
    install_and_build
    setup_mongodb
    setup_admin_user
    setup_pm2
    setup_nginx
    setup_management_scripts
    verify_deployment
    
    echo
    log_success "🎉 Pay4U deployment completed successfully!"
    echo
    echo "📋 Next Steps:"
    echo "1. Update the Git repository URL in this script"
    echo "2. Configure your domain DNS to point to this server"
    echo "3. Run SSL setup: sudo certbot --nginx -d $DOMAIN"
    echo "4. Test your application at: http://$DOMAIN"
    echo
    echo "📁 Management Commands:"
    echo "  ./deploy.sh    - Deploy updates"
    echo "  ./status.sh    - Check application status"
    echo "  pm2 logs       - View application logs"
    echo "  pm2 monit      - Monitor processes"
    echo
}

# Run main function
main "$@"
#!/bin/bash

# Pay4U Environment Setup Script
# Quickly configure environment variables for different deployment scenarios

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Default configuration
DEFAULT_DOMAIN="pay4u.co.in"
DEFAULT_DB_NAME="pay4u"
DEFAULT_BACKEND_PORT="5001"
DEFAULT_FRONTEND_PORT="3001"

# Function to generate JWT secret
generate_jwt_secret() {
    openssl rand -base64 32 2>/dev/null || echo "pay4u-jwt-secret-$(date +%s)"
}

# Function to show usage
show_usage() {
    echo "Pay4U Environment Setup Script"
    echo "=============================="
    echo "Usage: $0 [ENVIRONMENT] [OPTIONS]"
    echo ""
    echo "Environments:"
    echo "  development  - Setup for local development"
    echo "  production   - Setup for production server"
    echo "  staging      - Setup for staging server"
    echo "  docker       - Setup for Docker deployment"
    echo ""
    echo "Options:"
    echo "  -d, --domain DOMAIN     - Set domain name (default: $DEFAULT_DOMAIN)"
    echo "  -p, --port PORT         - Set backend port (default: $DEFAULT_BACKEND_PORT)"
    echo "  -f, --frontend PORT     - Set frontend port (default: $DEFAULT_FRONTEND_PORT)"
    echo "  -db, --database NAME    - Set database name (default: $DEFAULT_DB_NAME)"
    echo "  -h, --help              - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 development"
    echo "  $0 production -d myapp.com"
    echo "  $0 staging -d staging.myapp.com -p 5002"
    echo ""
}

# Parse command line arguments
ENVIRONMENT=""
DOMAIN="$DEFAULT_DOMAIN"
BACKEND_PORT="$DEFAULT_BACKEND_PORT"
FRONTEND_PORT="$DEFAULT_FRONTEND_PORT"
DB_NAME="$DEFAULT_DB_NAME"

while [[ $# -gt 0 ]]; do
    case $1 in
        development|production|staging|docker)
            ENVIRONMENT="$1"
            shift
            ;;
        -d|--domain)
            DOMAIN="$2"
            shift 2
            ;;
        -p|--port)
            BACKEND_PORT="$2"
            shift 2
            ;;
        -f|--frontend)
            FRONTEND_PORT="$2"
            shift 2
            ;;
        -db|--database)
            DB_NAME="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

if [ -z "$ENVIRONMENT" ]; then
    log_error "Environment is required!"
    show_usage
    exit 1
fi

# Setup development environment
setup_development() {
    log_info "Setting up development environment..."
    
    # Backend .env
    cat > .env << EOF
# Pay4U Development Environment
NODE_ENV=development
PORT=$BACKEND_PORT
MONGODB_URI=mongodb://localhost:27017/${DB_NAME}_dev
JWT_SECRET=dev-jwt-secret-key
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug

# Development specific settings
ENABLE_LOGGING=true
ENABLE_CORS=true
EOF
    
    # Frontend .env.local
    mkdir -p frontend
    cat > frontend/.env.local << EOF
# Pay4U Frontend Development Environment
REACT_APP_API_URL=http://localhost:$BACKEND_PORT/api
REACT_APP_ENV=development
REACT_APP_DEBUG=true
EOF
    
    # Frontend .env.development
    cat > frontend/.env.development << EOF
# Pay4U Frontend Development Environment
REACT_APP_API_URL=http://localhost:$BACKEND_PORT/api
REACT_APP_ENV=development
REACT_APP_DEBUG=true
EOF
    
    log_success "Development environment configured!"
    log_info "Backend will run on: http://localhost:$BACKEND_PORT"
    log_info "Frontend will run on: http://localhost:3000"
    log_info "Database: ${DB_NAME}_dev"
}

# Setup production environment
setup_production() {
    log_info "Setting up production environment..."
    
    JWT_SECRET=$(generate_jwt_secret)
    
    # Backend .env
    cat > .env << EOF
# Pay4U Production Environment
NODE_ENV=production
PORT=$BACKEND_PORT
MONGODB_URI=mongodb://localhost:27017/$DB_NAME
JWT_SECRET=$JWT_SECRET
CORS_ORIGIN=https://$DOMAIN
LOG_LEVEL=info

# Production specific settings
ENABLE_LOGGING=true
ENABLE_CORS=true
SSL_ENABLED=true
EOF
    
    # Frontend .env.production
    mkdir -p frontend
    cat > frontend/.env.production << EOF
# Pay4U Frontend Production Environment
REACT_APP_API_URL=https://$DOMAIN/api
REACT_APP_ENV=production
REACT_APP_DEBUG=false
EOF
    
    # Create backup of production env
    cp frontend/.env.production frontend/.env.production.backup
    
    log_success "Production environment configured!"
    log_info "Domain: https://$DOMAIN"
    log_info "Backend API: https://$DOMAIN/api"
    log_info "Database: $DB_NAME"
    log_warning "JWT Secret generated: $JWT_SECRET"
    log_warning "Please save the JWT secret securely!"
}

# Setup staging environment
setup_staging() {
    log_info "Setting up staging environment..."
    
    JWT_SECRET=$(generate_jwt_secret)
    
    # Backend .env
    cat > .env << EOF
# Pay4U Staging Environment
NODE_ENV=staging
PORT=$BACKEND_PORT
MONGODB_URI=mongodb://localhost:27017/${DB_NAME}_staging
JWT_SECRET=$JWT_SECRET
CORS_ORIGIN=https://$DOMAIN
LOG_LEVEL=debug

# Staging specific settings
ENABLE_LOGGING=true
ENABLE_CORS=true
SSL_ENABLED=true
EOF
    
    # Frontend .env.staging
    mkdir -p frontend
    cat > frontend/.env.staging << EOF
# Pay4U Frontend Staging Environment
REACT_APP_API_URL=https://$DOMAIN/api
REACT_APP_ENV=staging
REACT_APP_DEBUG=true
EOF
    
    # Also create as production for build
    cp frontend/.env.staging frontend/.env.production
    
    log_success "Staging environment configured!"
    log_info "Domain: https://$DOMAIN"
    log_info "Backend API: https://$DOMAIN/api"
    log_info "Database: ${DB_NAME}_staging"
}

# Setup Docker environment
setup_docker() {
    log_info "Setting up Docker environment..."
    
    JWT_SECRET=$(generate_jwt_secret)
    
    # Backend .env
    cat > .env << EOF
# Pay4U Docker Environment
NODE_ENV=production
PORT=$BACKEND_PORT
MONGODB_URI=mongodb://mongo:27017/$DB_NAME
JWT_SECRET=$JWT_SECRET
CORS_ORIGIN=http://localhost:$FRONTEND_PORT
LOG_LEVEL=info

# Docker specific settings
ENABLE_LOGGING=true
ENABLE_CORS=true
EOF
    
    # Frontend .env.production
    mkdir -p frontend
    cat > frontend/.env.production << EOF
# Pay4U Frontend Docker Environment
REACT_APP_API_URL=http://localhost:$BACKEND_PORT/api
REACT_APP_ENV=docker
REACT_APP_DEBUG=false
EOF
    
    # Create docker-compose.yml if it doesn't exist
    if [ ! -f "docker-compose.yml" ]; then
        cat > docker-compose.yml << EOF
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "$BACKEND_PORT:$BACKEND_PORT"
    environment:
      - NODE_ENV=production
    depends_on:
      - mongo
    volumes:
      - .:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    ports:
      - "$FRONTEND_PORT:$FRONTEND_PORT"
    depends_on:
      - backend

  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
EOF
        log_info "Created docker-compose.yml"
    fi
    
    log_success "Docker environment configured!"
    log_info "Backend: http://localhost:$BACKEND_PORT"
    log_info "Frontend: http://localhost:$FRONTEND_PORT"
    log_info "Database: MongoDB in Docker container"
}

# Create .env.example file
create_env_example() {
    cat > .env.example << EOF
# Pay4U Environment Configuration Example
# Copy this file to .env and update the values

# Application Environment
NODE_ENV=development
PORT=5001

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/pay4u

# Security
JWT_SECRET=your-super-secret-jwt-key

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
ENABLE_LOGGING=true

# Features
ENABLE_CORS=true
SSL_ENABLED=false
EOF
    
    # Frontend example
    mkdir -p frontend
    cat > frontend/.env.example << EOF
# Pay4U Frontend Environment Configuration Example
# Copy this file to .env.local (development) or .env.production (production)

# API Configuration
REACT_APP_API_URL=http://localhost:5001/api

# Environment
REACT_APP_ENV=development

# Debug Mode
REACT_APP_DEBUG=true
EOF
}

# Main execution
log_info "Configuring Pay4U environment: $ENVIRONMENT"
log_info "Domain: $DOMAIN"
log_info "Backend Port: $BACKEND_PORT"
log_info "Frontend Port: $FRONTEND_PORT"
log_info "Database: $DB_NAME"
echo ""

case $ENVIRONMENT in
    development)
        setup_development
        ;;
    production)
        setup_production
        ;;
    staging)
        setup_staging
        ;;
    docker)
        setup_docker
        ;;
    *)
        log_error "Unknown environment: $ENVIRONMENT"
        show_usage
        exit 1
        ;;
esac

# Create example files
create_env_example

echo ""
log_success "Environment setup completed!"
log_info "Files created:"
echo "  - .env (backend configuration)"
echo "  - frontend/.env.$ENVIRONMENT (frontend configuration)"
echo "  - .env.example (example configuration)"
echo "  - frontend/.env.example (frontend example)"

if [ "$ENVIRONMENT" = "docker" ]; then
    echo "  - docker-compose.yml (Docker configuration)"
fi

echo ""
log_warning "Next steps:"
case $ENVIRONMENT in
    development)
        echo "1. Start MongoDB: mongod"
        echo "2. Install dependencies: npm install && cd frontend && npm install"
        echo "3. Start backend: npm run dev"
        echo "4. Start frontend: cd frontend && npm start"
        ;;
    production)
        echo "1. Review and secure the JWT secret"
        echo "2. Setup MongoDB and ensure it's running"
        echo "3. Install dependencies: npm install --production"
        echo "4. Build frontend: cd frontend && npm install && npm run build"
        echo "5. Start with PM2: pm2 start server.js --name pay4u-backend"
        echo "6. Configure Nginx proxy"
        ;;
    staging)
        echo "1. Review configuration settings"
        echo "2. Setup MongoDB for staging"
        echo "3. Deploy using staging pipeline"
        ;;
    docker)
        echo "1. Build and start containers: docker-compose up --build"
        echo "2. Access application at http://localhost:$FRONTEND_PORT"
        ;;
esac

echo ""
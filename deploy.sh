#!/bin/bash

# Pay4U Deployment Script
# This script helps deploy the Pay4U application

set -e

echo "🚀 Starting Pay4U Deployment..."

# Function to check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    echo "✅ Docker and Docker Compose are installed"
}

# Function to create necessary directories
setup_directories() {
    echo "📁 Setting up directories..."
    mkdir -p backend/uploads
    mkdir -p nginx/ssl
    echo "✅ Directories created"
}

# Function to build and start services
deploy_services() {
    echo "🔨 Building and starting services..."
    
    # Stop existing containers
    docker-compose down
    
    # Build and start services
    docker-compose up -d --build
    
    echo "✅ Services started successfully"
}

# Function to check service health
check_services() {
    echo "🔍 Checking service health..."
    
    # Wait for services to start
    sleep 10
    
    # Check if containers are running
    if docker-compose ps | grep -q "Up"; then
        echo "✅ Services are running"
    else
        echo "❌ Some services failed to start"
        docker-compose logs
        exit 1
    fi
}

# Function to show deployment info
show_info() {
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Service Information:"
    echo "   Frontend: http://localhost (port 80)"
    echo "   Backend API: http://localhost:5000"
    echo "   MongoDB: localhost:27017"
    echo ""
    echo "📝 Useful Commands:"
    echo "   View logs: docker-compose logs -f"
    echo "   Stop services: docker-compose down"
    echo "   Restart services: docker-compose restart"
    echo "   View status: docker-compose ps"
    echo ""
}

# Main deployment process
main() {
    check_docker
    setup_directories
    deploy_services
    check_services
    show_info
}

# Run main function
main
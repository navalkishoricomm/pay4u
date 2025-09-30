# Pay4U Deployment Guide

This guide provides comprehensive instructions for deploying the Pay4U application using the automated deployment scripts.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Deployment Scripts](#deployment-scripts)
3. [Local Development](#local-development)
4. [Server Deployment](#server-deployment)
5. [Management Commands](#management-commands)
6. [Troubleshooting](#troubleshooting)
7. [Configuration](#configuration)

## 🚀 Quick Start

### For Local Development (Windows)
```powershell
# Setup local environment
.\deploy-windows.ps1 -Action setup

# Start backend
npm run dev

# Start frontend (in new terminal)
cd frontend
npm start
```

### For Server Deployment (Linux)
```bash
# Make scripts executable
chmod +x *.sh

# Run full automated deployment
./server-deploy.sh

# Or use quick deployment for updates
./quick-deploy.sh deploy
```

## 📜 Deployment Scripts

### 1. `server-deploy.sh` - Full Server Setup
**Purpose**: Complete server setup from scratch

**Features**:
- Installs all prerequisites (Node.js, PM2, Nginx, MongoDB)
- Sets up project directory and environment
- Configures services and proxy
- Creates management scripts
- Verifies deployment

**Usage**:
```bash
chmod +x server-deploy.sh
./server-deploy.sh
```

**Before Running**:
1. Update the Git repository URL in the script
2. Ensure you have sudo access
3. Configure domain name if different from `pay4u.co.in`

### 2. `deploy-windows.ps1` - Windows Development Script
**Purpose**: Local development and deployment preparation on Windows

**Actions**:
- `setup` - Setup local development environment
- `build` - Build production version
- `deploy` - Deploy to remote server
- `status` - Check local development status
- `clean` - Clean local environment

**Usage**:
```powershell
# Setup local development
.\deploy-windows.ps1 -Action setup

# Build for production
.\deploy-windows.ps1 -Action build

# Deploy to server
.\deploy-windows.ps1 -Action deploy -ServerIP 192.168.1.100

# Check status
.\deploy-windows.ps1 -Action status

# Clean environment
.\deploy-windows.ps1 -Action clean
```

### 3. `quick-deploy.sh` - Rapid Server Management
**Purpose**: Quick updates and management of deployed application

**Commands**:
- `deploy` - Full deployment (pull, build, restart)
- `update` - Quick update (pull and restart only)
- `restart` - Restart services only
- `status` - Show application status
- `logs` - Show application logs
- `backup` - Create backup of current deployment
- `rollback` - Rollback to previous backup
- `ssl` - Setup/renew SSL certificate
- `clean` - Clean build files and restart

**Usage**:
```bash
# Quick deployment
./quick-deploy.sh deploy

# Just restart services
./quick-deploy.sh restart

# Check status
./quick-deploy.sh status

# View logs
./quick-deploy.sh logs

# Create backup
./quick-deploy.sh backup

# Setup SSL
./quick-deploy.sh ssl
```

## 💻 Local Development

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB (optional, for local database)

### Setup Steps

1. **Clone Repository**
   ```bash
   git clone <your-repo-url>
   cd pay4u
   ```

2. **Setup Environment** (Windows)
   ```powershell
   .\deploy-windows.ps1 -Action setup
   ```

3. **Manual Setup** (Alternative)
   ```bash
   # Backend
   npm install
   
   # Frontend
   cd frontend
   npm install
   cd ..
   
   # Create environment files
   echo "NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/pay4u_dev
JWT_SECRET=dev-jwt-secret" > .env
   
   echo "REACT_APP_API_URL=http://localhost:5001/api" > frontend/.env.local
   ```

4. **Start Development Servers**
   ```bash
   # Terminal 1 - Backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

5. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001/api

## 🖥️ Server Deployment

### Prerequisites
- Ubuntu/Debian server
- Root or sudo access
- Domain name pointing to server
- Git repository access

### Method 1: Automated Deployment

1. **Upload Scripts**
   ```bash
   scp server-deploy.sh user@your-server:/tmp/
   ssh user@your-server
   sudo mv /tmp/server-deploy.sh /root/
   chmod +x /root/server-deploy.sh
   ```

2. **Configure Script**
   ```bash
   nano /root/server-deploy.sh
   # Update these variables:
   # DOMAIN="your-domain.com"
   # GIT_REPO="https://github.com/yourusername/pay4u.git"
   ```

3. **Run Deployment**
   ```bash
   ./server-deploy.sh
   ```

### Method 2: Manual Deployment

1. **Install Prerequisites**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2 and serve
   sudo npm install -g pm2 serve
   
   # Install Nginx
   sudo apt install nginx -y
   ```

2. **Setup Project**
   ```bash
   sudo mkdir -p /var/www/pay4u
   sudo chown $USER:$USER /var/www/pay4u
   cd /var/www
   git clone <your-repo-url> pay4u
   cd pay4u
   ```

3. **Configure Environment**
   ```bash
   # Backend environment
   cat > .env << EOF
   NODE_ENV=production
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/pay4u
   JWT_SECRET=your-super-secret-jwt-key
   EOF
   
   # Frontend environment
   cat > frontend/.env.production << EOF
   REACT_APP_API_URL=https://your-domain.com/api
   EOF
   ```

4. **Install and Build**
   ```bash
   # Backend
   npm install --production
   
   # Frontend
   cd frontend
   npm install
   npm run build
   cd ..
   ```

5. **Start Services**
   ```bash
   # Start with PM2
   pm2 start server.js --name pay4u-backend --env production
   pm2 start "serve -s frontend/build -l 3001" --name pay4u-frontend
   pm2 save
   pm2 startup
   ```

6. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/pay4u
   # Copy configuration from server-deploy.sh
   
   sudo ln -s /etc/nginx/sites-available/pay4u /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## 🔧 Management Commands

### Daily Operations
```bash
# Check application status
./quick-deploy.sh status
pm2 status

# View logs
./quick-deploy.sh logs
pm2 logs

# Restart services
./quick-deploy.sh restart
pm2 restart all

# Deploy updates
./quick-deploy.sh deploy
```

### Backup and Recovery
```bash
# Create backup
./quick-deploy.sh backup

# Rollback to previous version
./quick-deploy.sh rollback

# Manual backup
cp -r /var/www/pay4u /var/backups/pay4u-$(date +%Y%m%d)
```

### SSL Management
```bash
# Setup SSL certificate
./quick-deploy.sh ssl

# Manual SSL setup
sudo certbot --nginx -d your-domain.com

# Check SSL status
sudo certbot certificates
```

## 🔍 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   sudo netstat -tulpn | grep :5001
   
   # Kill process
   sudo kill -9 <PID>
   ```

2. **PM2 Process Not Starting**
   ```bash
   # Check PM2 logs
   pm2 logs pay4u-backend
   
   # Restart PM2
   pm2 delete all
   pm2 start server.js --name pay4u-backend
   ```

3. **Nginx Configuration Error**
   ```bash
   # Test configuration
   sudo nginx -t
   
   # Check error logs
   sudo tail -f /var/log/nginx/error.log
   ```

4. **Database Connection Issues**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod
   
   # Start MongoDB
   sudo systemctl start mongod
   ```

5. **Frontend Build Issues**
   ```bash
   # Clear cache and rebuild
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

### Log Locations
- PM2 logs: `~/.pm2/logs/`
- Nginx logs: `/var/log/nginx/`
- Application logs: Check PM2 logs

### Health Checks
```bash
# Test endpoints
curl http://localhost:3001  # Frontend
curl http://localhost:5001/api/health  # Backend

# Check SSL
curl -I https://your-domain.com
```

## ⚙️ Configuration

### Environment Variables

**Backend (.env)**
```env
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb://localhost:27017/pay4u
JWT_SECRET=your-super-secret-jwt-key
```

**Frontend (.env.production)**
```env
REACT_APP_API_URL=https://your-domain.com/api
```

### Customization

1. **Domain Configuration**
   - Update `DOMAIN` variable in scripts
   - Update Nginx configuration
   - Update frontend environment

2. **Port Configuration**
   - Backend: Change `PORT` in .env
   - Frontend: Change port in PM2 start command
   - Update Nginx proxy configuration

3. **Database Configuration**
   - Update `MONGODB_URI` in .env
   - Configure MongoDB authentication if needed

### Security Considerations

1. **Firewall Setup**
   ```bash
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```

2. **SSL Certificate**
   - Always use HTTPS in production
   - Setup auto-renewal for certificates

3. **Environment Variables**
   - Use strong JWT secrets
   - Never commit secrets to repository
   - Use environment-specific configurations

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section
2. Review application logs
3. Verify all services are running
4. Check network connectivity
5. Ensure all environment variables are set correctly

---

**Happy Deploying! 🚀**
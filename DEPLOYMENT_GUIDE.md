# Pay4U Deployment Guide

This guide provides step-by-step instructions for deploying the Pay4U application to a production server.

## 🚀 Quick Deployment

### Prerequisites
- Ubuntu 20.04+ or Debian 11+ server
- Root or sudo access
- Domain name pointing to your server
- Git repository access

### One-Command Setup

```bash
# Download and run the server setup script
wget https://raw.githubusercontent.com/navalkishoricomm/pay4u/main/server-setup.sh
chmod +x server-setup.sh
sudo ./server-setup.sh
```

## 📋 Manual Deployment Steps

### Step 1: Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git unzip software-properties-common
```

### Step 2: Install Node.js

```bash
# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 3: Install MongoDB

```bash
# Import MongoDB GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Step 4: Install PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 startup script
pm2 startup
# Follow the instructions provided by the command
```

### Step 5: Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 6: Clone and Setup Application

```bash
# Create application directory
sudo mkdir -p /var/www/pay4u
sudo chown $USER:$USER /var/www/pay4u

# Clone repository
git clone https://github.com/navalkishoricomm/pay4u.git /var/www/pay4u
cd /var/www/pay4u

# Install backend dependencies
cd backend
npm install --production

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 7: Configure Environment

```bash
# Copy environment template
cp /var/www/pay4u/.env.server.template /var/www/pay4u/backend/.env

# Edit environment file
nano /var/www/pay4u/backend/.env
```

**Important**: Update the following in your `.env` file:
- `JWT_SECRET`: Generate a strong random string
- `MONGO_URI`: Your MongoDB connection string
- API keys for recharge, bill payment, DMT, AEPS services
- Email and SMS configuration
- Domain-specific URLs

### Step 8: Build Frontend

```bash
cd /var/www/pay4u/frontend

# Create production environment
cat > .env.production << EOF
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_SOCKET_URL=https://yourdomain.com
REACT_APP_ENV=production
GENERATE_SOURCEMAP=false
EOF

# Build for production
npm run build

# Copy build to web directory
sudo mkdir -p /var/www/html/pay4u
sudo cp -r build/* /var/www/html/pay4u/
sudo chown -R www-data:www-data /var/www/html/pay4u
```

### Step 9: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/pay4u
```

Add the following configuration (replace `yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration (will be updated by certbot)
    ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;
    
    # Frontend
    location / {
        root /var/www/html/pay4u;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/pay4u /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Step 10: Setup SSL Certificate

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Step 11: Start Application with PM2

```bash
cd /var/www/pay4u

# Start backend
pm2 start backend/server.js --name "pay4u-backend" --env production

# Start frontend (optional, since Nginx serves static files)
npm install -g serve
pm2 start serve --name "pay4u-frontend" -- -s frontend/build -l 3000

# Save PM2 configuration
pm2 save
```

### Step 12: Configure Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow necessary ports
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 5000  # Backend (if needed for direct access)
```

## 🔄 Automated Deployment Scripts

After initial setup, use these scripts for updates:

### Backend Deployment
```bash
cd /var/www/pay4u
./deploy-backend.sh
```

### Frontend Deployment
```bash
cd /var/www/pay4u
./deploy-frontend.sh
```

## 📊 Monitoring and Management

### PM2 Commands
```bash
# Check status
pm2 status

# View logs
pm2 logs
pm2 logs pay4u-backend

# Restart applications
pm2 restart pay4u-backend
pm2 restart pay4u-frontend

# Monitor in real-time
pm2 monit
```

### System Commands
```bash
# Check Nginx status
sudo systemctl status nginx

# Check MongoDB status
sudo systemctl status mongod

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔧 Troubleshooting

### Common Issues

1. **Application not starting**
   - Check PM2 logs: `pm2 logs`
   - Verify environment variables in `.env`
   - Check MongoDB connection

2. **502 Bad Gateway**
   - Ensure backend is running: `pm2 status`
   - Check Nginx configuration: `sudo nginx -t`
   - Verify proxy_pass URL in Nginx config

3. **SSL Certificate Issues**
   - Renew certificate: `sudo certbot renew`
   - Check certificate status: `sudo certbot certificates`

4. **Database Connection Issues**
   - Check MongoDB status: `sudo systemctl status mongod`
   - Verify MONGO_URI in `.env`
   - Check MongoDB logs: `sudo journalctl -u mongod`

### Performance Optimization

1. **Enable Gzip Compression**
   Add to Nginx configuration:
   ```nginx
   gzip on;
   gzip_vary on;
   gzip_min_length 1024;
   gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
   ```

2. **Setup Redis for Caching** (Optional)
   ```bash
   sudo apt install redis-server
   sudo systemctl enable redis-server
   ```

3. **Database Indexing**
   Connect to MongoDB and create indexes:
   ```javascript
   use pay4u
   db.users.createIndex({ "mobile": 1 })
   db.transactions.createIndex({ "userId": 1, "createdAt": -1 })
   ```

## 🔐 Security Checklist

- [ ] SSL certificate installed and auto-renewal configured
- [ ] Firewall configured (UFW)
- [ ] MongoDB authentication enabled
- [ ] Strong passwords and JWT secrets
- [ ] Regular security updates
- [ ] Backup strategy implemented
- [ ] Rate limiting configured
- [ ] CORS properly configured

## 📱 Mobile App Deployment

For the React Native mobile app:

1. **Android APK Build**
   ```bash
   cd Pay4UMobile
   npx react-native build-android --mode=release
   ```

2. **Play Store Deployment**
   - Generate signed APK
   - Upload to Google Play Console
   - Follow Play Store guidelines

## 📞 Support

For deployment support:
- Email: support@yourdomain.com
- Documentation: https://yourdomain.com/docs
- GitHub Issues: https://github.com/navalkishoricomm/pay4u/issues

---

**Note**: Replace `yourdomain.com` with your actual domain name throughout this guide.
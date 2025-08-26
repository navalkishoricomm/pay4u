# Pay4U Deployment Guide for Ubuntu 24.04

This guide provides step-by-step instructions to deploy the Pay4U application on Ubuntu 24.04 LTS.

## Prerequisites

- Ubuntu 24.04 LTS server
- Root or sudo access
- At least 2GB RAM and 20GB disk space
- Internet connection

## System Requirements

- Node.js 18.x or higher
- MongoDB 6.0 or higher
- Nginx (for reverse proxy)
- PM2 (for process management)
- Git

## Installation Steps

### 1. Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js 18.x

```bash
# Install Node.js 18.x from NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Install MongoDB 6.0

```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package list and install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

### 4. Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 5. Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### 6. Install Git

```bash
sudo apt install -y git
```

### 7. Create Application User

```bash
sudo adduser --system --group --home /opt/pay4u pay4u
sudo mkdir -p /opt/pay4u
sudo chown pay4u:pay4u /opt/pay4u
```

## Application Deployment

### 1. Clone Repository

```bash
sudo -u pay4u git clone https://github.com/your-username/pay4u.git /opt/pay4u/app
cd /opt/pay4u/app
```

### 2. Configure Environment Variables

```bash
# Backend environment
sudo -u pay4u cp backend/.env.production backend/.env
sudo -u pay4u nano backend/.env
```

Update the following variables in `backend/.env`:
```env
MONGO_URI=mongodb://localhost:27017/pay4u_production
JWT_SECRET=your_super_secure_jwt_secret_key_here
NODE_ENV=production
PORT=5000
```

### 3. Install Dependencies

```bash
# Backend dependencies
cd /opt/pay4u/app/backend
sudo -u pay4u npm ci --production

# Frontend dependencies and build
cd /opt/pay4u/app/frontend
sudo -u pay4u npm ci
sudo -u pay4u npm run build
```

### 4. Configure MongoDB

```bash
# Connect to MongoDB and create database
mongo
> use pay4u_production
> db.createUser({
    user: "pay4u",
    pwd: "secure_password_here",
    roles: [{ role: "readWrite", db: "pay4u_production" }]
  })
> exit
```

### 5. Configure PM2

Create PM2 ecosystem file:

```bash
sudo -u pay4u nano /opt/pay4u/app/ecosystem.config.js
```

### 6. Configure Nginx

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/pay4u
```

### 7. Start Application

```bash
# Start backend with PM2
cd /opt/pay4u/app
sudo -u pay4u pm2 start ecosystem.config.js
sudo -u pay4u pm2 save
sudo -u pay4u pm2 startup

# Enable Nginx site
sudo ln -s /etc/nginx/sites-available/pay4u /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8. Configure Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

## SSL Configuration (Optional)

### Install Certbot for Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Monitoring and Maintenance

### View Application Logs

```bash
# PM2 logs
sudo -u pay4u pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

### Application Management

```bash
# Restart application
sudo -u pay4u pm2 restart all

# Stop application
sudo -u pay4u pm2 stop all

# View process status
sudo -u pay4u pm2 status
```

### Database Backup

```bash
# Create backup
mongodump --db pay4u_production --out /opt/pay4u/backups/$(date +%Y%m%d)

# Restore backup
mongorestore --db pay4u_production /opt/pay4u/backups/20240101/pay4u_production
```

## Troubleshooting

### Common Issues

1. **Port already in use**: Check if another service is using port 5000
   ```bash
   sudo netstat -tlnp | grep :5000
   ```

2. **MongoDB connection failed**: Verify MongoDB is running
   ```bash
   sudo systemctl status mongod
   ```

3. **Permission denied**: Ensure proper file ownership
   ```bash
   sudo chown -R pay4u:pay4u /opt/pay4u
   ```

4. **Nginx 502 error**: Check if backend is running
   ```bash
   sudo -u pay4u pm2 status
   ```

## Security Recommendations

1. Change default MongoDB port
2. Use strong passwords for database users
3. Configure fail2ban for SSH protection
4. Regular security updates
5. Use HTTPS with valid SSL certificates
6. Configure proper firewall rules
7. Regular database backups

## Performance Optimization

1. Enable Nginx gzip compression
2. Configure MongoDB indexes
3. Use PM2 cluster mode for multiple CPU cores
4. Implement Redis for session storage (optional)
5. Configure log rotation

For support and updates, refer to the project documentation or contact the development team.
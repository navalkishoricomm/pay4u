# Pay4U Deployment Guide

This repository contains a complete digital wallet and recharge application with multiple deployment options.

## 🚀 Quick Start

### Option 1: Ubuntu 24.04 Deployment (Recommended)

**Automated Installation:**
```bash
# Download and run the deployment script
wget https://raw.githubusercontent.com/your-username/pay4u/main/deploy-ubuntu.sh
chmod +x deploy-ubuntu.sh
sudo ./deploy-ubuntu.sh
```

**Manual Installation:**
Follow the detailed guide in [DEPLOYMENT_UBUNTU.md](./DEPLOYMENT_UBUNTU.md)

### Option 2: Docker Deployment

**Prerequisites:**
- Docker and Docker Compose installed

**Quick Deploy:**
```bash
# Clone repository
git clone https://github.com/your-username/pay4u.git
cd pay4u

# Start with Docker Compose
docker-compose up -d --build
```

**Windows Users:**
```cmd
# Run the Windows deployment script
deploy.bat
```

## 📋 System Requirements

### Minimum Requirements
- **CPU:** 2 cores
- **RAM:** 2GB
- **Storage:** 20GB
- **OS:** Ubuntu 20.04+ / CentOS 8+ / Docker

### Recommended Requirements
- **CPU:** 4 cores
- **RAM:** 4GB
- **Storage:** 50GB SSD
- **OS:** Ubuntu 24.04 LTS

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
│   Port: 80/443  │    │   Port: 5000    │    │   Port: 27017   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │      PM2        │    │   File System   │
│ (Reverse Proxy) │    │ (Process Mgmt)  │    │   (Uploads)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://localhost:27017/pay4u_production
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRE=7d
```

**Frontend (.env.production):**
```env
REACT_APP_API_URL=https://your-domain.com/api
REACT_APP_ENVIRONMENT=production
GENERATE_SOURCEMAP=false
```

### Database Configuration

MongoDB is automatically configured with:
- Database: `pay4u_production`
- User: `pay4u`
- Indexes for optimal performance
- Backup directory: `/opt/pay4u/backups`

## 🔒 Security Features

- **Authentication:** JWT-based authentication
- **Authorization:** Role-based access control (User/Admin)
- **HTTPS:** SSL/TLS encryption with Let's Encrypt
- **Firewall:** UFW configured with minimal open ports
- **Headers:** Security headers via Nginx
- **Validation:** Input validation and sanitization
- **Rate Limiting:** API rate limiting

## 📊 Monitoring & Logging

### Log Locations
- **Application:** `/opt/pay4u/logs/`
- **Nginx:** `/var/log/nginx/`
- **MongoDB:** `/var/log/mongodb/`
- **System:** `journalctl -u pay4u`

### Monitoring Commands
```bash
# Application status
sudo -u pay4u pm2 status
sudo -u pay4u pm2 logs

# System services
sudo systemctl status nginx
sudo systemctl status mongod
sudo systemctl status pay4u

# Resource usage
htop
df -h
free -h
```

## 🔄 Maintenance

### Application Updates
```bash
# Pull latest code
cd /opt/pay4u/app
sudo -u pay4u git pull

# Install dependencies
cd backend && sudo -u pay4u npm ci --production
cd ../frontend && sudo -u pay4u npm ci && sudo -u pay4u npm run build

# Restart application
sudo -u pay4u pm2 restart all
```

### Database Backup
```bash
# Create backup
mongodump --db pay4u_production --out /opt/pay4u/backups/$(date +%Y%m%d_%H%M%S)

# Automated daily backup (add to crontab)
0 2 * * * mongodump --db pay4u_production --out /opt/pay4u/backups/$(date +\%Y\%m\%d_\%H\%M\%S)
```

### SSL Certificate Renewal
```bash
# Renew certificates (automated with cron)
sudo certbot renew --quiet

# Manual renewal
sudo certbot renew
sudo systemctl reload nginx
```

## 🚨 Troubleshooting

### Common Issues

**1. Application won't start**
```bash
# Check logs
sudo -u pay4u pm2 logs
journalctl -u pay4u -f

# Check dependencies
cd /opt/pay4u/app/backend
npm audit
```

**2. Database connection failed**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check connection
mongo --eval "db.adminCommand('ismaster')"
```

**3. Nginx 502 Bad Gateway**
```bash
# Check backend is running
sudo -u pay4u pm2 status

# Check Nginx configuration
sudo nginx -t
```

**4. High memory usage**
```bash
# Restart application
sudo -u pay4u pm2 restart all

# Check for memory leaks
sudo -u pay4u pm2 monit
```

### Performance Optimization

**1. Enable MongoDB Indexes**
```javascript
// Connect to MongoDB and run:
db.transactions.createIndex({ "wallet": 1, "createdAt": -1 })
db.users.createIndex({ "email": 1 })
db.voucherorders.createIndex({ "user": 1, "createdAt": -1 })
```

**2. Nginx Optimization**
```nginx
# Add to nginx.conf
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
gzip_comp_level 6;
```

**3. PM2 Cluster Mode**
```bash
# Use all CPU cores
sudo -u pay4u pm2 start ecosystem.config.js --env production
```

## 📞 Support

### Health Checks
- **Frontend:** `http://your-domain.com`
- **Backend API:** `http://your-domain.com/api`
- **Database:** `mongo --eval "db.adminCommand('ping')"`

### Getting Help
1. Check logs first
2. Review this documentation
3. Search existing issues
4. Create new issue with:
   - Error logs
   - System information
   - Steps to reproduce

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test deployment
5. Submit pull request

---

**Need help?** Check the [troubleshooting section](#-troubleshooting) or create an issue.
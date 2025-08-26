# Pay4U Ubuntu 24.04 Deployment Checklist

## Pre-Deployment Checklist

### ✅ System Requirements
- [ ] Ubuntu 24.04 LTS server with sudo access
- [ ] Minimum 2GB RAM, 2 CPU cores, 20GB storage
- [ ] Domain name pointing to server IP (for SSL)
- [ ] SSH access configured
- [ ] Firewall configured (ports 22, 80, 443)

### ✅ Dependencies Installation
- [ ] Node.js 18.x installed
- [ ] MongoDB 7.x installed and running
- [ ] Nginx installed
- [ ] PM2 installed globally
- [ ] Git installed
- [ ] Certbot installed (for SSL)

## Deployment Steps

### 1. User and Directory Setup
- [ ] Created `pay4u` system user
- [ ] Created `/opt/pay4u/app` directory
- [ ] Set proper ownership and permissions
- [ ] Created logs directory `/opt/pay4u/logs`
- [ ] Created backups directory `/opt/pay4u/backups`

### 2. Application Deployment
- [ ] Cloned repository to `/opt/pay4u/app`
- [ ] Installed backend dependencies (`npm ci --production`)
- [ ] Installed frontend dependencies (`npm ci`)
- [ ] Built frontend (`npm run build`)
- [ ] Created uploads directory with proper permissions

### 3. Environment Configuration
- [ ] Created backend `.env` file with production settings
- [ ] Created frontend `.env.production` file
- [ ] Configured MongoDB connection string
- [ ] Set secure JWT secret
- [ ] Configured email settings (if applicable)
- [ ] Set API keys and external service credentials

### 4. Database Setup
- [ ] MongoDB service running
- [ ] Created `pay4u_production` database
- [ ] Created database user with proper permissions
- [ ] Applied database indexes
- [ ] Verified database connection

### 5. Process Management (PM2)
- [ ] Copied `ecosystem.config.js` to application directory
- [ ] Started application with PM2
- [ ] Verified PM2 status shows running processes
- [ ] Configured PM2 startup script
- [ ] Saved PM2 configuration

### 6. Web Server (Nginx)
- [ ] Copied nginx configuration to `/etc/nginx/sites-available/pay4u`
- [ ] Created symbolic link in `/etc/nginx/sites-enabled/`
- [ ] Tested nginx configuration (`nginx -t`)
- [ ] Restarted nginx service
- [ ] Verified nginx is serving static files
- [ ] Verified API proxy is working

### 7. SSL Certificate (Let's Encrypt)
- [ ] Installed Certbot
- [ ] Obtained SSL certificate for domain
- [ ] Configured nginx for HTTPS
- [ ] Set up automatic certificate renewal
- [ ] Verified HTTPS is working

### 8. Firewall Configuration
- [ ] Enabled UFW firewall
- [ ] Allowed SSH (port 22)
- [ ] Allowed HTTP (port 80)
- [ ] Allowed HTTPS (port 443)
- [ ] Verified firewall rules

### 9. System Service (Optional)
- [ ] Copied `pay4u.service` to `/etc/systemd/system/`
- [ ] Enabled systemd service
- [ ] Verified service starts on boot

## Post-Deployment Verification

### ✅ Application Health Checks
- [ ] Frontend accessible at `https://your-domain.com`
- [ ] Backend API responding at `https://your-domain.com/api`
- [ ] User registration working
- [ ] User login working
- [ ] Wallet operations functional
- [ ] Transaction history loading
- [ ] Admin panel accessible
- [ ] File uploads working

### ✅ System Health Checks
- [ ] All services running (`systemctl status`)
- [ ] No errors in application logs
- [ ] No errors in nginx logs
- [ ] No errors in MongoDB logs
- [ ] SSL certificate valid
- [ ] Database connections stable

### ✅ Performance Checks
- [ ] Page load times acceptable (<3 seconds)
- [ ] API response times acceptable (<500ms)
- [ ] Memory usage within limits
- [ ] CPU usage normal
- [ ] Disk space sufficient

### ✅ Security Checks
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Security headers present
- [ ] No sensitive data in logs
- [ ] Database access restricted
- [ ] File upload restrictions working
- [ ] Rate limiting functional

## Monitoring Setup

### ✅ Log Monitoring
- [ ] Application logs rotating properly
- [ ] Nginx access/error logs configured
- [ ] MongoDB logs accessible
- [ ] System logs (journalctl) working

### ✅ Automated Backups
- [ ] Database backup script created
- [ ] Backup cron job configured
- [ ] Backup retention policy set
- [ ] Backup restoration tested

### ✅ Monitoring Commands
```bash
# Application status
sudo -u pay4u pm2 status
sudo -u pay4u pm2 logs --lines 50

# System services
sudo systemctl status nginx mongod

# Resource usage
free -h
df -h
htop

# Logs
tail -f /opt/pay4u/logs/app.log
tail -f /var/log/nginx/access.log
journalctl -u pay4u -f
```

## Troubleshooting Quick Reference

### Common Issues and Solutions

**Application won't start:**
```bash
# Check PM2 status and logs
sudo -u pay4u pm2 status
sudo -u pay4u pm2 logs

# Check environment variables
sudo -u pay4u cat /opt/pay4u/app/backend/.env

# Restart application
sudo -u pay4u pm2 restart all
```

**502 Bad Gateway:**
```bash
# Check if backend is running
sudo -u pay4u pm2 status

# Check nginx configuration
sudo nginx -t

# Restart services
sudo systemctl restart nginx
sudo -u pay4u pm2 restart all
```

**Database connection failed:**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Test connection
mongo --eval "db.adminCommand('ping')"

# Restart MongoDB
sudo systemctl restart mongod
```

**SSL certificate issues:**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Restart nginx
sudo systemctl restart nginx
```

## Maintenance Schedule

### Daily
- [ ] Check application logs for errors
- [ ] Monitor system resources
- [ ] Verify backup completion

### Weekly
- [ ] Review security logs
- [ ] Check SSL certificate expiry
- [ ] Update system packages
- [ ] Review performance metrics

### Monthly
- [ ] Update application dependencies
- [ ] Review and rotate logs
- [ ] Test backup restoration
- [ ] Security audit

## Emergency Contacts

- **System Administrator:** [Your contact]
- **Database Administrator:** [Your contact]
- **Security Team:** [Your contact]
- **Hosting Provider:** [Provider support]

## Documentation Links

- [Full Deployment Guide](./DEPLOYMENT_UBUNTU.md)
- [General Deployment README](./README_DEPLOYMENT.md)
- [Application Documentation](./README.md)
- [API Documentation](./API_DOCS.md)

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Version:** _______________
**Domain:** _______________
**Server IP:** _______________

**Notes:**
_________________________________
_________________________________
_________________________________
# Pay4U Production Update Guide

This guide explains how to update your existing Pay4U production deployment with new changes without doing a fresh installation.

## 📋 Available Update Scripts

### 1. Linux/Ubuntu Server Update
**File:** `update-production.sh`

**Prerequisites:**
- Existing Pay4U installation on Ubuntu/Linux server
- Root or sudo access
- Git repository configured

**Usage:**
```bash
# Make script executable
chmod +x update-production.sh

# Run update
sudo ./update-production.sh
```

**What it does:**
- ✅ Creates automatic backup of current deployment
- ✅ Stops PM2 and systemd services safely
- ✅ Pulls latest code from git repository
- ✅ Updates backend dependencies
- ✅ Rebuilds frontend with production settings
- ✅ Restarts all services
- ✅ Verifies deployment health
- ✅ Automatic rollback on failure
- ✅ Cleans up old backups (keeps last 5)

### 2. Windows Server Update
**File:** `update-production.bat`

**Prerequisites:**
- Existing Pay4U installation on Windows server
- Administrator privileges
- Git for Windows installed
- Node.js and npm installed

**Usage:**
```cmd
# Right-click and "Run as Administrator" or
update-production.bat
```

**What it does:**
- ✅ Creates backup of current deployment
- ✅ Stops PM2 processes and Windows services
- ✅ Updates code from git repository
- ✅ Updates backend and frontend dependencies
- ✅ Rebuilds frontend
- ✅ Restarts services
- ✅ Verifies deployment
- ✅ Automatic rollback on failure

### 3. Docker Deployment Update
**File:** `update-docker.sh`

**Prerequisites:**
- Docker and Docker Compose installed
- Existing Docker-based Pay4U deployment
- Git repository configured

**Usage:**
```bash
# Make script executable
chmod +x update-docker.sh

# Update deployment
./update-docker.sh

# Other commands
./update-docker.sh logs          # Show container logs
./update-docker.sh status        # Show container status
./update-docker.sh rollback DATE # Rollback to specific backup
```

**What it does:**
- ✅ Backs up database and volumes
- ✅ Updates application code
- ✅ Rebuilds Docker images with latest changes
- ✅ Restarts containers with zero-downtime
- ✅ Verifies all services are healthy
- ✅ Automatic rollback capability
- ✅ Docker resource cleanup

## 🔄 Update Process Flow

### Standard Update Process:
```
1. Pre-flight Checks
   ├── Verify existing installation
   ├── Check required tools (git, node, etc.)
   └── Validate permissions

2. Backup Creation
   ├── Application files backup
   ├── Database backup (if applicable)
   └── Configuration backup

3. Service Management
   ├── Stop running services gracefully
   ├── Wait for processes to terminate
   └── Verify services are stopped

4. Code Update
   ├── Stash local changes
   ├── Pull latest from git repository
   └── Verify code update success

5. Dependencies Update
   ├── Backend: npm ci --production
   ├── Frontend: npm ci && npm run build
   └── Handle any migration scripts

6. Service Restart
   ├── Start backend services
   ├── Start frontend services
   ├── Reload web server (nginx)
   └── Verify all services are running

7. Health Verification
   ├── API health checks
   ├── Frontend accessibility
   ├── Database connectivity
   └── Service status verification

8. Cleanup
   ├── Remove old backups
   ├── Clean temporary files
   └── Update logs
```

## 🚨 Rollback Procedures

### Automatic Rollback
All scripts include automatic rollback on failure:
- Detects deployment failures
- Stops failed services
- Restores from backup automatically
- Restarts services with previous version

### Manual Rollback

**Linux/Ubuntu:**
```bash
# Restore from specific backup
sudo cp -r /opt/pay4u/backups/backup_YYYYMMDD_HHMMSS /opt/pay4u/app
sudo systemctl restart pay4u
```

**Windows:**
```cmd
# Restore from backup directory
xcopy C:\pay4u\backups\backup_YYYYMMDD_HHMMSS C:\pay4u\app /E /I /H /Y
# Restart services manually
```

**Docker:**
```bash
# Use built-in rollback command
./update-docker.sh rollback YYYYMMDD_HHMMSS
```

## 📊 Monitoring and Verification

### Health Check Endpoints
- **Backend API:** `http://your-domain:5000/api/health`
- **Frontend:** `http://your-domain` or `https://your-domain`
- **Database:** Connection verified through backend

### Service Status Commands

**Linux/Ubuntu:**
```bash
# Check PM2 processes
sudo -u pay4u pm2 status

# Check systemd service
sudo systemctl status pay4u

# Check nginx
sudo systemctl status nginx

# Check application logs
sudo -u pay4u pm2 logs
```

**Windows:**
```cmd
# Check PM2 processes
pm2 status

# Check Windows service
sc query Pay4U

# Check application logs
pm2 logs
```

**Docker:**
```bash
# Check container status
docker-compose ps

# Check logs
docker-compose logs

# Check specific service
docker-compose logs backend
```

## ⚙️ Configuration Updates

### Environment Variables
If you need to update environment variables:

1. **Before running update script:**
   ```bash
   # Edit environment files
   nano backend/.env
   nano frontend/.env.production
   ```

2. **Run update script as normal**
   - Scripts will use new environment variables
   - Frontend will be rebuilt with new settings

### Database Migrations
If your update includes database changes:

1. **Place migration scripts in:** `backend/migrations/`
2. **Update scripts will automatically run migrations**
3. **Verify migration success in logs**

## 🔒 Security Considerations

### Backup Security
- Backups contain sensitive data
- Store backups in secure location
- Regularly clean old backups
- Consider encrypting backup files

### Update Security
- Always test updates in staging first
- Verify git repository authenticity
- Check for security updates in dependencies
- Monitor logs for unusual activity

## 🐛 Troubleshooting

### Common Issues

**1. Git Pull Fails**
```bash
# Solution: Reset local changes
git reset --hard HEAD
git pull origin main
```

**2. npm Install Fails**
```bash
# Solution: Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**3. Services Won't Start**
```bash
# Check logs for errors
pm2 logs
# or
journalctl -u pay4u -f
```

**4. Database Connection Issues**
```bash
# Check MongoDB status
sudo systemctl status mongod
# Restart if needed
sudo systemctl restart mongod
```

### Getting Help

1. **Check application logs first**
2. **Verify all services are running**
3. **Test individual components**
4. **Use rollback if issues persist**
5. **Contact support with specific error messages**

## 📝 Best Practices

### Before Updates
- ✅ Test in staging environment first
- ✅ Notify users of maintenance window
- ✅ Verify backup procedures
- ✅ Check disk space availability
- ✅ Review changelog for breaking changes

### During Updates
- ✅ Monitor update progress
- ✅ Watch for error messages
- ✅ Verify each step completes successfully
- ✅ Don't interrupt the update process

### After Updates
- ✅ Verify all functionality works
- ✅ Check application logs
- ✅ Test critical user flows
- ✅ Monitor performance metrics
- ✅ Notify users update is complete

## 📞 Support

If you encounter issues during updates:

1. **Check this guide first**
2. **Review application logs**
3. **Try rollback procedure**
4. **Contact technical support with:**
   - Error messages
   - Log files
   - System information
   - Steps that led to the issue

---

**Note:** Always test updates in a staging environment before applying to production!
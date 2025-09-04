# Server Authentication Fix Guide

## Problem Description
You're experiencing authentication errors on your production server with messages like:
- "Failed to load wallet data"
- "Failed to fetch transaction history" 
- "User recently changed password! Please log in again."

This is caused by the `passwordChangedAt` field in your User model that invalidates existing JWT tokens.

## Quick Fix (Recommended)

### Option 1: Using the Node.js Script

1. **Copy the fix script to your server:**
   ```bash
   # Upload server-auth-fix.js to your backend directory
   scp server-auth-fix.js user@your-server:/path/to/backend/
   ```

2. **SSH into your server:**
   ```bash
   ssh user@your-server
   cd /path/to/backend
   ```

3. **Run the fix:**
   ```bash
   node server-auth-fix.js
   ```

4. **Restart your backend service:**
   ```bash
   # If using PM2:
   pm2 restart pay4u-backend
   
   # If using SystemD:
   sudo systemctl restart your-service-name
   
   # If using Docker:
   docker-compose restart backend
   ```

### Option 2: Using Shell Script (Linux/Unix)

1. **Copy and run the shell script:**
   ```bash
   # Upload fix-server-auth.sh to your server
   scp fix-server-auth.sh user@your-server:/tmp/
   
   # SSH and run
   ssh user@your-server
   chmod +x /tmp/fix-server-auth.sh
   /tmp/fix-server-auth.sh
   ```

### Option 3: Manual Database Fix

If you prefer to fix it directly in MongoDB:

1. **Connect to your MongoDB:**
   ```bash
   mongo your-database-name
   # or
   mongosh your-database-name
   ```

2. **Clear the problematic field:**
   ```javascript
   // Find affected users
   db.users.find({ passwordChangedAt: { $exists: true } })
   
   // Clear the field
   db.users.updateMany(
     { passwordChangedAt: { $exists: true } },
     { $unset: { passwordChangedAt: 1 } }
   )
   
   // Verify the fix
   db.users.find({}, { email: 1, passwordChangedAt: 1 })
   ```

3. **Restart your backend service**

## Deployment Scenarios

### Scenario 1: Traditional VPS/Dedicated Server

```bash
# 1. Upload the fix script
scp server-auth-fix.js user@your-server:/var/www/your-app/backend/

# 2. SSH and run
ssh user@your-server
cd /var/www/your-app/backend
node server-auth-fix.js

# 3. Restart service (choose one):
pm2 restart all
# or
sudo systemctl restart your-app
# or
sudo service your-app restart
```

### Scenario 2: Docker Deployment

```bash
# 1. Copy script to your server
scp server-auth-fix.js user@your-server:/path/to/docker-project/

# 2. Run inside Docker container
ssh user@your-server
cd /path/to/docker-project

# Copy script into running container
docker cp server-auth-fix.js your-backend-container:/app/

# Execute inside container
docker exec -it your-backend-container node server-auth-fix.js

# Restart container
docker-compose restart backend
```

### Scenario 3: Shared Hosting (cPanel/Plesk)

1. **Upload via File Manager:**
   - Login to cPanel/Plesk
   - Navigate to your backend directory
   - Upload `server-auth-fix.js`

2. **Run via Terminal (if available):**
   ```bash
   cd /path/to/backend
   node server-auth-fix.js
   ```

3. **Or run via cron job:**
   - Create a one-time cron job
   - Command: `cd /path/to/backend && node server-auth-fix.js`

4. **Restart your Node.js application**

### Scenario 4: Cloud Platforms (AWS, DigitalOcean, etc.)

```bash
# For AWS EC2, DigitalOcean Droplets, etc.
scp -i your-key.pem server-auth-fix.js ec2-user@your-instance:/home/ec2-user/
ssh -i your-key.pem ec2-user@your-instance

# Move to backend directory
sudo cp server-auth-fix.js /var/www/backend/
cd /var/www/backend
sudo node server-auth-fix.js

# Restart service
sudo pm2 restart all
```

## Verification Steps

After applying the fix:

1. **Check if the fix worked:**
   ```bash
   # Test wallet endpoint
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
        http://your-server:5000/api/wallet/my-wallet
   ```

2. **Check your application:**
   - Refresh your web application
   - Try accessing wallet data
   - Test transaction history
   - Attempt a recharge

3. **Monitor logs:**
   ```bash
   # PM2 logs
   pm2 logs
   
   # SystemD logs
   sudo journalctl -u your-service -f
   
   # Docker logs
   docker-compose logs -f backend
   ```

## Troubleshooting

### Common Issues:

1. **"Cannot find module './models/User'"**
   - Make sure you're running the script from the backend directory
   - Check if `models/User.js` exists

2. **"MongoDB connection failed"**
   - Verify your `.env` file has correct `MONGODB_URI`
   - Check if MongoDB service is running
   - Ensure network connectivity

3. **"Permission denied"**
   - Run with `sudo` if needed
   - Check file permissions

4. **Script runs but issue persists**
   - Ensure you restarted the backend service
   - Clear browser cache/localStorage
   - Check if you're using the correct server URL

### Getting Help:

If you encounter issues:

1. **Check the script output** - it provides detailed error messages
2. **Verify your server setup** - ensure paths and services are correct
3. **Test locally first** - run the script on your development environment
4. **Check logs** - monitor your application logs for errors

## Security Notes

- This fix clears the `passwordChangedAt` field, which is safe
- It doesn't affect user passwords or other security measures
- JWT tokens will work normally after the fix
- Consider implementing proper password change handling in the future

## Files Included

- `server-auth-fix.js` - Main Node.js fix script (recommended)
- `fix-server-auth.sh` - Linux/Unix shell script
- `fix-server-auth.bat` - Windows batch script
- `SERVER_FIX_GUIDE.md` - This guide

Choose the method that best fits your server environment and deployment setup.
# 🔧 Backend API Troubleshooting Guide

## Issue: Backend API Not Accessible
**Problem:** Cannot access `https://pay4u.co.in:5000/` and login failures

## Step 1: Check Backend Service Status
```bash
# SSH into your server first
ssh your-username@pay4u.co.in

# Check PM2 process status
pm2 status

# Check if pay4u backend is running
pm2 list | grep pay4u
```

## Step 2: Check Backend Logs
```bash
# View backend logs
pm2 logs pay4u-backend

# View recent logs only
pm2 logs pay4u-backend --lines 50

# Monitor logs in real-time
pm2 logs pay4u-backend --follow
```

## Step 3: Check Port and Firewall
```bash
# Check if port 5000 is listening
sudo netstat -tlnp | grep :5000

# Check if process is using port 5000
sudo lsof -i :5000

# Check firewall status
sudo ufw status
```

## Step 4: Test Backend Directly on Server
```bash
# Test backend health endpoint locally on server
curl http://localhost:5000/api/health

# Test login endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'
```

## Step 5: Restart Backend Service
```bash
# Stop the backend service
pm2 stop pay4u-backend

# Start the backend service
pm2 start pay4u-backend

# Or restart
pm2 restart pay4u-backend

# Save PM2 configuration
pm2 save
```

## Step 6: Check Nginx Configuration
```bash
# Check Nginx configuration for backend proxy
sudo nginx -t

# View Nginx configuration
sudo cat /etc/nginx/sites-available/pay4u.co.in

# Restart Nginx if needed
sudo systemctl restart nginx
```

## Step 7: Manual Backend Start (if PM2 fails)
```bash
# Navigate to backend directory
cd /path/to/your/project/backend

# Install dependencies
npm install

# Start backend manually
node server.js

# Or with environment variables
NODE_ENV=production PORT=5000 node server.js
```

## Common Issues and Solutions

### 1. Backend Not Starting
- **Check:** Missing environment variables
- **Solution:** Ensure `.env` file exists with correct database credentials

### 2. Database Connection Issues
- **Check:** MongoDB connection string
- **Solution:** Verify MongoDB is running: `sudo systemctl status mongod`

### 3. Port Already in Use
- **Check:** Another process using port 5000
- **Solution:** Kill the process or change port

### 4. SSL/HTTPS Issues
- **Check:** Backend CORS configuration for HTTPS
- **Solution:** Ensure backend allows HTTPS origins

## Quick Fix Commands
```bash
# Complete backend restart sequence
pm2 stop pay4u-backend
pm2 delete pay4u-backend
cd /path/to/project/backend
pm2 start ecosystem.config.js --env production
pm2 save

# Check if everything is working
curl https://pay4u.co.in:5000/api/health
```

## Expected Responses

### Healthy Backend Response:
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2024-01-XX..."
}
```

### PM2 Status (Healthy):
```
┌─────┬──────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name             │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├─────┼──────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0   │ pay4u-backend    │ default     │ 1.0.0   │ fork    │ 12345    │ 5m     │ 0    │ online    │ 0%       │ 50.0mb   │ ubuntu   │ disabled │
└─────┴──────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

## Next Steps After Fix
1. Test login functionality from frontend
2. Verify all API endpoints are working
3. Test geolocation features with HTTPS
4. Monitor logs for any recurring issues

---
**Note:** Replace `/path/to/project` with your actual project path on the server.
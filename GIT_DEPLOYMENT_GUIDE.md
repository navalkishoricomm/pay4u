# 🚀 Git Deployment Guide for Pay4U SSL Setup

## Step 1: Push Files to Git Repository

### On your Windows machine:

```bash
# 1. Add all SSL configuration files to Git
git add .

# 2. Commit the SSL setup changes
git commit -m "Add SSL configuration files and HTTPS support

- Add SSL setup scripts (setup-ssl.sh, manual-ssl-steps.js)
- Update frontend .env.production for HTTPS
- Update backend CORS for HTTPS origins
- Add comprehensive SSL deployment guides
- Rebuild frontend with HTTPS API URLs"

# 3. Push to your Git repository
git push origin main
# OR if your branch is different:
# git push origin master
```

## Step 2: Pull Changes on Server

### On your Linux server (pay4u.co.in):

```bash
# 1. Navigate to your project directory
cd /var/www/pay4u
# OR wherever your project is located

# 2. Stop running services first
pm2 stop all
# OR if using systemd:
# sudo systemctl stop pay4u

# 3. Pull the latest changes
git pull origin main
# OR:
# git pull origin master

# 4. Check what files were updated
git log --oneline -5
ls -la
```

## Step 3: Run SSL Setup Scripts

### Option A: Automated Setup (Recommended)

```bash
# 1. Make the setup script executable
chmod +x setup-ssl.sh

# 2. Run the SSL setup script as root
sudo ./setup-ssl.sh

# The script will:
# - Configure Nginx for SSL
# - Update frontend environment
# - Update backend CORS
# - Restart services
# - Run SSL tests
```

### Option B: Manual Step-by-Step Setup

#### Step 3.1: Configure Nginx for SSL

```bash
# Create SSL-enabled Nginx configuration
sudo tee /etc/nginx/sites-available/pay4u > /dev/null <<'EOF'
server {
    listen 80;
    server_name pay4u.co.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pay4u.co.in;

    ssl_certificate /etc/letsencrypt/live/pay4u.co.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pay4u.co.in/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Frontend
    location / {
        root /var/www/pay4u/frontend/build;
        try_files $uri $uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
}
EOF

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

#### Step 3.2: Install Dependencies and Build Frontend

```bash
# Navigate to frontend directory
cd /var/www/pay4u/frontend

# Install dependencies (if needed)
npm install

# Build frontend with HTTPS configuration
npm run build
```

#### Step 3.3: Install Backend Dependencies

```bash
# Navigate to backend directory
cd /var/www/pay4u/backend

# Install dependencies (if needed)
npm install
```

#### Step 3.4: Start Services

```bash
# Start backend with PM2
cd /var/www/pay4u/backend
pm2 start ecosystem.config.js
# OR start individual process:
# pm2 start server.js --name "pay4u-backend"

# Save PM2 configuration
pm2 save

# Check PM2 status
pm2 status
pm2 logs
```

## Step 4: Verify SSL Setup

### Test Commands:

```bash
# 1. Test HTTPS response
curl -I https://pay4u.co.in

# 2. Test HTTP to HTTPS redirect
curl -I http://pay4u.co.in

# 3. Test API endpoint
curl -I https://pay4u.co.in/api/health

# 4. Check SSL certificate
openssl s_client -connect pay4u.co.in:443 -servername pay4u.co.in </dev/null 2>/dev/null | openssl x509 -noout -dates

# 5. Check Nginx status
sudo systemctl status nginx

# 6. Check backend logs
pm2 logs
```

## Step 5: Test Geolocation (Critical)

### In Browser:

1. Open `https://pay4u.co.in`
2. Open Developer Tools (F12)
3. Go to Console tab
4. Run:
   ```javascript
   navigator.geolocation.getCurrentPosition(
       position => console.log('✅ Geolocation works:', position.coords),
       error => console.error('❌ Geolocation failed:', error)
   )
   ```

## 🔧 Troubleshooting Commands

### If SSL Certificate Issues:
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate if needed
sudo certbot renew --dry-run

# Check certificate files
sudo ls -la /etc/letsencrypt/live/pay4u.co.in/
```

### If Nginx Issues:
```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### If Backend Issues:
```bash
# Check PM2 logs
pm2 logs --lines 50

# Restart backend
pm2 restart all

# Check if port 5000 is listening
sudo netstat -tlnp | grep :5000
```

### If Frontend Issues:
```bash
# Check if build directory exists
ls -la /var/www/pay4u/frontend/build/

# Rebuild frontend
cd /var/www/pay4u/frontend
npm run build
```

## 📋 Success Checklist

- [ ] Git changes pulled successfully
- [ ] SSL certificate exists and is valid
- [ ] Nginx configuration updated and tested
- [ ] Frontend built with HTTPS URLs
- [ ] Backend started with updated CORS
- [ ] HTTPS loads without certificate errors
- [ ] HTTP redirects to HTTPS (301/302)
- [ ] API endpoints accessible via HTTPS
- [ ] **Geolocation API works** (main goal)
- [ ] No mixed content warnings in browser

## 🎯 Quick Deployment Summary

```bash
# Complete deployment in one go:
cd /var/www/pay4u
pm2 stop all
git pull origin main
chmod +x setup-ssl.sh
sudo ./setup-ssl.sh

# Test everything:
curl -I https://pay4u.co.in
curl -I https://pay4u.co.in/api/health
pm2 status
```

## 🔄 SSL Auto-Renewal Setup

```bash
# Set up automatic certificate renewal
sudo crontab -e

# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx
```

---

**🎉 After completing these steps, your Pay4U application will be fully SSL-enabled and the geolocation API will work!**

**🔗 Access your secure application at: https://pay4u.co.in**
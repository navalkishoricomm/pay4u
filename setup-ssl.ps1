# SSL Setup Script for Pay4U Application (Windows/PowerShell)
# This script automates Steps 4-7 from the SSL_SETUP_GUIDE.md

param(
    [string]$Domain = "pay4u.co.in",
    [string]$FrontendPath = "C:\Users\nkcpl2\Documents\traePay4U\frontend",
    [string]$BackendPath = "C:\Users\nkcpl2\Documents\traePay4U\backend"
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

Write-Host "🔐 Pay4U SSL Setup Script (Windows)" -ForegroundColor $Blue
Write-Host "===================================" -ForegroundColor $Blue
Write-Host ""

Write-Status "Starting SSL setup for $Domain"
Write-Warning "This script prepares configuration files. You'll need to deploy them to your Linux server."
Write-Host ""

# Step 4: Create Nginx SSL Configuration
Write-Status "Step 4: Creating Nginx SSL configuration..."

$nginxConfig = @"
server {
    listen 80;
    server_name pay4u.co.in;
    return 301 https://`$server_name`$request_uri;
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
        try_files `$uri `$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)`$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_set_header X-Forwarded-Host `$host;
        proxy_set_header X-Forwarded-Port `$server_port;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
}
"@

$nginxConfigPath = "$PSScriptRoot\nginx-ssl-config"
$nginxConfig | Out-File -FilePath $nginxConfigPath -Encoding UTF8
Write-Success "Created Nginx SSL configuration at: $nginxConfigPath"

# Step 5: Update Frontend Environment
Write-Status "Step 5: Updating frontend environment variables..."

if (Test-Path $FrontendPath) {
    $envProductionPath = "$FrontendPath\.env.production"
    
    # Backup existing .env.production if it exists
    if (Test-Path $envProductionPath) {
        $backupPath = "$envProductionPath.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Copy-Item $envProductionPath $backupPath
        Write-Success "Backed up existing .env.production"
    }
    
    # Create new .env.production
    $envContent = @"
REACT_APP_API_URL=https://pay4u.co.in/api
REACT_APP_BASE_URL=https://pay4u.co.in
REACT_APP_ENVIRONMENT=production
GENERATE_SOURCEMAP=false
"@
    
    $envContent | Out-File -FilePath $envProductionPath -Encoding UTF8
    Write-Success "Updated frontend environment variables"
    
    # Rebuild frontend
    Write-Status "Rebuilding frontend with HTTPS URLs..."
    Push-Location $FrontendPath
    try {
        if (Get-Command npm -ErrorAction SilentlyContinue) {
            npm run build
            Write-Success "Frontend rebuilt successfully"
        } else {
            Write-Warning "npm not found. Please manually run 'npm run build' in $FrontendPath"
        }
    } catch {
        Write-Warning "Failed to build frontend: $($_.Exception.Message)"
    } finally {
        Pop-Location
    }
} else {
    Write-Warning "Frontend directory not found at $FrontendPath"
}

# Step 6: Update Backend CORS Configuration
Write-Status "Step 6: Creating backend CORS update script..."

$corsUpdateScript = @'
// Add this CORS configuration to your server.js or app.js

// Update your CORS configuration
const corsOptions = {
    origin: [
        "https://pay4u.co.in",
        "http://localhost:3000", // Keep for development
        "http://127.0.0.1:3000"  // Keep for development
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

app.use(cors(corsOptions));

// Also update any environment variables
// In your .env or .env.production file:
// FRONTEND_URL=https://pay4u.co.in
// CORS_ORIGIN=https://pay4u.co.in
'@

$corsScriptPath = "$PSScriptRoot\cors-update.js"
$corsUpdateScript | Out-File -FilePath $corsScriptPath -Encoding UTF8
Write-Success "Created CORS update script at: $corsScriptPath"

# Create deployment instructions
Write-Status "Creating deployment instructions..."

$deploymentInstructions = @"
# SSL Deployment Instructions for Pay4U

## Files Created:
1. nginx-ssl-config - Nginx configuration for SSL
2. cors-update.js - CORS configuration updates
3. .env.production - Updated frontend environment (in frontend folder)
4. Frontend build - Rebuilt with HTTPS URLs

## Deployment Steps:

### On your Linux server:

1. **Deploy Nginx Configuration:**
   ```bash
   sudo cp nginx-ssl-config /etc/nginx/sites-available/pay4u
   sudo nginx -t
   sudo systemctl reload nginx
   ```

2. **Update Backend CORS:**
   - Copy the CORS configuration from cors-update.js
   - Update your backend/server.js file
   - Restart your backend service:
   ```bash
   pm2 restart all
   # OR
   sudo systemctl restart pay4u
   ```

3. **Deploy Frontend:**
   ```bash
   # Copy the built frontend to your server
   rsync -av frontend/build/ user@pay4u.co.in:/var/www/pay4u/frontend/build/
   ```

4. **Test SSL Setup:**
   ```bash
   # Test HTTPS response
   curl -I https://pay4u.co.in
   
   # Test HTTP to HTTPS redirect
   curl -I http://pay4u.co.in
   
   # Test API endpoint
   curl -I https://pay4u.co.in/api/health
   
   # Check SSL certificate
   openssl s_client -connect pay4u.co.in:443 -servername pay4u.co.in
   ```

5. **Set up SSL Auto-renewal:**
   ```bash
   sudo crontab -e
   # Add this line:
   0 12 * * * /usr/bin/certbot renew --quiet
   ```

## Verification Checklist:
- [ ] HTTPS loads without certificate errors
- [ ] HTTP redirects to HTTPS
- [ ] API endpoints work via HTTPS
- [ ] Login functionality works
- [ ] Geolocation API works (main reason for SSL)
- [ ] No mixed content warnings in browser console

## Troubleshooting:
- Check Nginx logs: /var/log/nginx/error.log
- Check SSL logs: /var/log/letsencrypt/letsencrypt.log
- Check backend logs: pm2 logs or systemctl status pay4u
- Verify DNS: dig pay4u.co.in
- Test SSL: https://www.ssllabs.com/ssltest/
"@

$instructionsPath = "$PSScriptRoot\SSL_DEPLOYMENT_INSTRUCTIONS.md"
$deploymentInstructions | Out-File -FilePath $instructionsPath -Encoding UTF8
Write-Success "Created deployment instructions at: $instructionsPath"

# Create a simple test script
Write-Status "Creating SSL test script..."

$testScript = @"
#!/bin/bash
# SSL Test Script for Pay4U

DOMAIN="pay4u.co.in"

echo "🧪 Testing SSL Setup for $DOMAIN"
echo "================================"
echo ""

echo "1. Testing HTTPS response..."
curl -I -s --connect-timeout 10 "https://$DOMAIN" | head -1

echo "2. Testing HTTP to HTTPS redirect..."
curl -I -s --connect-timeout 10 "http://$DOMAIN" | head -1

echo "3. Testing API endpoint..."
curl -I -s --connect-timeout 10 "https://$DOMAIN/api/health" | head -1

echo "4. Checking SSL certificate expiry..."
openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" </dev/null 2>/dev/null | openssl x509 -noout -dates

echo ""
echo "✅ SSL tests completed!"
echo "Visit: https://$DOMAIN"
"@

$testScriptPath = "$PSScriptRoot\test-ssl.sh"
$testScript | Out-File -FilePath $testScriptPath -Encoding UTF8
Write-Success "Created SSL test script at: $testScriptPath"

Write-Host ""
Write-Host "✅ SSL Setup Preparation Complete!" -ForegroundColor $Green
Write-Host "==================================" -ForegroundColor $Green
Write-Host ""
Write-Success "Files created in: $PSScriptRoot"
Write-Host ""
Write-Status "Next steps:"
Write-Host "1. Review the SSL_DEPLOYMENT_INSTRUCTIONS.md file"
Write-Host "2. Copy the generated files to your Linux server"
Write-Host "3. Follow the deployment instructions"
Write-Host "4. Run the test-ssl.sh script to verify setup"
Write-Host ""
Write-Success "Your Pay4U application will be ready for HTTPS! 🎉"
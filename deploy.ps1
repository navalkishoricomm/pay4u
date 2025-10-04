# TraePay4U Production Deployment Script (PowerShell)
# This script helps deploy the application to production server

Write-Host "🚀 TraePay4U Production Deployment" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Configuration - UPDATE THESE VALUES
$SERVER_USER = "your_username"
$SERVER_HOST = "your_server_ip"
$SERVER_PATH = "/var/www/pay4u"
$BACKUP_DIR = "/var/backups/pay4u"

Write-Host "Step 1: Frontend build already completed ✅" -ForegroundColor Green

Write-Host "Step 2: Preparing deployment package..." -ForegroundColor Yellow

# Create deployment directory
if (Test-Path "deployment") {
    Remove-Item -Recurse -Force "deployment"
}
New-Item -ItemType Directory -Path "deployment" | Out-Null

# Copy backend files
Copy-Item -Path "backend\*" -Destination "deployment\" -Recurse -Force

# Copy frontend build
Copy-Item -Path "frontend\build" -Destination "deployment\frontend-build" -Recurse -Force

Write-Host "✅ Deployment package prepared" -ForegroundColor Green

Write-Host "Step 3: Manual deployment commands" -ForegroundColor Yellow
Write-Host "Please run these commands on your server:" -ForegroundColor White
Write-Host ""
Write-Host "# 1. Create backup" -ForegroundColor Cyan
Write-Host "sudo mkdir -p $BACKUP_DIR/`$(date +%Y%m%d_%H%M%S)" -ForegroundColor Gray
Write-Host "sudo cp -r $SERVER_PATH/* $BACKUP_DIR/`$(date +%Y%m%d_%H%M%S)/" -ForegroundColor Gray
Write-Host ""
Write-Host "# 2. Upload files (use SCP, SFTP, or Git)" -ForegroundColor Cyan
Write-Host "scp -r deployment/* $SERVER_USER@$SERVER_HOST`:$SERVER_PATH/" -ForegroundColor Gray
Write-Host ""
Write-Host "# 3. Install dependencies" -ForegroundColor Cyan
Write-Host "cd $SERVER_PATH && npm install --production" -ForegroundColor Gray
Write-Host ""
Write-Host "# 4. Set environment variables" -ForegroundColor Cyan
Write-Host "export NODE_ENV=production" -ForegroundColor Gray
Write-Host "export DATABASE_URI=your_mongodb_connection_string" -ForegroundColor Gray
Write-Host ""
Write-Host "# 5. Run admin reset script" -ForegroundColor Cyan
Write-Host "node serverAdminReset.js" -ForegroundColor Gray
Write-Host ""
Write-Host "# 6. Start/restart application" -ForegroundColor Cyan
Write-Host "pm2 start ecosystem.config.js --env production" -ForegroundColor Gray
Write-Host "# OR" -ForegroundColor Gray
Write-Host "npm start" -ForegroundColor Gray

Write-Host ""
Write-Host "✅ Deployment package ready in 'deployment' folder" -ForegroundColor Green
Write-Host "📁 Frontend build: deployment/frontend-build/" -ForegroundColor White
Write-Host "📁 Backend files: deployment/" -ForegroundColor White
Write-Host "🔧 Admin script: deployment/serverAdminReset.js" -ForegroundColor White
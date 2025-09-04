@echo off
echo ========================================
echo    Pay4U SSL Setup - Git Push Script
echo ========================================
echo.

echo [INFO] Adding all SSL configuration files to Git...
git add .

echo.
echo [INFO] Committing SSL setup changes...
git commit -m "Add SSL configuration and HTTPS support

- Add SSL setup scripts (setup-ssl.sh, deploy-ssl.sh, manual-ssl-steps.js)
- Update frontend .env.production for HTTPS API calls
- Update backend CORS configuration for HTTPS origins
- Add comprehensive SSL deployment guides
- Rebuild frontend with HTTPS URLs for geolocation support
- Add Git deployment guide with step-by-step commands"

echo.
echo [INFO] Pushing changes to Git repository...
git push origin main

if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Push to 'main' failed, trying 'master' branch...
    git push origin master
)

echo.
echo [SUCCESS] SSL configuration files pushed to Git!
echo.
echo ========================================
echo           Next Steps on Server:
echo ========================================
echo.
echo 1. SSH to your server: ssh user@pay4u.co.in
echo 2. Navigate to project: cd /var/www/pay4u
echo 3. Pull changes: git pull origin main
echo 4. Run deployment: sudo ./deploy-ssl.sh
echo 5. Test HTTPS: curl -I https://pay4u.co.in
echo.
echo ========================================
echo    Files Ready for SSL Deployment!
echo ========================================

pause
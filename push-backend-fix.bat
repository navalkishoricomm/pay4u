@echo off
echo ========================================
echo   Push Backend Fix Script
echo ========================================
echo.

echo Adding backend fix script to Git...
git add fix-backend-start.sh
git add ecosystem.config.js

echo.
echo Committing changes...
git commit -m "Add backend service fix script

- fix-backend-start.sh: Alternative method to start backend without ecosystem.config.js
- Includes PM2 direct start commands with production settings
- Provides fallback to direct Node.js start
- Includes health checks and status verification"

echo.
echo Pushing to repository...
git push origin main

echo.
echo ========================================
echo   Backend Fix Script Pushed!
echo ========================================
echo.
echo IMMEDIATE SOLUTION - Run these commands on your server:
echo.
echo 1. Quick PM2 start (without ecosystem.config.js):
echo    cd /path/to/your/project/backend
echo    pm2 start server.js --name "pay4u-backend" --env NODE_ENV=production --env PORT=5000
echo    pm2 save
echo.
echo 2. Or pull the fix script and run it:
echo    git pull origin main
echo    chmod +x fix-backend-start.sh
echo    ./fix-backend-start.sh
echo.
echo 3. Verify it's working:
echo    pm2 status
echo    curl http://localhost:5000/api/health
echo    curl https://pay4u.co.in:5000/api/health
echo.
echo The backend should start successfully with these commands!
echo.
pause
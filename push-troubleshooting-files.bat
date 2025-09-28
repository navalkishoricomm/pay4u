@echo off
echo ========================================
echo   Push Backend Troubleshooting Files
echo ========================================
echo.

echo Adding troubleshooting files to Git...
git add BACKEND_TROUBLESHOOTING.md
git add diagnose-backend.sh

echo.
echo Committing changes...
git commit -m "Add backend troubleshooting tools

- BACKEND_TROUBLESHOOTING.md: Comprehensive guide for diagnosing backend API issues
- diagnose-backend.sh: Automated diagnostic script for server-side troubleshooting
- Includes PM2 status checks, port verification, health endpoint tests
- Provides quick fix commands for common backend issues"

echo.
echo Pushing to repository...
git push origin main

echo.
echo ========================================
echo   Files pushed successfully!
echo ========================================
echo.
echo Next steps on your server:
echo 1. SSH into your server: ssh your-username@pay4u.co.in
echo 2. Navigate to project: cd /path/to/your/project
echo 3. Pull changes: git pull origin main
echo 4. Make diagnostic script executable: chmod +x diagnose-backend.sh
echo 5. Run diagnostic: ./diagnose-backend.sh
echo 6. Follow the troubleshooting guide: cat BACKEND_TROUBLESHOOTING.md
echo.
echo The diagnostic script will check:
echo - PM2 process status
echo - Port 5000 availability
echo - Backend health endpoint
echo - External HTTPS access
echo - Nginx configuration
echo - MongoDB status
echo.
pause
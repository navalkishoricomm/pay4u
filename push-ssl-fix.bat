@echo off
echo 🔧 Pushing SSL Configuration Fix to Git Repository...
echo.

echo 📁 Adding SSL fix files to Git...
git add nginx-ssl-fixed.conf
git add fix-nginx-ssl.sh

echo 📝 Committing SSL configuration fix...
git commit -m "Fix: Enable HTTPS server block in Nginx configuration

- Add properly configured HTTPS server block on port 443
- Enable SSL certificate configuration for pay4u.co.in
- Set up HTTP to HTTPS redirect
- Configure proper proxy headers for backend API
- Add security headers and HSTS
- Create fix-nginx-ssl.sh script for easy deployment

This fixes the SSL routing issue where HTTPS requests to port 5000
were failing because Nginx wasn't configured to handle SSL properly."

echo 🚀 Pushing to remote repository...
git push origin main

echo.
echo ✅ SSL fix files have been pushed to Git repository!
echo.
echo 🔍 Next steps on your server:
echo    1. SSH into your server: ssh root@pay4u.co.in
echo    2. Navigate to project: cd /var/www/pay4u
echo    3. Pull latest changes: git pull origin main
echo    4. Make script executable: chmod +x fix-nginx-ssl.sh
echo    5. Run SSL fix: sudo ./fix-nginx-ssl.sh
echo    6. Test HTTPS API: curl https://pay4u.co.in/api/health
echo.
echo 🎯 This will fix the SSL routing and enable HTTPS API access!
pause
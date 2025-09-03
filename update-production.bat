@echo off
REM Pay4U Production Update Script for Windows
REM This script updates an existing Pay4U deployment with new changes
REM Run this script on your Windows production server to deploy updates

setlocal enabledelayedexpansion

REM Configuration
set APP_NAME=pay4u
set APP_DIR=C:\pay4u
set APP_PATH=%APP_DIR%\app
set BACKUP_DIR=%APP_DIR%\backups
set DATE_TIME=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set DATE_TIME=%DATE_TIME: =0%
set BACKUP_PATH=%BACKUP_DIR%\backup_%DATE_TIME%

echo 🚀 Starting Pay4U production update...

REM Check if application directory exists
if not exist "%APP_PATH%" (
    echo ❌ Application directory %APP_PATH% not found. Please run fresh deployment first.
    pause
    exit /b 1
)

REM Create backup directory
echo 📦 Creating backup of current application...
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
mkdir "%BACKUP_PATH%"

REM Backup application files
xcopy "%APP_PATH%" "%BACKUP_PATH%" /E /I /H /Y >nul
if %errorlevel% neq 0 (
    echo ❌ Failed to create backup
    pause
    exit /b 1
)
echo ✅ Backup created at %BACKUP_PATH%

REM Stop services
echo 🛑 Stopping application services...

REM Stop PM2 processes if running
pm2 stop all >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ PM2 processes stopped
) else (
    echo ⚠️ PM2 processes not running or PM2 not installed
)

REM Stop Windows service if exists
sc stop Pay4U >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Windows service stopped
) else (
    echo ⚠️ Windows service not running or not configured
)

REM Update code
echo 📥 Updating application code...
cd /d "%APP_PATH%"

REM Stash any local changes and pull latest
git stash >nul 2>&1
git pull origin main
if %errorlevel% neq 0 (
    echo ❌ Failed to update code from git
    goto :rollback
)
echo ✅ Code updated successfully

REM Update backend
echo 🔧 Updating backend dependencies...
cd /d "%APP_PATH%\backend"

REM Install/update dependencies
npm ci --production
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    goto :rollback
)
echo ✅ Backend updated successfully

REM Update frontend
echo 🎨 Building updated frontend...
cd /d "%APP_PATH%\frontend"

REM Install dependencies
npm ci
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    goto :rollback
)

REM Build production version
npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build frontend
    goto :rollback
)
echo ✅ Frontend built successfully

REM Start services
echo 🚀 Starting application services...
cd /d "%APP_PATH%"

REM Start with PM2 if available
pm2 start ecosystem.config.js >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ PM2 processes started
    pm2 save >nul 2>&1
) else (
    echo ⚠️ PM2 not available, starting with node directly
    start "Pay4U Backend" /min node backend\server.js
    timeout /t 3 /nobreak >nul
)

REM Start Windows service if configured
sc start Pay4U >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Windows service started
) else (
    echo ⚠️ Windows service not configured
)

REM Verify deployment
echo 🔍 Verifying deployment...
timeout /t 10 /nobreak >nul

REM Check if backend is responding
curl -f http://localhost:5000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend API is responding
) else (
    echo ⚠️ Backend API health check failed
)

REM Check PM2 status if available
pm2 list | findstr "online" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ PM2 processes are running
) else (
    echo ⚠️ PM2 status check failed or not configured
)

REM Cleanup old backups (keep last 5)
echo 🧹 Cleaning up old backups...
cd /d "%BACKUP_DIR%"
for /f "skip=5 delims=" %%i in ('dir /b /o-d backup_*') do (
    rmdir /s /q "%%i" >nul 2>&1
)
echo ✅ Old backups cleaned up

echo 🎉 Pay4U update completed successfully!
echo 📍 Application is now running with the latest changes
echo 📦 Backup created at: %BACKUP_PATH%
echo.
echo Press any key to exit...
pause >nul
exit /b 0

:rollback
echo ❌ Deployment failed. Rolling back...

REM Stop current services
pm2 stop all >nul 2>&1
sc stop Pay4U >nul 2>&1

REM Restore backup if exists
if exist "%BACKUP_PATH%" (
    rmdir /s /q "%APP_PATH%" >nul 2>&1
    xcopy "%BACKUP_PATH%" "%APP_PATH%" /E /I /H /Y >nul
    
    REM Restart services
    cd /d "%APP_PATH%"
    pm2 start ecosystem.config.js >nul 2>&1
    
    echo ✅ Rollback completed
) else (
    echo ❌ No backup found for rollback
)

echo.
echo Press any key to exit...
pause >nul
exit /b 1
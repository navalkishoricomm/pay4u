@echo off
REM Pay4U Deployment Script for Windows
REM This script helps deploy the Pay4U application on Windows

echo 🚀 Starting Pay4U Deployment...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

echo ✅ Docker and Docker Compose are installed

REM Create necessary directories
echo 📁 Setting up directories...
if not exist "backend\uploads" mkdir "backend\uploads"
if not exist "nginx\ssl" mkdir "nginx\ssl"
echo ✅ Directories created

REM Build and start services
echo 🔨 Building and starting services...

REM Stop existing containers
docker-compose down

REM Build and start services
docker-compose up -d --build

if %errorlevel% neq 0 (
    echo ❌ Failed to start services
    docker-compose logs
    pause
    exit /b 1
)

echo ✅ Services started successfully

REM Wait for services to start
echo 🔍 Checking service health...
timeout /t 10 /nobreak >nul

REM Check if containers are running
docker-compose ps | findstr "Up" >nul
if %errorlevel% neq 0 (
    echo ❌ Some services failed to start
    docker-compose logs
    pause
    exit /b 1
)

echo ✅ Services are running

REM Show deployment info
echo.
echo 🎉 Deployment completed successfully!
echo.
echo 📋 Service Information:
echo    Frontend: http://localhost (port 80)
echo    Backend API: http://localhost:5000
echo    MongoDB: localhost:27017
echo.
echo 📝 Useful Commands:
echo    View logs: docker-compose logs -f
echo    Stop services: docker-compose down
echo    Restart services: docker-compose restart
echo    View status: docker-compose ps
echo.

pause
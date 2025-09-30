# Pay4U Windows Deployment Script
# PowerShell script for local development and server deployment preparation

param(
    [string]$Action = "help",
    [string]$ServerIP = "",
    [string]$ServerUser = "root"
)

# Configuration
$ProjectName = "Pay4U"
$LocalPath = Get-Location
$RemotePath = "/var/www/pay4u"
$Domain = "pay4u.co.in"

# Colors for output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Info { Write-ColorOutput "[INFO] $args" "Cyan" }
function Write-Success { Write-ColorOutput "[SUCCESS] $args" "Green" }
function Write-Warning { Write-ColorOutput "[WARNING] $args" "Yellow" }
function Write-Error { Write-ColorOutput "[ERROR] $args" "Red" }

# Function to check if command exists
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Local Development Functions
function Start-LocalDev {
    Write-Info "Starting local development environment..."
    
    # Check prerequisites
    if (-not (Test-Command "node")) {
        Write-Error "Node.js is not installed. Please install Node.js first."
        return
    }
    
    # Install backend dependencies
    Write-Info "Installing backend dependencies..."
    npm install
    
    # Install frontend dependencies
    if (Test-Path "frontend") {
        Write-Info "Installing frontend dependencies..."
        Set-Location "frontend"
        npm install
        Set-Location ".."
    }
    
    # Create local environment files
    Write-Info "Creating local environment files..."
    
    # Backend .env
    @"
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/pay4u_dev
JWT_SECRET=dev-jwt-secret-key
"@ | Out-File -FilePath ".env" -Encoding UTF8
    
    # Frontend .env.local
    if (Test-Path "frontend") {
        @"
REACT_APP_API_URL=http://localhost:5001/api
"@ | Out-File -FilePath "frontend\.env.local" -Encoding UTF8
    }
    
    Write-Success "Local development environment setup completed!"
    Write-Info "Run 'npm run dev' to start the backend server"
    Write-Info "Run 'cd frontend && npm start' to start the frontend server"
}

function Build-Production {
    Write-Info "Building production version..."
    
    # Clean previous builds
    if (Test-Path "frontend\build") {
        Remove-Item "frontend\build" -Recurse -Force
    }
    
    # Create production environment
    if (Test-Path "frontend") {
        @"
REACT_APP_API_URL=https://$Domain/api
"@ | Out-File -FilePath "frontend\.env.production" -Encoding UTF8
    }
    
    # Build frontend
    if (Test-Path "frontend") {
        Write-Info "Building frontend..."
        Set-Location "frontend"
        npm run build
        Set-Location ".."
    }
    
    Write-Success "Production build completed!"
}

function Deploy-ToServer {
    param([string]$ServerIP, [string]$ServerUser)
    
    if (-not $ServerIP) {
        Write-Error "Server IP is required. Use -ServerIP parameter."
        return
    }
    
    Write-Info "Deploying to server $ServerIP..."
    
    # Check if scp is available
    if (-not (Test-Command "scp")) {
        Write-Warning "SCP not found. Please install OpenSSH or use manual deployment."
        Write-Info "Manual deployment steps:"
        Write-Info "1. Copy files to server: scp -r * $ServerUser@$ServerIP`:$RemotePath/"
        Write-Info "2. Run deployment script: ssh $ServerUser@$ServerIP 'cd $RemotePath && chmod +x server-deploy.sh && ./server-deploy.sh'"
        return
    }
    
    # Build production version first
    Build-Production
    
    # Upload files to server
    Write-Info "Uploading files to server..."
    & scp -r * "$ServerUser@$ServerIP`:$RemotePath/"
    
    # Run deployment script on server
    Write-Info "Running deployment script on server..."
    & ssh "$ServerUser@$ServerIP" "cd $RemotePath && chmod +x server-deploy.sh && ./server-deploy.sh"
    
    Write-Success "Deployment to server completed!"
}

function Show-Status {
    Write-Info "Checking local development status..."
    
    # Check if processes are running
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Success "Node.js processes running: $($nodeProcesses.Count)"
        $nodeProcesses | Format-Table Id, ProcessName, CPU, WorkingSet
    } else {
        Write-Warning "No Node.js processes found"
    }
    
    # Check ports
    $ports = @(3000, 3001, 5001)
    foreach ($port in $ports) {
        $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($connection) {
            Write-Success "Port $port is in use"
        } else {
            Write-Warning "Port $port is available"
        }
    }
}

function Clean-Local {
    Write-Info "Cleaning local development environment..."
    
    # Stop Node processes
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Info "Stopping Node.js processes..."
        $nodeProcesses | Stop-Process -Force
    }
    
    # Remove node_modules
    if (Test-Path "node_modules") {
        Write-Info "Removing backend node_modules..."
        Remove-Item "node_modules" -Recurse -Force
    }
    
    if (Test-Path "frontend\node_modules") {
        Write-Info "Removing frontend node_modules..."
        Remove-Item "frontend\node_modules" -Recurse -Force
    }
    
    # Remove build directories
    if (Test-Path "frontend\build") {
        Write-Info "Removing frontend build..."
        Remove-Item "frontend\build" -Recurse -Force
    }
    
    # Remove lock files
    $lockFiles = @("package-lock.json", "frontend\package-lock.json")
    foreach ($file in $lockFiles) {
        if (Test-Path $file) {
            Write-Info "Removing $file..."
            Remove-Item $file -Force
        }
    }
    
    Write-Success "Local environment cleaned!"
}

function Show-Help {
    Write-ColorOutput "Pay4U Windows Deployment Script" "Magenta"
    Write-ColorOutput "================================" "Magenta"
    Write-Host ""
    Write-ColorOutput "Usage: .\deploy-windows.ps1 -Action <action> [options]" "White"
    Write-Host ""
    Write-ColorOutput "Actions:" "Yellow"
    Write-Host "  setup       - Setup local development environment"
    Write-Host "  build       - Build production version"
    Write-Host "  deploy      - Deploy to server (requires -ServerIP)"
    Write-Host "  status      - Show local development status"
    Write-Host "  clean       - Clean local environment"
    Write-Host "  help        - Show this help message"
    Write-Host ""
    Write-ColorOutput "Options:" "Yellow"
    Write-Host "  -ServerIP   - Server IP address for deployment"
    Write-Host "  -ServerUser - Server username (default: root)"
    Write-Host ""
    Write-ColorOutput "Examples:" "Green"
    Write-Host "  .\deploy-windows.ps1 -Action setup"
    Write-Host "  .\deploy-windows.ps1 -Action build"
    Write-Host "  .\deploy-windows.ps1 -Action deploy -ServerIP 192.168.1.100"
    Write-Host "  .\deploy-windows.ps1 -Action status"
    Write-Host "  .\deploy-windows.ps1 -Action clean"
    Write-Host ""
    Write-ColorOutput "Quick Commands:" "Cyan"
    Write-Host "  Start Backend:  npm run dev"
    Write-Host "  Start Frontend: cd frontend && npm start"
    Write-Host "  Build Frontend: cd frontend && npm run build"
    Write-Host ""
}

# Main execution
switch ($Action.ToLower()) {
    "setup" { Start-LocalDev }
    "build" { Build-Production }
    "deploy" { Deploy-ToServer -ServerIP $ServerIP -ServerUser $ServerUser }
    "status" { Show-Status }
    "clean" { Clean-Local }
    "help" { Show-Help }
    default { 
        Write-Error "Unknown action: $Action"
        Show-Help 
    }
}

Write-Host ""
Write-Host "Starting backend on port 5000" -ForegroundColor Cyan
$env:PORT = "5000"
# Ensure JWT envs so login works in dev
if (-not $env:JWT_SECRET) { $env:JWT_SECRET = "dev_secret_123" }
if (-not $env:JWT_EXPIRES_IN) { $env:JWT_EXPIRES_IN = "90d" }

Set-Location "$PSScriptRoot\.."
node backend/server.js
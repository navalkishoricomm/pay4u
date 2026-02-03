param(
  [int]$Port = 3000,
  [string]$FrontendPath = "$PSScriptRoot\..\frontend"
)

Write-Host "Ensuring dev server runs on port $Port" -ForegroundColor Cyan

# Identify and kill any process listening on the specified port
function Stop-ProcessOnPort {
  param([int]$TargetPort)

  Write-Host "Checking for processes on port $TargetPort..." -ForegroundColor Yellow
  $killed = $false

  try {
    $conns = Get-NetTCPConnection -LocalPort $TargetPort -State Listen -ErrorAction Stop
    if ($conns) {
      $pids = $conns | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique
      foreach ($pid in $pids) {
        try {
          Stop-Process -Id $pid -Force -ErrorAction Stop
          Write-Host "Killed PID $pid listening on port $TargetPort" -ForegroundColor Green
          $killed = $true
        } catch {
          Write-Warning "Failed to kill PID $pid on port ${TargetPort}: $_"
        }
      }
    }
  } catch {
    Write-Warning "Get-NetTCPConnection not available or failed: $_"
  }

  if (-not $killed) {
    # Fallback to netstat
    try {
      $netstat = netstat -ano | Select-String ":$TargetPort"
      foreach ($line in $netstat) {
        $parts = $line.ToString().Trim() -split '\s+'
        if ($parts.Length -ge 5) {
          $pid = [int]$parts[-1]
          try {
            Stop-Process -Id $pid -Force -ErrorAction Stop
            Write-Host "Killed PID $pid (netstat) on port ${TargetPort}" -ForegroundColor Green
            $killed = $true
          } catch {
            Write-Warning "Failed to kill PID $pid (netstat) on port ${TargetPort}: $_"
          }
        }
      }
    } catch {
      Write-Warning "netstat fallback failed: $_"
    }
  }

  if (-not $killed) {
    Write-Host "No process found listening on port $TargetPort" -ForegroundColor DarkGray
  }
}

Stop-ProcessOnPort -TargetPort $Port

if (-not (Test-Path $FrontendPath)) {
  Write-Error "Frontend path not found: $FrontendPath"
  exit 1
}

Push-Location $FrontendPath
try {
  $env:PORT = $Port.ToString()
  Write-Host "Starting React dev server on port $Port..." -ForegroundColor Cyan
  npm start
} finally {
  Pop-Location
}
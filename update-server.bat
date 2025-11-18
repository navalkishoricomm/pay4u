@echo off
SETLOCAL ENABLEDELAYEDEXPANSION
echo == Pay4U: Unified Server Update (Windows) ==

set ROOT_DIR=%~dp0
cd /d "%ROOT_DIR%"

if exist docker-compose.yml (
  where docker >nul 2>&1
  if %ERRORLEVEL%==0 (
    echo Detected Docker deployment. Running update-docker.sh via bash.
    bash "%ROOT_DIR%\update-docker.sh"
    goto :done
  )
)

if exist "%ROOT_DIR%\update-production.bat" (
  echo Detected PM2/Windows service deployment. Running update-production.bat
  call "%ROOT_DIR%\update-production.bat"
) else (
  echo update-production.bat not found. Aborting.
  exit /b 1
)

:done
echo Done.
ENDLOCAL
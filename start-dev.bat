@echo off
title Live Crypto Local Launcher
echo ====================================================================
echo   Live Crypto Development Environment Launcher
echo ====================================================================
echo.

:: 1. Start Docker Containers (PostgreSQL & Redis)
echo [1/4] Checking PostgreSQL and Redis containers...
docker compose up -d >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [INFO] Docker daemon not active. Ensure PostgreSQL and Redis are running locally.
) else (
    echo [OK] Docker containers active.
)
echo --------------------------------------------------------------------

:: 2. Launch Backend
echo [2/4] Initializing Backend Server on port 8080...
start "Live Crypto Backend API (:8080)" cmd /k "cd backend && npm run dev"
echo [OK] Backend window spawned.
echo --------------------------------------------------------------------

:: 3. Launch Frontend
echo [3/4] Initializing Frontend Next.js Web App on port 3000...
start "Live Crypto Frontend Web App (:3000)" cmd /k "cd frontend && npm run dev"
echo [OK] Frontend window spawned.
echo --------------------------------------------------------------------

:: 4. Launch Browser
echo [4/4] Opening browser to http://localhost:3000...
timeout /t 3 /nobreak > nul
start http://localhost:3000

echo.
echo ====================================================================
echo   ALL SERVICES RUNNING. YOU CAN CLOSE THIS LAUNCHER WINDOW.
echo ====================================================================
echo.
pause

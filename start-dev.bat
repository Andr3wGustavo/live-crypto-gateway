@echo off
title Live Crypto Local Launcher
echo ====================================================================
echo   ⚡ STARTING LIVE CRYPTO PLATFORM DEVELOPMENT ENVIRONMENT ⚡
echo ====================================================================
echo.

:: 1. Start Docker Containers
echo [1/4] Attempting to start PostgreSQL & Redis containers...
docker compose up -d
if %ERRORLEVEL% neq 0 (
    echo.
    echo [WARNING] Docker Compose failed to execute or Docker is not running.
    echo Please ensure PostgreSQL is active on port 5432 and Redis on port 6379 manually.
    echo.
) else (
    echo [OK] PostgreSQL and Redis containers started successfully.
)
echo --------------------------------------------------------------------

:: 2. Launch Backend in separate window
echo [2/4] Initializing Backend Node.js Server...
start "Live Crypto Backend API" cmd /c "cd backend && echo Installing backend packages... && npm install && echo. && echo Starting backend dev server on port 8080... && npm run dev"
echo [OK] Backend initialization window spawned.
echo --------------------------------------------------------------------

:: 3. Launch Frontend in separate window
echo [3/4] Initializing Frontend Next.js Web App...
start "Live Crypto Frontend Web App" cmd /c "cd frontend && echo Installing frontend packages... && npm install && echo. && echo Starting frontend dev server on port 3000... && npm run dev"
echo [OK] Frontend initialization window spawned.
echo --------------------------------------------------------------------

:: 4. Delay and launch browser
echo [4/4] Waiting 5 seconds for local servers to boot...
timeout /t 5 /nobreak > nul

echo [OK] Launching browser to http://localhost:3000...
start http://localhost:3000

echo.
echo ====================================================================
echo   ⚡ ALL PROCESSES BOOTED. PLEASE WATCH SPAWNED WINDOWS FOR LOGS! ⚡
echo ====================================================================
echo.
pause

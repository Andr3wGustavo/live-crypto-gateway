@echo off
title Live Crypto Local Launcher
echo ====================================================================
echo   Live Crypto Development Environment Launcher
echo ====================================================================
echo.

:: 1. Start Docker Containers
echo [1/4] Attempting to start PostgreSQL and Redis containers...
docker compose up -d >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [INFO] Docker not detected or running locally.
    echo Make sure PostgreSQL (5432) and Redis (6379) are active.
) else (
    echo [OK] PostgreSQL and Redis containers verified.
)
echo --------------------------------------------------------------------

:: 2. Launch Backend in separate window (fast startup)
echo [2/4] Initializing Backend Node.js Server...
start "Live Crypto Backend API (:8080)" cmd /c "cd backend && if not exist node_modules (echo Installing backend packages... && npm install) && echo Starting backend on port 8080... && npm run dev"
echo [OK] Backend initialization window spawned.
echo --------------------------------------------------------------------

:: 3. Launch Frontend in separate window (fast startup)
echo [3/4] Initializing Frontend Next.js Web App...
start "Live Crypto Frontend Web App (:3000)" cmd /c "cd frontend && if not exist node_modules (echo Installing frontend packages... && npm install) && echo Starting frontend on port 3000... && npm run dev"
echo [OK] Frontend initialization window spawned.
echo --------------------------------------------------------------------

:: 4. Launch browser
echo [4/4] Launching browser to http://localhost:3000...
timeout /t 3 /nobreak > nul
start http://localhost:3000

echo.
echo ====================================================================
echo   PROCESSES RUNNING. YOU CAN CLOSE THIS WINDOW AT ANY TIME.
echo ====================================================================
echo.
pause


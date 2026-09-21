@echo off
title Live Crypto Gateway
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 22 or 24 LTS, then reopen this launcher.
  pause
  exit /b 1
)
if "%~1"=="--full" (
  node dev-runner.js
) else (
  node dev-runner.js --demo
)
pause

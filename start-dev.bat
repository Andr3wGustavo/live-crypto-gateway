@echo off
title Live Crypto Gateway
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 22 or 24 LTS, then reopen this launcher.
  pause
  exit /b 1
)
if "%~1"=="--help" (
  echo.
  echo Usage:
  echo   start-dev.bat          Safe preview with temporary data and payments disabled.
  echo   start-dev.bat --full   Starts Docker PostgreSQL/Redis and the application.
  echo.
  pause
  exit /b 0
)

if not "%~1"=="" if not "%~1"=="--full" (
  echo Unknown option: %~1
  echo Run start-dev.bat --help for supported options.
  pause
  exit /b 1
)

if "%~1"=="--full" (
  node dev-runner.js
) else (
  node dev-runner.js --demo
)
pause

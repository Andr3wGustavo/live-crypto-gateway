@echo off
setlocal
title Live Crypto Gateway
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 22 or 24 LTS, then reopen this launcher.
  pause
  exit /b 1
)
node dev-runner.js %*
set "EXIT_CODE=%ERRORLEVEL%"
for %%A in (%*) do if "%%~A"=="--check" exit /b %EXIT_CODE%
for %%A in (%*) do if "%%~A"=="--help" exit /b %EXIT_CODE%
pause
exit /b %EXIT_CODE%

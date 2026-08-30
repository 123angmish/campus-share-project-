@echo off
setlocal
title CampusShare Frontend
cd /d "%~dp0campusshare-frontend"

echo ====================================================
echo CampusShare Frontend - http://localhost:5173
echo ====================================================

where node >nul 2>nul || (
  echo [ERROR] Node.js 22 LTS is required and was not found in PATH.
  pause
  exit /b 1
)
where npm >nul 2>nul || (
  echo [ERROR] npm was not found in PATH.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing frontend dependencies...
  call npm ci
  if errorlevel 1 goto :fail
)

call npm run dev
goto :eof

:fail
echo [ERROR] Frontend dependency installation failed.
pause
exit /b 1

@echo off
setlocal
title CampusShare Launcher

echo ====================================================
echo Starting CampusShare

echo Backend:  http://localhost:8080
echo Frontend: http://localhost:5173
echo ====================================================

start "CampusShare Backend" cmd /k call "%~dp0run-backend.bat"
start "CampusShare Frontend" cmd /k call "%~dp0run-frontend.bat"

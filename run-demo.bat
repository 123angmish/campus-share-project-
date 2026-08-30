@echo off
setlocal
title CampusShare Placement Demo

echo ====================================================
echo CampusShare - Placement Demo Mode
echo ====================================================
echo Local-only demo seed. Disabled automatically in prod.
echo.
echo Admin:    admin@campusshare.demo    / Campus@123
echo Owner:    owner@campusshare.demo    / Campus@123
echo Borrower: borrower@campusshare.demo / Campus@123
echo.
echo Backend:  http://localhost:8080
echo Frontend: http://localhost:5173
echo Swagger:  http://localhost:8080/swagger-ui.html
echo ====================================================

start "CampusShare Backend - Demo" cmd /k call "%~dp0run-backend-demo.bat"
start "CampusShare Frontend" cmd /k call "%~dp0run-frontend.bat"

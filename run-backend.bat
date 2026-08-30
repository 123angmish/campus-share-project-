@echo off
setlocal
title CampusShare Backend
cd /d "%~dp0campusshare-backend"

echo ====================================================
echo CampusShare Backend - http://localhost:8080
echo ====================================================

where java >nul 2>nul || (
  echo [ERROR] Java 21 is required and was not found in PATH.
  echo Install JDK 21, reopen this terminal, and run again.
  pause
  exit /b 1
)

where mvn >nul 2>nul || (
  echo [ERROR] Apache Maven 3.9+ is required and was not found in PATH.
  echo Install Maven, reopen this terminal, and run again.
  pause
  exit /b 1
)

java -version
mvn -version
mvn spring-boot:run
pause

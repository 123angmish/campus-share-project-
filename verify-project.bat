@echo off
setlocal
title CampusShare - Full Verification
cd /d "%~dp0"

echo ====================================================
echo CampusShare - Backend tests + Frontend lint/build
echo ====================================================

where java >nul 2>nul || (echo [ERROR] Java 21 is required. & exit /b 1)
where mvn >nul 2>nul || (echo [ERROR] Maven 3.9+ is required. & exit /b 1)
where node >nul 2>nul || (echo [ERROR] Node.js 22 LTS is required. & exit /b 1)
where npm >nul 2>nul || (echo [ERROR] npm is required. & exit /b 1)

echo.
echo [1/4] Backend tests...
pushd campusshare-backend
call mvn -B --no-transfer-progress clean verify || (popd & exit /b 1)
popd

echo.
echo [2/4] Clean frontend dependencies...
pushd campusshare-frontend
call npm ci || (popd & exit /b 1)

echo.
echo [3/4] Frontend lint...
call npm run lint || (popd & exit /b 1)

echo.
echo [4/4] Frontend production build...
call npm run build || (popd & exit /b 1)
popd

echo.
echo ====================================================
echo ALL CHECKS PASSED

echo ====================================================
exit /b 0

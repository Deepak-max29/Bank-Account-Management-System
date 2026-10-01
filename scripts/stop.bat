@echo off
REM ============================================================
REM Bank Account Management System - Stop Script
REM ============================================================
echo.
echo ========================================
echo  Stopping Bank Account Management System
echo ========================================
echo.

REM Find and kill the Spring Boot process on port 8080
echo [INFO] Looking for application running on port 8080...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080" ^| findstr "LISTENING"') do (
    echo [INFO] Found process PID: %%a
    taskkill /PID %%a /F
    echo [OK] Application stopped.
    goto :done
)

echo [INFO] No application found running on port 8080.

:done
echo.
echo Done.
pause

@echo off
REM ============================================================
REM Bank Account Management System - Start Script
REM ============================================================
echo.
echo ========================================
echo  Bank Account Management System
echo  Starting Application...
echo ========================================
echo.

REM Check if JAVA_HOME is set
if "%JAVA_HOME%"=="" (
    echo [WARNING] JAVA_HOME is not set.
    echo Please set JAVA_HOME to your JDK 17+ installation.
    echo Example: set JAVA_HOME=C:\Program Files\Java\jdk-21
    echo.
    
    REM Try to find java on PATH
    where java >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Java is not found on PATH either.
        echo Please install JDK 17 or later and add it to PATH.
        echo Download from: https://adoptium.net/temurin/releases/
        pause
        exit /b 1
    )
)

REM Check Java version
echo [INFO] Checking Java version...
java -version 2>&1
echo.

REM Check if Oracle XE is running
echo [INFO] Checking Oracle XE service...
sc query OracleServiceXE | find "RUNNING" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Oracle XE service may not be running.
    echo Starting Oracle XE service...
    net start OracleServiceXE 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo [WARNING] Could not start Oracle XE automatically.
        echo Please start it manually via Services or run:
        echo   net start OracleServiceXE
        echo.
    ) else (
        echo [OK] Oracle XE service started.
        timeout /t 5 /nobreak >nul
    )
) else (
    echo [OK] Oracle XE service is running.
)

REM Check Oracle TNS Listener
sc query OracleXETNSListener | find "RUNNING" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Starting Oracle TNS Listener...
    net start OracleXETNSListener 2>nul
    timeout /t 3 /nobreak >nul
) else (
    echo [OK] Oracle TNS Listener is running.
)

echo.
echo [INFO] Starting Spring Boot application...
echo [INFO] The application will be available at: http://localhost:8081
echo [INFO] Default login: admin / admin123
echo.
echo Press Ctrl+C to stop the application.
echo.

cd /d "%~dp0..\backend"

REM Try Maven wrapper first, then system Maven
if exist mvnw.cmd (
    call mvnw.cmd spring-boot:run -DskipTests
) else (
    where mvn >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        call mvn spring-boot:run -DskipTests
    ) else (
        echo [ERROR] Maven is not found.
        echo Please install Apache Maven 3.9+ and add it to PATH.
        echo Download from: https://maven.apache.org/download.cgi
        echo.
        echo Or if you have a built JAR, run:
        echo   java -jar target\bank-account-management-1.0.0.jar
        pause
        exit /b 1
    )
)

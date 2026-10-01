@echo off
REM ============================================================
REM Bank Account Management System - Environment Check
REM ============================================================
echo.
echo ============================================
echo  Environment Check
echo ============================================
echo.

set PASS=0
set FAIL=0

REM Check Java
echo [CHECK] Java Development Kit...
where java >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   [PASS] Java found:
    java -version 2>&1 | findstr "version"
    set /a PASS+=1
) else (
    echo   [FAIL] Java not found on PATH.
    echo          Install JDK 17+ from https://adoptium.net/temurin/releases/
    echo          Set JAVA_HOME and add %%JAVA_HOME%%\bin to PATH.
    set /a FAIL+=1
)
echo.

REM Check Maven
echo [CHECK] Apache Maven...
where mvn >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   [PASS] Maven found:
    mvn -version 2>&1 | findstr "Apache Maven"
    set /a PASS+=1
) else (
    echo   [FAIL] Maven not found on PATH.
    echo          Install Maven 3.9+ from https://maven.apache.org/download.cgi
    echo          Set M2_HOME and add %%M2_HOME%%\bin to PATH.
    set /a FAIL+=1
)
echo.

REM Check Oracle XE Service
echo [CHECK] Oracle XE Database Service...
sc query OracleServiceXE >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    sc query OracleServiceXE | find "RUNNING" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo   [PASS] OracleServiceXE is RUNNING.
        set /a PASS+=1
    ) else (
        echo   [WARN] OracleServiceXE is installed but NOT running.
        echo          Start it with: net start OracleServiceXE
        set /a FAIL+=1
    )
) else (
    echo   [FAIL] OracleServiceXE service not found.
    echo          Install Oracle XE from https://www.oracle.com/database/technologies/appdev/xe.html
    set /a FAIL+=1
)
echo.

REM Check Oracle TNS Listener
echo [CHECK] Oracle TNS Listener...
sc query OracleXETNSListener >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    sc query OracleXETNSListener | find "RUNNING" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo   [PASS] OracleXETNSListener is RUNNING.
        set /a PASS+=1
    ) else (
        echo   [WARN] OracleXETNSListener is installed but NOT running.
        echo          Start it with: net start OracleXETNSListener
        set /a FAIL+=1
    )
) else (
    echo   [FAIL] OracleXETNSListener service not found.
    set /a FAIL+=1
)
echo.

REM Check Oracle JDBC Driver
echo [CHECK] Oracle JDBC Driver...
if exist "C:\oraclexe\app\oracle\product\10.2.0\server\jdbc\lib\ojdbc14.jar" (
    echo   [PASS] ojdbc14.jar found at expected location.
    set /a PASS+=1
) else (
    echo   [FAIL] ojdbc14.jar not found at C:\oraclexe\...\jdbc\lib\
    set /a FAIL+=1
)
echo.

REM Check port 8080
echo [CHECK] Port 8080 availability...
netstat -aon | findstr ":8080" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   [WARN] Port 8080 is already in use.
    echo          Stop the existing process or change server.port in application.properties.
    set /a FAIL+=1
) else (
    echo   [PASS] Port 8080 is available.
    set /a PASS+=1
)
echo.

REM Check port 1521 (Oracle)
echo [CHECK] Oracle port 1521...
netstat -aon | findstr ":1521" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   [PASS] Port 1521 is listening (Oracle).
    set /a PASS+=1
) else (
    echo   [WARN] Port 1521 is not listening. Oracle may not be running.
    set /a FAIL+=1
)
echo.

REM Summary
echo ============================================
echo  Results: %PASS% passed, %FAIL% failed/warnings
echo ============================================
echo.

if %FAIL% GTR 0 (
    echo Some checks failed. Please resolve the issues above before starting the application.
) else (
    echo All checks passed! You can start the application with start.bat
)
echo.
pause

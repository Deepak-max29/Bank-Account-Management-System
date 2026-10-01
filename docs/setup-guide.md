# Bank Account Management System (BAMS) — Setup & Production Guide

This guide provides complete instructions for setting up, building, verifying, running, and troubleshooting the Bank Account Management System on Windows.

---

## 1. System Requirements & Prerequisites

| Component | Minimum Version | Tested & Verified Environment |
|---|---|---|
| **Operating System** | Windows 10 / 11 (64-bit) | Windows 11 |
| **Java JDK** | JDK 17 (LTS) | Eclipse Adoptium Temurin JDK 17.0.20.101 (`C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot`) |
| **Build Tool** | Apache Maven 3.9+ | Apache Maven 3.9.9 (`C:\Users\kanch\apache-maven-3.9.9\bin\mvn.cmd`) |
| **Database** | Oracle Database XE 10g/11g/18c/21c | Oracle Database 10g Express Edition (Port 1521, SID: `XE`) |
| **Web Browser** | Modern Browser (Chrome, Edge, Firefox) | Offline, JavaScript-enabled |

---

## 2. Oracle Database XE Setup & Verification

### 2.1 Check Windows Services
Ensure both Oracle Windows services are running:
```powershell
Get-Service -Name "OracleServiceXE", "OracleXETNSListener"
```
If not running, start them:
```powershell
Start-Service -Name "OracleServiceXE"
Start-Service -Name "OracleXETNSListener"
```

### 2.2 Test Oracle Connection via SQL*Plus
```cmd
"C:\oraclexe\app\oracle\product\10.2.0\server\BIN\sqlplus.exe" SYSTEM/tiger@localhost:1521:XE
```

### 2.3 Database Schema Initialization (First-Time Setup Only)
If setting up a fresh database, execute the SQL scripts in order:
```cmd
sqlplus SYSTEM/tiger@localhost:1521/XE @database/schema.sql
sqlplus SYSTEM/tiger@localhost:1521/XE @database/indexes.sql
sqlplus SYSTEM/tiger@localhost:1521/XE @database/constraints.sql
sqlplus SYSTEM/tiger@localhost:1521/XE @database/sample_data.sql
```
*Note: Do not re-run on an existing populated database as table structures and records are preserved.*

---

## 3. Configuration

Database connection settings are configured in `backend/src/main/resources/application.properties`:
```properties
server.port=8081

# Oracle Database XE Connection
spring.datasource.url=jdbc:oracle:thin:@localhost:1521:XE
spring.datasource.username=SYSTEM
spring.datasource.password=tiger
spring.datasource.driver-class-name=oracle.jdbc.OracleDriver

# HikariCP Connection Pool
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=2
spring.datasource.hikari.idle-timeout=30000
spring.datasource.hikari.connection-timeout=20000

# Spring Security & Session Management
server.servlet.session.timeout=30m
spring.security.user.name=admin
```

---

## 4. Building & Running the Application

### 4.1 Development Mode (Maven Spring Boot Plugin)
To run in development mode with live static resource copying:
```cmd
cd backend
mvn spring-boot:run
```
Or using explicit Maven path:
```cmd
& "C:\Users\kanch\apache-maven-3.9.9\bin\mvn.cmd" spring-boot:run
```

### 4.2 Building the Production Executable JAR
To run full tests and package the standalone executable JAR:
```cmd
cd backend
mvn clean package
```
**Generated Artifact Location**:
`backend/target/bank-account-management-1.0.0.jar`

### 4.3 Running the Production JAR
```cmd
cd backend
java -jar target/bank-account-management-1.0.0.jar
```
Or using the full JDK 17 path:
```cmd
& "C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot\bin\java.exe" -jar "backend\target\bank-account-management-1.0.0.jar"
```

The application starts on port `8081` in approximately 8–10 seconds.

---

## 5. Accessing the Application & User Roles

Navigate to:
```
http://localhost:8081
```
(Unauthenticated requests are automatically redirected to `http://localhost:8081/login`).

### Pre-Configured Test Credentials

| Role | Username | Password | Access Capabilities |
|---|---|---|---|
| **ADMIN** | `admin` | `admin123` | Full access to all 11 modules: Banks, Branches, Employees, Customers, Accounts, Transactions, Beneficiaries, Loans, Loan Payments, Cards, Audit Logs, Reports, CSV Import/Export, and Settings. |
| **MANAGER** | `manager1` | `manager123` | Operational access to Customers, Accounts, Transactions, Beneficiaries, Loans, Loan Payments, Cards, Reports, Audit Logs, and Settings. |
| **STAFF** | `staff1` | `staff123` | Day-to-day access to Accounts, Transactions, Beneficiaries, Loan Applications, Customer CSV import, and Settings. |

---

## 6. Running Tests & Test Automation

### 6.1 Maven Test Suite
```cmd
cd backend
mvn test
```
Runs unit tests, security configurations, and validation tests. Output: `BUILD SUCCESS`.

### 6.2 Full End-to-End Regression Test Suite
Run the Python test script while the application is active:
```powershell
$env:PYTHONIOENCODING='utf-8'; python "test_regression.py"
```
Verifies all 18 endpoints across 11 modules with live Oracle XE data.

---

## 7. 100% Offline Runtime Verification

This system was designed to operate strictly offline without internet connectivity:
1. **Zero External CDN Dependencies**: All CSS stylesheets (`main.css`, `layout.css`, `components.css`, `pages.css`) and JavaScript modules are stored locally in `frontend/` and bundled inside `BOOT-INF/classes/static/`.
2. **Local Fonts & Icons**: The user interface relies purely on system fonts (`system-ui`, `Segoe UI`, Arial) and native Unicode icons, with zero Google Fonts or FontAwesome web requests.
3. **Local Database Engine**: Oracle XE runs entirely on `localhost:1521:XE`.
4. **Local JDBC Driver**: `ojdbc11` is packaged inside the fat executable JAR.

---

## 8. Troubleshooting & Common Issues

| Issue / Symptom | Possible Cause | Solution |
|---|---|---|
| **`ORA-12541: TNS:no listener`** | Oracle TNS Listener service is stopped. | Run `Start-Service OracleXETNSListener` in PowerShell. |
| **`ORA-01034: ORACLE not available`** | Oracle XE service is not started. | Run `Start-Service OracleServiceXE` in PowerShell. |
| **`Port 8081 already in use`** | A previous instance of the server is running. | Find the PID via `netstat -ano \| findstr 8081` and terminate using `taskkill /PID <PID> /F`. |
| **Login fails or redirects with `error=true`** | Incorrect credentials entered. | Verify credentials (`admin`/`admin123`). Passwords are case-sensitive. |
| **Static files not updating in dev mode** | Browser cache or static directory out of sync. | Run `Copy-Item -Path "frontend\*" -Destination "backend\src\main\resources\static\" -Recurse -Force` or do a browser hard refresh (`Ctrl+F5`). |
| **`UnsupportedClassVersionError` (class file version 61.0)** | Running with Java version older than Java 17. | Ensure `java -version` returns Java 17 or higher (`JAVA_HOME` pointing to JDK 17+). |

---

## 9. CSV Export & Import Format Specifications

### 9.1 Banks Entity (`/api/csv/export/banks` and `/api/csv/import/banks`)

- **Exact CSV Header**:
  ```csv
  BankName,HeadOffice,ContactNo,Email
  ```
- **Field Constraints & Types**:
  - `BankName` (**Required**, `VARCHAR2(100)`): Must be unique across all banks. Duplicates are rejected with row-level error.
  - `HeadOffice` (Optional, `VARCHAR2(200)`): Physical address of the bank headquarters.
  - `ContactNo` (Optional, `VARCHAR2(15)`): Must be a valid phone number (7–15 digits with optional `+`, `-`, space) matching check constraint `chk_bank_phone`.
  - `Email` (Optional, `VARCHAR2(100)`): Must be a valid email format matching check constraint `chk_bank_email`.
- **Example CSV Content**:
  ```csv
  BankName,HeadOffice,ContactNo,Email
  Zenith Global Bank,"Bandra Kurla Complex, Mumbai - 400051",9876543210,contact@zenithbank.in
  Apex Federal Bank,"Connaught Place, New Delhi - 110001",01123456789,info@apexfederal.in
  ```
- **Primary Key & Identity Handling**:
  - `Bank_ID` is auto-generated in Oracle XE via sequence trigger `TRG_BANK_ID` (`SEQ_BANK_ID.NEXTVAL`).
  - The export excludes `Bank_ID` so the exported file structure directly matches the import template format.
  - Re-importing existing banks without modifying names will report duplicate errors rather than corrupting existing IDs or foreign key relationships.

### 9.2 Other Supported CSV Entities

| Entity | Canonical CSV Header | Key Constraints |
|---|---|---|
| **Branches** | `BranchName,IFSCCode,City,State,Pincode,Address,ContactNumber,Email,BankName` | `IFSCCode` (11 chars, e.g. `NPBK0000001`), `Pincode` (6 digits), `BankName` must exist |
| **Customers** | `FirstName,LastName,Email,Phone,Dob,KycStatus,Gender,Address` | `Email` unique, `Dob` (`YYYY-MM-DD`), `KycStatus` (`VERIFIED`/`PENDING`/`REJECTED`) |
| **Employees** | `FirstName,LastName,Designation,Salary,Email,Phone,JoinDate,BranchName` | `Email` unique, `Salary` numeric, `Designation` (`MANAGER`/`TELLER`/`CLERK`/etc.) |


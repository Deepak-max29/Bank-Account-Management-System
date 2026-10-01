# Bank Account Management System (BAMS)

![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Java](https://img.shields.io/badge/Java-17%2B-blue)
![Spring%20Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-green)
![Database](https://img.shields.io/badge/Database-Oracle%20XE%2010g-red)
![Frontend](https://img.shields.io/badge/Frontend-Vanilla%20JS%20SPA-orange)
![Security](https://img.shields.io/badge/Security-Spring%20Security%206-purple)
![Runtime](https://img.shields.io/badge/Runtime-100%25%20Offline%20Capable-teal)

A comprehensive, enterprise-grade, offline-capable **Bank Account Management System** engineered for a College DBMS Project. Built with **Spring Boot 3**, **Spring Security 6**, **Spring JDBC (JdbcTemplate)**, an **Oracle Database XE** relational back-end normalized to Third Normal Form (3NF), and a modern, high-performance **Vanilla JavaScript Single-Page Application (SPA)** with a colourful premium theme.

---

## Table of Contents
1. [Overview & Highlights](#-overview--highlights)
2. [Key Features & Modules](#-key-features--modules)
3. [Technology Stack](#-technology-stack)
4. [Architecture Overview](#-architecture-overview)
5. [Prerequisites](#-prerequisites)
6. [Database Setup (Oracle XE)](#-database-setup-oracle-xe)
7. [Database Connection Configuration](#-database-connection-configuration)
8. [Running the Application](#-running-the-application)
9. [Running Tests & Building the JAR](#-running-tests--building-the-jar)
10. [Accessing the Application](#-accessing-the-application)
11. [CSV Import / Export](#-csv-import--export)
12. [Security Notes & Best Practices](#-security-notes--best-practices)
13. [Project Structure](#-project-structure)

---

## 🌟 Overview & Highlights

- **100% Offline Runtime**: Zero reliance on external CDNs, Google Fonts, font kits, or third-party web APIs. All 26 static assets (CSS, JS, SVG/Unicode icons) are bundled directly inside the executable Spring Boot artifact.
- **Strict Financial Integrity**: Transactions use atomic JDBC transactions (`@Transactional`), row-level pessimistic locking (`SELECT ... FOR UPDATE`), server-side balance validation, and idempotency protection. Balances are never calculated or stored on the client side.
- **Normalized 3NF Relational Model**: Exactly 11 core tables plus `APP_USER`, complete with foreign key cascades, check constraints, B-Tree performance indexes, and database sequence triggers.
- **Premium Colourful UI & Currency Corner**: Responsive, glassmorphic UI styled in midnight navy, royal blue, rich purple gradients, teal accents, and warm gold highlights. Includes an interactive "Currency Corner & Money Matters" awareness panel on the login page.
- **Comprehensive Role-Based Access Control**: Granular endpoint authorization supporting `ADMIN`, `MANAGER`, and `STAFF` roles with Spring Security form-based login, CSRF tokens, and session management.

---

## 💼 Key Features & Modules

1. **Executive Dashboard**: Real-time business metrics (Total Customers, Active Accounts, Branch Network, Total Transactions), financial liquidity summary (Deposits Inflow, Withdrawals Outflow, Disbursed Loans), quick operational shortcuts, and recent ledger activities.
2. **Banks & Branches**: Multi-bank institution support with branch network management, IFSC code validation (`^[A-Z]{4}0[A-Z0-9]{6}$`), city/state/pincode tracking, and contact details.
3. **Customers (KYC)**: Customer profile onboarding, contact directory, date of birth validation, and KYC workflow management (`PENDING`, `VERIFIED`, `REJECTED`).
4. **Accounts**: Retail account lifecycle management (Savings and Current ledgers), initial deposit logging, balance inquiries, and operational status controls (`ACTIVE`, `FROZEN`, `CLOSED`).
5. **Financial Transactions**: Atomic deposits, withdrawals, and internal inter-account transfers with pessimistic row locking (`FOR UPDATE`), duplicate-transfer prevention via idempotency keys, and real-time transaction ledger.
6. **Beneficiaries**: Payee management with masked account numbers, transfer limits, IFSC formatting, and verification states (`VERIFIED`, `DEACTIVATED`).
7. **Loans & Repayments**: Credit facilities management, loan approvals/rejections, monthly EMI amortization schedules (`/api/loans/{id}/schedule`), repayment history, and over-payment rejection safeguards.
8. **Debit & Credit Cards**: Card issuance linked to active accounts, 16-digit card generation, masked display (`XXXX-XXXX-XXXX-1234`), BCrypt-hashed CVV protection (`@JsonIgnore` on REST responses), card status management (Activate, Block, Deactivate), and expiry tracking.
9. **Audit Trail**: Read-only, append-only security logs capturing user actions, IP addresses, entity IDs, and operation details with Oracle `ROWNUM` pagination.
10. **Analytical Reports**: 5 core tabular reports (Account Balances, Transaction Summary, Branch Activity, Loan Repayments, Customer Accounts) with date range filters, summary statistics cards, and CSV export.
11. **Settings & Profile**: Authenticated user profile view, role badge inspection, BCrypt password change workflow (verifying old password and preventing reuse), and CSRF-protected session logout.

---

## 🛠 Technology Stack

- **Backend**: Java 17, Spring Boot 3.2.5
- **Data Access**: Spring JDBC (`JdbcTemplate`), HikariCP Connection Pool
- **Database**: Oracle Database 10g Express Edition (XE) / Oracle Database 11g/19c/21c XE
- **Security**: Spring Security 6.2, BCrypt (strength 12), CSRF protection, HttpOnly session cookies
- **Build & Packaging**: Apache Maven 3.9+, Spring Boot Maven Plugin (Fat JAR packaging)
- **Frontend**: Vanilla JavaScript (ES6+ Modules), Semantic HTML5, CSS3 Custom Properties (variables, flexbox, grid, glassmorphic backdrops)
- **Testing**: JUnit 5, Spring Boot Test, Python 3 E2E test verification scripts

---

## 📐 Architecture Overview

```
                               ┌───────────────────────────────────────────────┐
                               │                 Browser (SPA)                 │
                               │  HTML5 / CSS3 / Vanilla JS (100% Offline)    │
                               └──────────────────────┬────────────────────────┘
                                                      │ HTTP / REST / JSON / Cookies
                                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 Spring Boot Application Server (Port 8081)                              │
│                                                                                                         │
│  ┌─────────────────────────┐   ┌─────────────────────────┐   ┌───────────────────────────────────────┐  │
│  │     Spring Security     │──▶│     REST Controllers    │──▶│           Service Layer               │  │
│  │ (CSRF, Auth, RBAC)      │   │     (15 Controllers)    │   │ (Atomic Business Logic, Validations)  │  │
│  └─────────────────────────┘   └─────────────────────────┘   └───────────────────┬───────────────────┘  │
│                                                                                  │                      │
│                                                                ┌─────────────────▼───────────────────┐  │
│                                                                │       Repository / Data Access      │  │
│                                                                │  JdbcTemplate, RowMappers, Locks   │  │
│                                                                └─────────────────┬───────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┼──────────────────────┘
                                                                                   │ JDBC (Port 1521)
                                                                                   ▼
                                                                ┌──────────────────────────────────────┐
                                                                │       Oracle Database 10g XE         │
                                                                │ 11 Tables + Sequences + Triggers    │
                                                                └──────────────────────────────────────┘
```

---

## 📋 Prerequisites

Before running the application, make sure the following software is installed on your Windows, Linux, or macOS machine:

1. **Java Development Kit (JDK)**: JDK 17 or higher (e.g., Eclipse Adoptium Temurin 17).
   ```cmd
   java -version
   ```
2. **Apache Maven**: Version 3.8 or 3.9+.
   ```cmd
   mvn -version
   ```
3. **Oracle Database XE**: Oracle Database 10g Express Edition (or 11g/18c/19c/21c XE) running locally on port `1521` with SID `XE`.
   - Windows Services: `OracleServiceXE` and `OracleXETNSListener` must be running.
4. **Oracle SQL*Plus** or **Oracle SQL Developer**: Used to execute the initial database scripts.

---

## 🗄 Database Setup (Oracle XE)

1. **Verify Oracle XE Services**:
   ```cmd
   net start OracleServiceXE
   net start OracleXETNSListener
   ```

2. **Run SQL Scripts in Sequence**:
   Open a terminal and connect as the DBA user (e.g., `SYSTEM`):
   ```cmd
   sqlplus SYSTEM/manager@localhost:1521/XE @database\schema.sql
   sqlplus SYSTEM/manager@localhost:1521/XE @database\indexes.sql
   sqlplus SYSTEM/manager@localhost:1521/XE @database\constraints.sql
   sqlplus SYSTEM/manager@localhost:1521/XE @database\sample_data.sql
   ```

   *Scripts overview:*
   - `database/schema.sql`: Creates 11 normalized tables (`BANK`, `BRANCH`, `EMPLOYEE`, `CUSTOMER`, `ACCOUNT`, `TRANSACTION`, `BENEFICIARY`, `LOAN`, `LOAN_PAYMENT`, `CARD`, `AUDIT_LOG`) and `APP_USER`, along with sequences and primary key triggers.
   - `database/indexes.sql`: Creates performance B-Tree indexes on foreign keys and search columns.
   - `database/constraints.sql`: Applies referential integrity, foreign key relations, and check constraints.
   - `database/sample_data.sql`: Seeds fictional demonstration records using idempotent `MERGE` / `WHERE NOT EXISTS` statements.

---

## ⚙ Database Connection Configuration

Configuration is managed in `backend/src/main/resources/application.properties`.

### Default Configuration:
```properties
spring.datasource.url=jdbc:oracle:thin:@localhost:1521:XE
spring.datasource.username=SYSTEM
spring.datasource.password=manager
spring.datasource.driver-class-name=oracle.jdbc.OracleDriver
server.port=8081
```

### Overriding Credentials Safely Without Modifying Code:
To avoid hardcoding or committing production database passwords, you can override them via environment variables or command-line parameters:

1. **Environment Variables**:
   ```cmd
   set SPRING_DATASOURCE_USERNAME=my_bank_user
   set SPRING_DATASOURCE_PASSWORD=my_secure_password
   java -jar backend/target/bank-account-management-1.0.0.jar
   ```

2. **Command-Line Arguments**:
   ```cmd
   java -jar backend/target/bank-account-management-1.0.0.jar --spring.datasource.username=my_user --spring.datasource.password=my_password
   ```

3. **External Properties File** (ignored by Git):
   Create `application-local.properties` in your directory and launch with:
   ```cmd
   java -jar backend/target/bank-account-management-1.0.0.jar --spring.config.additional-location=file:./application-local.properties
   ```

---

## 🚀 Running the Application

### Option A: Using the Standalone Packaged JAR (Recommended)
```cmd
java -jar backend/target/bank-account-management-1.0.0.jar
```

### Option B: Using Maven
```cmd
cd backend
mvn spring-boot:run
```

### Option C: Using Windows Automation Batch Script
```cmd
scripts\start.bat
```

Once started, the application will initialize in ~8–12 seconds and listen on port **8081**.

---

## 🧪 Running Tests & Building the JAR

### 1. Compile and Run Unit / Integration Tests:
```cmd
cd backend
mvn test
```
*Executes all Spring Boot test suites. Requires Oracle XE services running for integration tests.*

### 2. Package the Production Fat JAR:
```cmd
cd backend
mvn clean package
```
*Compiles the backend Java classes, synchronizes the frontend static assets from `frontend/` into `backend/target/classes/static/`, and produces `backend/target/bank-account-management-1.0.0.jar`.*

### 3. Run Automated End-to-End Verification Suite:
```cmd
python scratch/test_e2e_verification.py
```
*Verifies login CSRF token injection, offline static delivery, live dashboard metrics, entity data visibility, canonical CSV export/import, and financial transaction execution.*

---

## 🌐 Accessing the Application

1. Open your web browser and navigate to:
   ```
   http://localhost:8081
   ```
2. You will be redirected to the secure portal login page: `http://localhost:8081/login`.
3. **Safe Demonstration Credentials**:

| Role | Username | Demonstration Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Full access to all modules, employee salaries, and audit logs. |
| **Branch Manager**| `manager1` | `manager123` | Operational access to loans, accounts, customers, cards, and reports. |
| **Bank Staff** | `staff1` | `staff123` | Customer onboarding, account opening, and transaction processing. |

> **Security Notice**: Demonstration accounts are seeded via `sample_data.sql` for evaluation. In any production or shared environment, change these passwords immediately using the built-in Settings module (`/api/auth/change-password`).

---

## 📊 CSV Import / Export

BAMS supports validated batch data operations via REST endpoints (`/api/csv/*`) and frontend modals:

### Supported CSV Formats & Canonical Headers:
1. **Banks**: `BankName,HeadOffice,ContactNo,Email`
2. **Branches**: `BranchName,BankName,IfscCode,City,State,Pincode,Address,ContactNumber,Email`
3. **Customers**: `FirstName,LastName,Email,Phone,Dob,Gender,Address,KycStatus`
4. **Employees**: `FirstName,LastName,Email,Phone,Designation,Salary,BranchName`
5. **Accounts** (Export only): `AccountNo,CustomerName,BranchName,AccountType,Balance,Status,OpenedDate`
6. **Transactions** (Export only): `TxnId,AccountNo,TxnType,Amount,BalanceAfter,Channel,TxnDate,Remarks`
7. **Loans** (Export only): `LoanId,CustomerName,BranchName,LoanType,PrincipalAmount,InterestRate,TenureMonths,OutstandingAmount,Status`

### Import Validation Rules:
- Header row must match canonical column names.
- Duplicate primary keys or unique constraint violations (e.g. existing email, IFSC, or bank name) are rejected with row-level error reporting.
- Date fields must adhere to ISO format `YYYY-MM-DD`.
- Indian phone numbers must be 10 numeric digits.

---

## 🔒 Security Notes & Best Practices

- **Zero Plaintext Secrets**: User passwords are encrypted using BCrypt with a cost factor of 12. Card CVVs are hashed upon entry and never returned in API payloads (`@JsonIgnore`).
- **CSRF & Session Protection**: All state-changing web mutations require valid CSRF tokens. Sessions enforce a 30-minute timeout and single-session concurrency per user.
- **Pessimistic Concurrency**: Financial transactions (withdrawals and transfers) execute `SELECT ... FOR UPDATE` row locks ordered by account ID to eliminate deadlocks and race conditions.
- **Local Runtime Guarantee**: The application is strictly designed to run offline on local networks or secure localhost. It does not phone home or transmit telemetry.

---

## 📁 Project Structure

```
Bank_Account_Management_System/
├── backend/                              # Spring Boot Java Application
│   ├── src/main/java/com/bank/
│   │   ├── config/                       # Spring Security & Web MVC configurations
│   │   ├── controller/                   # 15 REST API controllers
│   │   ├── dto/                          # Request, response, and report DTO records
│   │   ├── exception/                    # GlobalExceptionHandler and error models
│   │   ├── model/                        # 11 Core entity models + AppUser
│   │   ├── repository/                   # JdbcTemplate repositories with SQL mapping
│   │   ├── security/                     # CustomUserDetailsService & Auth provider
│   │   ├── service/                      # Business services & transactional logic
│   │   └── BankApplication.java          # Spring Boot main entry point
│   ├── src/main/resources/
│   │   ├── application.properties        # Application and datasource settings
│   │   └── static/                       # Synced production static web resources
│   └── pom.xml                           # Maven dependencies, plugins, and build specs
├── database/                             # Oracle XE SQL Scripts
│   ├── schema.sql                        # 11 Tables, sequences, and triggers
│   ├── indexes.sql                       # Performance B-Tree indexes
│   ├── constraints.sql                   # Foreign keys and check constraints
│   ├── sample_data.sql                   # Safe demonstration seed data
│   └── reports.sql                       # Analytical database queries
├── frontend/                             # Vanilla JS Single Page Application (Source)
│   ├── index.html                        # Main authenticated application shell
│   ├── login.html                        # Modern two-panel login & Currency Corner
│   ├── css/                              # Colourful design system stylesheets
│   │   ├── main.css                      # Design variables, palette, typography
│   │   ├── layout.css                    # Responsive sidebar, header, layout grid
│   │   ├── components.css                # Stat cards, tables, badges, modals, toasts
│   │   └── pages.css                     # Login page layout and Currency Corner cards
│   └── js/                               # Modular SPA client-side JavaScript
│       ├── api.js, auth.js, app.js       # API helpers, auth state, client router
│       ├── utils.js, components.js       # Formatting (₹ INR), badges, modals, tables
│       └── [modules].js                  # Dedicated controllers for all 14 screens
├── docs/                                 # Architectural & setup documentation
│   ├── api-documentation.md              # REST API reference specifications
│   ├── database-design.md                # 3NF Schema entity-relationship reference
│   └── setup-guide.md                    # Windows setup and troubleshooting guide
├── scripts/                              # Windows automation batch files
│   ├── check-environment.bat             # Prerequisite environment inspector
│   ├── start.bat                         # One-click startup script (port 8081)
│   └── stop.bat                          # Process termination script
├── .gitignore                            # Version control exclusion rules
├── AGENTS.md                             # Agent development guidelines and principles
├── PROJECT_HANDOFF.md                    # Comprehensive development milestone handoff
└── TASKS.md                              # Detailed task completion & test checklist
```

---

## 📄 License & Academic Attribution
Developed as an advanced academic DBMS project showcasing Third Normal Form relational architecture, Spring Boot transaction management, and secure offline web design.

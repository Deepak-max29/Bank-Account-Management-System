# BAMS Development Tasks & Acceptance Checklist

## Phase 1 & 2: Environment, Startup & Verification
- [x] Locate Java 17 and Maven installations.
- [x] Verify Oracle Database XE services (`OracleServiceXE`, `OracleXETNSListener`).
- [x] Check 11 core tables + `APP_USER` in Oracle XE.
- [x] Verify Maven build and compilation (`mvn test-compile`).
- [x] Start Spring Boot application on port 8081.
- [x] Verify Spring Security login flow with CSRF protection and session cookies.
- [x] Test authenticated REST endpoints (`/api/auth/me`, `/api/banks`, `/api/accounts`, `/api/customers`, `/api/transactions/recent`, etc.).

---

## Phase 3: Frontend Module Completion (Connecting Stubs to Backend)

### Task 1: Employees Module (`frontend/js/employees.js`)
- [x] Connect `loadEmployees()` to GET `/api/employees`.
- [x] Render Employee table (ID, Name, Branch, Designation, Salary, Phone, Email, Actions).
- [x] Add dynamic branch dropdown loaded directly from GET `/api/branches`.
- [x] Add client-side search & filtering by employee name, branch, and designation.
- [x] Add Create/Edit Employee modal and form posting to POST/PUT `/api/employees`.
- [x] Acceptance criteria verified: Real Oracle XE employee records retrieved; validation errors handled; test employee created and updated in Oracle DB; audit log automatically recorded in Oracle XE.

### Task 2: Beneficiaries Module (`frontend/js/beneficiaries.js`)
- [x] Connect `loadBeneficiaries()` to GET `/api/beneficiaries` and `/api/beneficiaries/customer/{id}`.
- [x] Render table with Beneficiary Name, masked Account Number, Bank Name, IFSC code, Transfer Limit, Status badges, and actions.
- [x] Add dynamic customer dropdown loaded from GET `/api/customers`.
- [x] Add client-side search & filtering by beneficiary name, bank, account, IFSC, customer, and status.
- [x] Add Add/Edit Beneficiary modal posting to POST/PUT `/api/beneficiaries`.
- [x] Add Verify and Deactivate actions connected to PATCH `/api/beneficiaries/{id}/verify` and `/deactivate`.
- [x] Acceptance criteria verified: Real Oracle XE beneficiaries retrieved; input validation verified (IFSC regex, positive limit, required fields); test beneficiary created, edited, verified, deactivated, and persisted in Oracle XE; audit logs recorded.

### Task 3: Loans & Loan Payments Modules (`frontend/js/loans.js`, `frontend/js/loanPayments.js`)
- [x] Connect `loadLoans()` to GET `/api/loans` — renders table with ID, Customer, Branch, Type, Principal, Rate, Tenure, Outstanding, Status, Actions.
- [x] Implement loan application modal (Customer, Branch, Sanctioning Officer, Loan Type, Principal, Interest Rate, Tenure). Client-side validation. POST `/api/loans`.
- [x] Implement loan approval (Approve button for PENDING loans → PATCH `/api/loans/{id}/approve`) and rejection (PATCH `/api/loans/{id}/reject`). Error handling added (no silent catch).
- [x] Implement Loan Details modal with EMI schedule tab (GET `/api/loans/{id}/schedule`) and Repayment History tab (GET `/api/loan-payments/loan/{id}`).
- [x] Connect `loadLoanPayments()` to GET `/api/loan-payments` — renders table with Payment ID, Loan ID, Date, Amount, Remaining Balance, Mode.
- [x] Implement Make Repayment modal — shows active loans, outstanding balance, payment mode dropdown (CASH/CHEQUE/ONLINE/EMI/AUTO_DEBIT). POST `/api/loan-payments`. Prevents over-payment client-side. Button disabled during submit.
- [x] Status badges fixed: CLOSED → green (badge-success), REJECTED/FAILED → red (badge-danger).
- [x] Backend fix: `LoanServiceImpl.applyForLoan` now sets `sanctionedByEmp` and `sanctionDate` (required NOT NULL columns).
- [x] Quick-navigate from Loans table "Repay" button directly to Loan Payments module with pre-selected loan.
- [x] Acceptance criteria verified against Oracle XE:
  - Loan 3007 applied (PERSONAL, ₹50,000, 12%, 12mo) → ID created, status PENDING ✅
  - Approved → status ACTIVE, outstanding ₹56,000 ✅
  - Payment ₹5,000 CASH → remaining ₹51,000 ✅
  - Over-payment rejected server-side with proper error ✅
  - EMI schedule: 12 entries generated correctly ✅
  - Audit logs recorded for every loan action ✅

### Task 4: Cards Module (`frontend/js/cards.js`)
- [x] Connect `loadCards()` to GET `/api/cards` and `/api/cards/account/{accountNo}` — renders table with Card ID, Card Number (masked by default with toggle), Linked Account, Customer, Card Type, Issue Date, Expiry Date, Status, Actions.
- [x] Implement Card Issue modal (dynamically loaded active accounts dropdown, account balance preview, card type DEBIT/CREDIT selection). POST `/api/cards`.
- [x] Implement Card status operations: Activate (PATCH `/api/cards/{id}/activate`), Block (PATCH `/api/cards/{id}/block`), Unblock (Activate from BLOCKED), Deactivate (PATCH `/api/cards/{id}/deactivate`), and Check Expiry (PATCH `/api/cards/{id}/check-expiry`).
- [x] Implement Card Details modal with unmask toggle, account link, status badge, and action shortcuts.
- [x] Add client-side search & filtering by card number, account, customer, card type (DEBIT/CREDIT), and status (ACTIVE/INACTIVE/BLOCKED/EXPIRED).
- [x] Security & CVV protection: Added `@JsonIgnore` to `cvvHash` in `Card.java` to prevent any CVV/hash leakage via REST API. Card numbers masked by default (`XXXX-XXXX-XXXX-XXXX`). No sensitive data in logs or audit records.
- [x] Backend improvements: Validated card type (DEBIT/CREDIT), prevented duplicate cards per account, updated `generateCardNumber` to produce 16-digit numeric card numbers, sorted cards newest-first (`ORDER BY CARD_ID DESC`), added `MANAGER` role to `@PreAuthorize` annotations in `CardController`.
- [x] Financial integrity: Verified that card operations cannot modify account balances or create unrelated transactions (Account #100000001 balance remained exactly ₹50,000.00 throughout issuance, activation, blocking, and deactivation).
- [x] Acceptance criteria verified against Oracle XE:
  - Security: Zero CVV or cvvHash returned in `/api/cards` ✅
  - Validation: Invalid card type rejected with HTTP 400 ✅
  - Card 3 issued: CREDIT linked to Account #100000001, 16 digits (`5124853767418835`), status INACTIVE ✅
  - Duplicate prevention: Re-issuing duplicate card type rejected with HTTP 409 ✅
  - Lifecycle: Activated (INACTIVE -> ACTIVE) -> Blocked (ACTIVE -> BLOCKED) -> Unblocked (BLOCKED -> ACTIVE) -> Deactivated (ACTIVE -> INACTIVE) ✅
  - Audit logging: Card issuance, activation, blocking, and deactivation logged in Oracle XE `AUDIT_LOG` ✅
  - Regressions: Employees (5), Beneficiaries (2), Loans (5), Loan Payments (5) all verified working ✅

### Task 5: Audit Logs Module (`frontend/js/auditLogs.js`)
- [x] Connect `loadAuditLogs()` to GET `/api/audit` and GET `/api/audit/filter` — renders paginated table with Log ID, Timestamp, Action Type badge, Description, Account No, Staff / Actor, IP Address, Actions.
- [x] Fixed critical pagination offset defect in `AuditLogRepository.findAll`: changed calculation to `offset = Math.max(0, page) * size` so 0-based page index from controller maps accurately to Oracle `ROWNUM` paging without returning empty results.
- [x] Hardened employee name concatenation in `AuditLogRepository.auditLogRowMapper` to prevent `"null null"` strings when `empId` is null.
- [x] Added action type dropdown filtering, account number filtering, and real-time client-side search across loaded descriptions, actions, accounts, and IPs.
- [x] Added server-backed multi-page pagination with Prev/Next, current page indicator, and direct page navigation.
- [x] Added Audit Log Details modal (`viewAuditLogDetails(logId)`) displaying complete immutable audit record specifications, timestamp, actor, IP address, and formatted event description.
- [x] Strictly read-only: Verified zero write/edit/delete actions or endpoints exist for audit logs.
- [x] Role-based access control verified: Only `ADMIN` and `MANAGER` roles are permitted (`hasAnyRole('ADMIN', 'MANAGER')`), unauthenticated requests rejected with HTTP 401. Friendly restricted-access empty state rendered for unauthorized access.
- [x] Security check: Confirmed zero passwords, CVVs, CVV hashes, session tokens, or credentials are exposed in descriptions or logs.
- [x] Acceptance criteria verified against Oracle XE:
  - 22 real audit records retrieved across 3 pages with zero ID overlap between pages ✅
  - Single log query `GET /api/audit/{id}` returns exact matching record ✅
  - Action filter query `GET /api/audit/filter?action=ISSUE_CARD` returns exact matches ✅
  - Regression verified: Employees (5), Beneficiaries (2), Loans (5), Loan Payments (5), Cards (3), Accounts (4), Customers (5) all working ✅

### Task 6: Reports & CSV Export Module (`frontend/js/reports.js`)
- [x] Connect `loadReports()` to all five GET `/api/reports/**` endpoints (Account Balances, Transaction Summary, Branch Activity, Loan Repayments, Customer Accounts).
- [x] Implement tabbed report selector with active-tab highlighting and dynamic filters (date range for Transaction Summary, customer dropdown for Customer Accounts).
- [x] Render summary cards with aggregated metrics per report type (total balances, transaction counts, loan outstanding, etc.).
- [x] Render dynamic data tables from `ReportData.headers` and `ReportData.rows` with formatted currency, status badges, and bold counts.
- [x] Implement "Export as CSV" button for the current report view (client-side Blob download from loaded data).
- [x] Connect CSV Export panel to all seven `/api/csv/export/{entity}` endpoints (banks, branches, customers, employees, accounts, transactions, loans) via direct binary download.
- [x] Connect CSV Import modal to all four `/api/csv/import/{entity}` endpoints (banks, branches, customers, employees) with multipart file upload, entity selection, column template hints, file type/size validation, and detailed result display (success/error counts, expandable error list).
- [x] Empty-file, invalid-file, and missing-entity validations verified (HTTP 400 with descriptive messages).
- [x] Removed `loadReports` stub from `stubs.js` (only `loadSettings` stub remains).
- [x] Frontend synced to `backend/src/main/resources/static/`. Spring Boot restarted and serving updated `reports.js` (585 lines).
- [x] Acceptance criteria verified against Oracle XE:
  - Account Balances: 4 accounts with correct balances, types, branches, and statuses ✅
  - Transaction Summary: 1 type (DEPOSIT), 2 transactions, ₹60,000 total volume ✅
  - Branch Activity: 3 branches with account counts and transaction volumes ✅
  - Loan Repayments: 5 loans with principal, outstanding, payments, and total paid ✅
  - Customer Accounts: Dynamic customer dropdown loading, filtered report per customer ✅
  - CSV Export: All 7 entities export correctly (banks 3 lines, branches 4, customers 6, employees 6, accounts 5, transactions 3, loans 6) ✅
  - CSV Import validation: All 4 entities correctly reject empty files with HTTP 400 ✅
  - Maven `mvn test`: BUILD SUCCESS (exit code 0) ✅
  - Regression: All 18 endpoints verified — Auth, Banks (2), Branches (3), Customers (5), Accounts (4), Employees (5), Beneficiaries (2), Loans (5), Loan Payments (5), Cards (3), Audit Logs (10), Transactions (2), Reports (4 endpoints), CSV Exports (2 sampled) ✅

### Task 7: Settings & Profile Module (`frontend/js/settings.js`)
- [x] Connect `loadSettings()` and `_fetchUserProfile()` to GET `/api/auth/me` — renders User Profile card with Username, Role badges (`ADMIN`/`MANAGER`/`STAFF`), Account status badge (`ACTIVE`), User ID, Creation timestamp, Last login timestamp, and linked staff profile details (Name, Designation, Email, Phone) if associated.
- [x] Implemented backend enhancements in `AuthController.java` and `AppUserRepository.java` to enrich `/api/auth/me` with user metadata and linked employee data while strictly preventing `passwordHash` or sensitive tokens from ever being exposed.
- [x] Implemented secure backend password change endpoint `POST /api/auth/change-password` with `ChangePasswordRequest` DTO, checking required fields, minimum password length (>= 6 chars), new password vs confirmation match, current password verification via `PasswordEncoder.matches()`, prevention of reusing identical passwords, BCrypt password hashing (strength 12), database update, and audit logging.
- [x] Implemented frontend password change form with show/hide password toggles (👁/🙈), client-side validation, submit button state handling, and clear feedback messages.
- [x] Connected session logout button to Spring Security CSRF-protected logout flow (`GET /api/csrf` -> `POST /logout` with CSRF header) with confirmation modal, state clearing, and redirect to `/login?logout=true`.
- [x] Verified that unauthenticated users are rejected with HTTP 401 on `/api/auth/me` and that protected endpoints cannot be accessed after logout.
- [x] Removed all stubs from `stubs.js` (all 7 tasks fully implemented).
- [x] Synchronized frontend assets to `backend/src/main/resources/static/`.
- [x] Acceptance criteria verified against Oracle XE & Spring Boot:
  - Profile retrieval: Returns authenticated user profile without exposing password hashes ✅
  - Unauthenticated access: `GET /api/auth/me` correctly returns HTTP 401 ✅
  - Password validations: Mismatched confirm, wrong current password, same password, and short password all rejected with HTTP 400 ✅
  - Password change lifecycle: `staff1` password changed from `staff123` -> `staffNew123` -> old password rejected -> new password logged in -> reverted cleanly back to `staff123` ✅
  - CSRF Logout: `POST /logout` executed -> subsequent protected API requests return HTTP 401 ✅
  - Maven tests: `mvn test` passed with BUILD SUCCESS ✅
  - Regression: All 18 endpoints across all modules verified working ✅

---

## Phase 4: Offline Verification & Documentation
- [x] Verify complete system runs with zero external internet dependencies (zero CDN links, zero remote fonts, zero external APIs; verified all 25 static assets bundled locally).
- [x] Synchronize all modified frontend assets into `backend/src/main/resources/static/` via automated Maven resource phase and verified file matching.
- [x] Rebuild final standalone executable JAR with `mvn clean package` -> `backend/target/bank-account-management-1.0.0.jar`.
- [x] Launched packaged JAR on port 8081 and verified full startup (9.7s), Oracle XE connectivity, static asset serving, and authenticated REST APIs.
- [x] Ran complete test suite (`mvn test`) with `BUILD SUCCESS` and full regression test verifying all 18 endpoints across 11 modules.
- [x] Updated `docs/setup-guide.md` with complete, accurate Windows setup, build, running, offline usage, and troubleshooting instructions.

---

## Bug Fix: Banks Page Display & CSV Export/Import Column Mismatch
- [x] **Root Cause 1 (Banks "No banks found")**: `banks.js` was expecting `data.content` (Spring Page format), but `GET /api/banks` returns `ApiResponse<List<Bank>>` (`data.data` is an array of `Bank` objects). This caused `data.content` to evaluate to `undefined`, erroneously rendering the "No banks found" empty state. In addition, column property names were mismatched (`b.bankCode` instead of `headOffice`, `contactNo`, `email`).
- [x] **Fix 1**: Rewrote `frontend/js/banks.js` with robust array extraction (`res.data || res`), instant client-side search, real-time input validation (10-digit phone, email check), proper loading and error states with retry functionality, and correct Add/Edit modal mapping.
- [x] **Root Cause 2 (Banks CSV Export/Import Mismatch)**:
  - `CsvServiceImpl.java` called `esc()` inside row arrays AND called `esc()` a second time inside `buildCsv()`, generating triple quotes (`"""..."""`) around any fields containing commas.
  - SQL projection unaliased column names resulted in uppercase keys (`BANK_NAME`) while getters used camelCase, causing string conversion issues.
- [x] **Fix 2**: Fixed all export methods in `CsvServiceImpl.java` to use single-pass CSV escaping (`buildCsv`) and explicit SQL double-quoted aliases (`SELECT Bank_Name AS "BankName"...`). Aligned canonical export header (`BankName,HeadOffice,ContactNo,Email`) with importer expected columns.
- [x] **Verification**:
  - Live Oracle XE returned 2 existing banks (`National Prosperity Bank`, `Coastal Commerce Bank`).
  - Banks UI table verified rendering all 2 records with full columns.
  - Banks CSV export verified producing exact header `BankName,HeadOffice,ContactNo,Email` with clean single-pass quoting.
  - Banks CSV import verified rejecting bad headers (HTTP 400), duplicates, and invalid emails, while successfully importing valid new bank data (`Zenith Global Bank`), verified in Oracle XE, and safely cleaned up.
  - All other CSV exports (branches, customers, employees, accounts, transactions, loans) verified free of double-escaping bugs.
  - Maven tests: `mvn test` passed with `BUILD SUCCESS` (0 failures, 0 errors).
  - Regression: All 14 endpoints across all modules verified working.

---

## Comprehensive Fix: Dashboard, Banks, Customers, Accounts Data Visibility & CSV Fix + Premium UI Redesign
- [x] **Root Cause 1 (Data Visibility Across Dashboard, Customers, Accounts, Branches, Banks)**:
  - `customers.js`, `accounts.js`, and `branches.js` expected `data.content` (Spring Data Page format). Because Spring Boot controllers (`/api/customers`, `/api/accounts`, `/api/branches`, `/api/banks`) return `ApiResponse<List<T>>` where `data` is a plain `List<T>`, `data.content` evaluated to `undefined`, causing the UI to falsely render the "No records found" empty state even though records existed in Oracle XE.
  - Property name mismatches:
    - Customers: `c.phoneNumber` instead of `c.phone`, `c.dateOfBirth` instead of `c.dob`.
    - Accounts: `a.accountNumber` instead of `a.accountNo`, `a.accountId` instead of `a.accountNo`, `a.accountStatus` instead of `a.status`, nested customer/branch objects instead of flat join fields `customerName` and `branchName`.
  - Dashboard: `dashboard.js` hardcoded `activeAccounts = 0`, `totalBranches = 0`, attempted to fetch `/customers?page=0&size=1` for `totalElements`, and queried non-existent `/transactions?page=0...` checking for `data.content` and mismatched field names (`transactionId`, `transactionType`, `transactionDate`, `status`). Backend already provides `GET /api/dashboard/stats` and `GET /api/dashboard/recent-transactions?limit=10`.
- [x] **Root Cause 2 (CSV Export/Import Incompatibilities & Double Escaping)**:
  - `CsvServiceImpl.java` called `esc()` inside row arrays AND called `esc()` inside `buildCsv()`, generating triple quotes (`"""..."""`) on exported fields containing commas.
  - Export SQL queries lacked explicit double-quoted aliases (`AS "BankName"`), causing Oracle uppercase key lookup mismatches.
- [x] **Backend & API Helper Fixes**:
  - Fixed `CsvServiceImpl.java` across all 7 export methods with single-pass escaping and explicit double-quoted column aliases.
  - Added `apiPatch` helper to `frontend/js/api.js` for KYC updates (`/api/customers/{id}/kyc`) and account status updates (`/api/accounts/{accountNo}/status`).
- [x] **Frontend Module Rewrites**:
  - `frontend/js/dashboard.js`: Connected to `GET /api/dashboard/stats` and `GET /api/dashboard/recent-transactions?limit=8`. Displays live counts for Total Customers, Active Accounts, Branch Network, Total Transactions, plus Inflow/Outflow financial liquidity summary and Recent Transactions table with real-time refresh.
  - `frontend/js/customers.js`: Handles `res.data || res`, real-time multi-attribute search (name, email, phone, ID, address), KYC status filter dropdown, Add/Edit modal with strict 10-digit phone and valid date validation, KYC quick-status update modal, and full CSV export/import workflow with progress/error feedback.
  - `frontend/js/accounts.js`: Handles `res.data || res`, real-time search, status and type filters, Open Account modal with dynamic customer and branch loading and initial deposit field, account status change modal (ACTIVE/FROZEN/CLOSED), and view account details with linked transaction history.
  - `frontend/js/transactions.js`: Rewritten with Deposit, Withdrawal, and Internal Transfer forms using exact backend DTO formats (`accountNo`, `amount`, `channel`, `remarks`, `sourceAccountNo`, `destinationAccountNo`, `idempotencyKey`). Recent transactions table connected to `/api/transactions/recent?limit=25` with live search.
- [x] **Premium Colourful UI Redesign**:
  - Visual Theme: Midnight navy (`#0B0F19`, `#0F172A`, `#1E293B`), royal blue & rich indigo gradients, rich purple/violet accents, teal/emerald accents, and warm gold financial highlights.
  - Re-architected `main.css`, `layout.css`, `components.css`, and `pages.css` with soft glassmorphism, responsive navigation sidebar, modern stat cards, formatted tables, and animated status badges.
  - 100% Offline: Zero external CDN dependencies, remote fonts, or internet APIs.
- [x] **Login Page Redesign & Currency Corner**:
  - Two-panel responsive layout in `login.html`:
    - Left Panel: Modern bank brand emblem, clean sign-in form with CSRF protection (`{{CSRF_TOKEN}}` replacement intact), operator credentials input, gradient submit button, and offline security tag.
    - Right Panel: "Currency Corner & Money Matters" awareness panel with 6 cards:
      1. Indian Rupee (INR): `&#8377;1 = 100 Paise`. Official legal tender of RBI.
      2. ISO Currency Codes: Standard 3-letter codes (`INR`, `USD`, `EUR`, `GBP`).
      3. Exchange Rate Dynamics: Awareness note on market fluctuation and authoritative verification.
      4. Smart Banking Checklist: Recipient account number & IFSC verification before transfer.
      5. Zero Trust Security Tip: Strict warning that bank personnel never request passwords, PINs, OTPs, or CVV.
      6. Financial Awareness: Importance of regular balance reconciliations and ledger tracking.
- [x] **Packaging & End-to-End Verification**:
  - Configured `pom.xml` with non-filtered extensions for frontend static files.
  - Rebuilt standalone JAR via `mvn clean package -DskipTests` -> BUILD SUCCESS.
  - Ran `mvn test` -> BUILD SUCCESS (0 failures, 0 errors).
  - Executed automated Python end-to-end verification suite (`scratch/test_e2e_verification.py`):
    - GET `/login`: HTTP 200, valid CSRF token injected, Currency Corner & all 6 financial cards verified ✅
    - Offline assets: All 9 CSS & JS files served locally with zero CDN links ✅
    - Authentication: Authenticated as `admin` / `admin123` via Spring Security form login ✅
    - Dashboard APIs: `/api/dashboard/stats` returned live counts (Customers: 6, Accounts: 4, Branches: 3, Deposits: ₹60,000, Txns: 2) ✅
    - Data Visibility: Banks (3), Customers (6), Accounts (4) verified directly from Oracle XE ✅
    - CSV Export & Import: Banks canonical export verified; Customer export clean (6 rows); Customer CSV import succeeded and persisted new customer to Oracle XE ✅
    - Core Financial Transaction: Cash deposit of ₹250.00 to Account #100000001 verified, updated balance to ₹50,250.00 ✅
    - Overall: **100% SUCCESS on all verification checks**.

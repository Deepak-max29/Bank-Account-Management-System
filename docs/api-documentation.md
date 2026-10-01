# Bank Account Management System - API Specification

Base URL: `http://localhost:8080/api`

All JSON responses follow the standard `ApiResponse<T>` wrapper:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2026-09-29T14:35:00"
}
```

---

## Core Endpoints

### 1. Dashboard
- `GET /api/dashboard/stats`: Summary counts (customers, active accounts, branches, transactions, loans).
- `GET /api/dashboard/recent-transactions?limit=10`: Latest transaction feed.
- `GET /api/dashboard/recent-audit-logs?limit=10`: Latest audit trail.

### 2. Banks & Branches
- `GET /api/banks`: List all banks.
- `POST /api/banks`: Create new bank record.
- `PUT /api/banks/{id}`: Update bank.
- `DELETE /api/banks/{id}`: Delete bank.
- `GET /api/branches`: List all branches.
- `POST /api/branches`: Create new branch.

### 3. Customers & Accounts
- `GET /api/customers`: List customers.
- `POST /api/customers`: Register customer.
- `PUT /api/customers/{id}/kyc`: Update KYC (`PENDING`, `VERIFIED`, `REJECTED`).
- `GET /api/accounts`: List accounts.
- `POST /api/accounts`: Open savings or current account.
- `PUT /api/accounts/{accountNo}/status`: Update status (`ACTIVE`, `FROZEN`, `CLOSED`).

### 4. Transactions
- `POST /api/transactions/deposit`: Deposit funds into account.
- `POST /api/transactions/withdraw`: Withdraw funds (minimum balance and KYC verified check).
- `POST /api/transactions/transfer`: Atomic fund transfer between accounts.
- `GET /api/transactions/history`: Filtered & paged transaction ledger.

### 5. Loans & Payments
- `GET /api/loans`: List all loans.
- `POST /api/loans`: Apply for loan.
- `POST /api/loans/{id}/approve`: Approve sanctioned loan.
- `GET /api/loans/{id}/schedule`: Calculated amortization schedule.
- `POST /api/loan-payments`: Make loan repayment.

### 6. Cards & Beneficiaries
- `GET /api/cards`: List cards (masked numbers).
- `POST /api/cards`: Issue card.
- `PUT /api/cards/{id}/status`: Activate, block, or deactivate card.
- `GET /api/beneficiaries`: List beneficiaries.
- `POST /api/beneficiaries`: Add beneficiary.

### 7. Reports & CSV Import/Export
- `GET /api/reports/{type}`: Account balance, branch activity, loan repayment reports.
- `POST /api/csv/import/{entity}`: Validated CSV upload.
- `GET /api/csv/export/{entity}`: CSV download.

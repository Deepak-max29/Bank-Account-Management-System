# Bank Account Management System - Database Design Documentation

## 1. Executive Summary & Design Principles

The Bank Account Management System uses Oracle Database XE 10g/21c designed to Third Normal Form (3NF).
It implements **EXACTLY 11 core business entities** and 1 internal application infrastructure authentication table (`APP_USER`).

---

## 2. Entity-Relationship Model (11 Core Entities)

1. **BANK**: Root institution details (Bank_ID, Name, Head_Office, Contact_No, Email).
2. **BRANCH**: Operational branches linked to BANK (Branch_ID, Bank_ID, IFSC_Code, City, State, Pincode).
3. **EMPLOYEE**: Bank staff assigned to BRANCH (Emp_ID, Branch_ID, Name, Designation, Salary, Phone, Email).
4. **CUSTOMER**: Account holders with KYC status (Customer_ID, Name, Email, Phone, DOB, KYC_Status).
5. **ACCOUNT**: Financial ledger accounts (Account_No, Customer_ID, Branch_ID, Account_Type, Balance, Status, Opened_Date).
6. **TRANSACTION**: Immutable atomic audit record of deposits, withdrawals, and transfers (Txn_ID, Account_No, Txn_Type, Amount, Balance_After, Channel, Txn_Date, Ref_Txn_ID, Remarks).
7. **BENEFICIARY**: Whitelisted transfer recipients (Beneficiary_ID, Customer_ID, Beneficiary_Acc_No, Name, Bank_Name, IFSC_Code, Max_Limit, Is_Verified, Is_Active).
8. **LOAN**: Credit facilities issued to customers (Loan_ID, Customer_ID, Branch_ID, Sanctioned_By_Emp, Loan_Type, Principal_Amount, Interest_Rate, Loan_Tenure, Loan_Status, Sanction_Date, Outstanding_Bal).
9. **LOAN_PAYMENT**: Installments paid towards an active loan (Payment_ID, Loan_ID, Payment_Date, Amount_Paid, Remaining_Balance, Payment_Mode).
10. **CARD**: Synthetic debit/credit cards linked to an account (Card_ID, Card_Number, Account_No, Card_Type, CVV_Hash, Issue_Date, Expiry_Date, Card_Status).
11. **AUDIT_LOG**: Complete system activity and security log (Log_ID, Account_No, Emp_ID, Action_Type, Description, IP_Address, Log_Timestamp).

---

## 3. Cardinalities & Relationships

- `BANK (1) ----< (N) BRANCH`
- `BRANCH (1) ----< (N) EMPLOYEE`
- `BRANCH (1) ----< (N) ACCOUNT`
- `CUSTOMER (1) ----< (N) ACCOUNT`
- `CUSTOMER (1) ----< (N) BENEFICIARY`
- `CUSTOMER (1) ----< (N) LOAN`
- `EMPLOYEE (1) ----< (N) LOAN` (Sanctioning authority)
- `LOAN (1) ----< (N) LOAN_PAYMENT`
- `ACCOUNT (1) ----< (N) TRANSACTION`
- `ACCOUNT (1) ----< (N) CARD`
- `ACCOUNT (0..1) ----< (N) AUDIT_LOG`

---

## 4. Normalization Details (3NF)

- **1NF**: Atomic attributes, primary keys defined for every table, no repeating groups.
- **2NF**: No partial dependencies; all non-key attributes are fully functionally dependent on primary keys.
- **3NF**: No transitive dependencies. Derived balances are maintained via transactional database logic and guarded by balance check constraints.

---

## 5. Security & Data Integrity

- Check constraints enforce positive balances, positive transaction amounts, valid email regex, and valid IFSC formats.
- Card numbers are masked on display; CVVs are BCrypt hashed and never stored or logged in plaintext.
- Inter-account transfers write paired atomic records (`TRANSFER_DEBIT` and `TRANSFER_CREDIT`) linked by `Ref_Txn_ID`.

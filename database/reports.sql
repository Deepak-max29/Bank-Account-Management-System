-- ============================================================
-- BANK ACCOUNT MANAGEMENT SYSTEM - REPORT QUERIES
-- ============================================================
-- Useful SQL queries for generating reports
-- These queries are used by the ReportService in the backend
-- ============================================================

-- ============================================================
-- Report 1: Account Balance Summary
-- ============================================================
-- Shows all accounts with their current balance, customer name,
-- branch name, and account status
SELECT 
    a.Account_No,
    c.First_Name || ' ' || c.Last_Name AS Customer_Name,
    b.Branch_Name,
    bk.Bank_Name,
    a.Account_Type,
    a.Balance,
    a.Status,
    a.Opened_Date
FROM ACCOUNT a
JOIN CUSTOMER c ON a.Customer_ID = c.Customer_ID
JOIN BRANCH b ON a.Branch_ID = b.Branch_ID
JOIN BANK bk ON b.Bank_ID = bk.Bank_ID
ORDER BY a.Balance DESC;

-- ============================================================
-- Report 2: Customer Account Report
-- ============================================================
-- Shows all accounts for a specific customer
-- Replace :customer_id with actual customer ID
SELECT 
    a.Account_No,
    a.Account_Type,
    a.Balance,
    a.Status,
    b.Branch_Name,
    a.Opened_Date,
    (SELECT COUNT(*) FROM TRANSACTION t WHERE t.Account_No = a.Account_No) AS Txn_Count
FROM ACCOUNT a
JOIN BRANCH b ON a.Branch_ID = b.Branch_ID
WHERE a.Customer_ID = :customer_id
ORDER BY a.Opened_Date;

-- ============================================================
-- Report 3: Transaction Summary by Date Range
-- ============================================================
-- Aggregated transaction statistics within a date range
-- Replace :start_date and :end_date
SELECT 
    t.Txn_Type,
    COUNT(*) AS Txn_Count,
    SUM(t.Amount) AS Total_Amount,
    AVG(t.Amount) AS Avg_Amount,
    MIN(t.Amount) AS Min_Amount,
    MAX(t.Amount) AS Max_Amount
FROM TRANSACTION t
WHERE t.Txn_Date BETWEEN :start_date AND :end_date
GROUP BY t.Txn_Type
ORDER BY t.Txn_Type;

-- ============================================================
-- Report 4: Branch Activity Report
-- ============================================================
-- Transaction volume and value per branch
SELECT 
    b.Branch_Name,
    bk.Bank_Name,
    b.City,
    COUNT(DISTINCT a.Account_No) AS Total_Accounts,
    COUNT(t.Txn_ID) AS Total_Transactions,
    NVL(SUM(CASE WHEN t.Txn_Type = 'DEPOSIT' THEN t.Amount ELSE 0 END), 0) AS Total_Deposits,
    NVL(SUM(CASE WHEN t.Txn_Type = 'WITHDRAWAL' THEN t.Amount ELSE 0 END), 0) AS Total_Withdrawals,
    NVL(SUM(a.Balance), 0) AS Total_Balance
FROM BRANCH b
JOIN BANK bk ON b.Bank_ID = bk.Bank_ID
LEFT JOIN ACCOUNT a ON b.Branch_ID = a.Branch_ID
LEFT JOIN TRANSACTION t ON a.Account_No = t.Account_No
GROUP BY b.Branch_Name, bk.Bank_Name, b.City
ORDER BY Total_Transactions DESC;

-- ============================================================
-- Report 5: Loan Repayment Report
-- ============================================================
-- Shows all active loans with their repayment status
SELECT 
    l.Loan_ID,
    c.First_Name || ' ' || c.Last_Name AS Customer_Name,
    l.Loan_Type,
    l.Principal_Amount,
    l.Interest_Rate,
    l.Loan_Tenure,
    l.Outstanding_Bal,
    l.Loan_Status,
    b.Branch_Name,
    e.First_Name || ' ' || e.Last_Name AS Sanctioned_By,
    l.Sanction_Date,
    (SELECT COUNT(*) FROM LOAN_PAYMENT lp WHERE lp.Loan_ID = l.Loan_ID) AS Payments_Made,
    (SELECT NVL(SUM(lp.Amount_Paid), 0) FROM LOAN_PAYMENT lp WHERE lp.Loan_ID = l.Loan_ID) AS Total_Paid
FROM LOAN l
JOIN CUSTOMER c ON l.Customer_ID = c.Customer_ID
JOIN BRANCH b ON l.Branch_ID = b.Branch_ID
JOIN EMPLOYEE e ON l.Sanctioned_By_Emp = e.Emp_ID
ORDER BY l.Outstanding_Bal DESC;

-- ============================================================
-- Dashboard Statistics Queries
-- ============================================================
-- Total Customers
SELECT COUNT(*) AS Total_Customers FROM CUSTOMER;

-- Active Accounts
SELECT COUNT(*) AS Active_Accounts FROM ACCOUNT WHERE Status = 'ACTIVE';

-- Total Branches
SELECT COUNT(*) AS Total_Branches FROM BRANCH;

-- Transaction Count (this month)
SELECT COUNT(*) AS Txn_Count FROM TRANSACTION 
WHERE Txn_Date >= TRUNC(SYSDATE, 'MM');

-- Active Loan Count
SELECT COUNT(*) AS Loan_Count FROM LOAN WHERE Loan_Status = 'ACTIVE';

-- Total Deposits
SELECT NVL(SUM(Amount), 0) AS Total_Deposits 
FROM TRANSACTION WHERE Txn_Type = 'DEPOSIT';

-- Total Withdrawals
SELECT NVL(SUM(Amount), 0) AS Total_Withdrawals 
FROM TRANSACTION WHERE Txn_Type = 'WITHDRAWAL';

-- Recent 10 Transactions
SELECT * FROM (
    SELECT t.*, c.First_Name || ' ' || c.Last_Name AS Customer_Name
    FROM TRANSACTION t
    JOIN ACCOUNT a ON t.Account_No = a.Account_No
    JOIN CUSTOMER c ON a.Customer_ID = c.Customer_ID
    ORDER BY t.Txn_Date DESC
) WHERE ROWNUM <= 10;

-- Recent 10 Audit Logs
SELECT * FROM (
    SELECT al.*, e.First_Name || ' ' || e.Last_Name AS Emp_Name
    FROM AUDIT_LOG al
    LEFT JOIN EMPLOYEE e ON al.Emp_ID = e.Emp_ID
    ORDER BY al.Log_Timestamp DESC
) WHERE ROWNUM <= 10;

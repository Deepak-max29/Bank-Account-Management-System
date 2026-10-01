-- ============================================================
-- SAMPLE DATA - ALL DATA IS ENTIRELY FICTIONAL
-- For demonstration purposes only. Not real banking data.
-- ============================================================
-- Run AFTER schema.sql and indexes.sql
-- Uses MERGE to prevent duplicate inserts on restart
-- ============================================================

-- ============================================================
-- APP_USER (Admin login)
-- Passwords are BCrypt hashed. Default: admin123 / staff123
-- ============================================================
-- BCrypt hash of 'admin123'
INSERT INTO APP_USER (Username, Password_Hash, Role, Emp_ID, Is_Active)
SELECT 'admin', '$2a$12$R3mG5C7xo5u.SgZDv2LbWuYu9sFz.wwHetBl/Lku.nnYnaZG1aG9a', 'ADMIN', NULL, 1
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM APP_USER WHERE Username = 'admin');

-- BCrypt hash of 'manager123'
INSERT INTO APP_USER (Username, Password_Hash, Role, Is_Active)
SELECT 'manager1', '$2a$12$RZ/kA6Kq514/BQT7Di5Qx.abyl5WnX/K2UGsHxRcw7gr7Oi/7a/Ta', 'MANAGER', 1
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM APP_USER WHERE Username = 'manager1');

-- BCrypt hash of 'staff123'
INSERT INTO APP_USER (Username, Password_Hash, Role, Is_Active)
SELECT 'staff1', '$2a$12$GMQlH/wcQLjO5MGRXJhrb..cfSJ2UpRjgnv8BnXrYNMAtvPtT23Eu', 'STAFF', 1
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM APP_USER WHERE Username = 'staff1');

-- ============================================================
-- BANK sample data
-- Phone format: digits with optional + - space (7-15 chars)
-- ============================================================
INSERT INTO BANK (Bank_Name, Head_Office, Contact_No, Email)
SELECT 'National Prosperity Bank', 'Connaught Place, New Delhi - 110001', '01123456789', 'info@npbank.in'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM BANK WHERE Bank_Name = 'National Prosperity Bank');

INSERT INTO BANK (Bank_Name, Head_Office, Contact_No, Email)
SELECT 'Coastal Commerce Bank', 'MG Road, Bangalore - 560001', '08023456789', 'info@ccbank.in'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM BANK WHERE Bank_Name = 'Coastal Commerce Bank');

-- ============================================================
-- BRANCH sample data
-- ============================================================
INSERT INTO BRANCH (Bank_ID, Branch_Name, IFSC_Code, City, State, Pincode)
SELECT 1, 'NPB Main Branch', 'NPBK0000001', 'New Delhi', 'Delhi', '110001'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM BRANCH WHERE IFSC_Code = 'NPBK0000001');

INSERT INTO BRANCH (Bank_ID, Branch_Name, IFSC_Code, City, State, Pincode)
SELECT 1, 'NPB Hyderabad Branch', 'NPBK0000002', 'Hyderabad', 'Telangana', '500001'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM BRANCH WHERE IFSC_Code = 'NPBK0000002');

INSERT INTO BRANCH (Bank_ID, Branch_Name, IFSC_Code, City, State, Pincode)
SELECT 2, 'CCB Bangalore Main', 'CCBK0000001', 'Bangalore', 'Karnataka', '560001'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM BRANCH WHERE IFSC_Code = 'CCBK0000001');

-- ============================================================
-- EMPLOYEE sample data
-- ============================================================
INSERT INTO EMPLOYEE (Branch_ID, First_Name, Last_Name, Designation, Salary, Phone, Email)
SELECT 1, 'Rajan', 'Mehta', 'MANAGER', 85000.00, '9876543210', 'rajan.mehta@npbank.in'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM EMPLOYEE WHERE Email = 'rajan.mehta@npbank.in');

INSERT INTO EMPLOYEE (Branch_ID, First_Name, Last_Name, Designation, Salary, Phone, Email)
SELECT 1, 'Priya', 'Sharma', 'LOAN_OFFICER', 65000.00, '9876543211', 'priya.sharma@npbank.in'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM EMPLOYEE WHERE Email = 'priya.sharma@npbank.in');

INSERT INTO EMPLOYEE (Branch_ID, First_Name, Last_Name, Designation, Salary, Phone, Email)
SELECT 2, 'Sanjay', 'Reddy', 'MANAGER', 82000.00, '9876543212', 'sanjay.reddy@npbank.in'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM EMPLOYEE WHERE Email = 'sanjay.reddy@npbank.in');

INSERT INTO EMPLOYEE (Branch_ID, First_Name, Last_Name, Designation, Salary, Phone, Email)
SELECT 3, 'Kavitha', 'Nair', 'MANAGER', 80000.00, '9876543213', 'kavitha.nair@ccbank.in'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM EMPLOYEE WHERE Email = 'kavitha.nair@ccbank.in');

-- Update manager1 user to link to first employee
UPDATE APP_USER SET Emp_ID = (SELECT MIN(Emp_ID) FROM EMPLOYEE WHERE Email = 'rajan.mehta@npbank.in')
WHERE Username = 'manager1' AND Emp_ID IS NULL;

-- ============================================================
-- CUSTOMER sample data
-- ============================================================
INSERT INTO CUSTOMER (First_Name, Last_Name, Email, Phone, DOB, KYC_Status)
SELECT 'Arjun', 'Kumar', 'arjun.kumar@email.com', '9800000001', TO_DATE('1990-05-15','YYYY-MM-DD'), 'VERIFIED'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM CUSTOMER WHERE Email = 'arjun.kumar@email.com');

INSERT INTO CUSTOMER (First_Name, Last_Name, Email, Phone, DOB, KYC_Status)
SELECT 'Sunita', 'Patel', 'sunita.patel@email.com', '9800000002', TO_DATE('1985-08-22','YYYY-MM-DD'), 'VERIFIED'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM CUSTOMER WHERE Email = 'sunita.patel@email.com');

INSERT INTO CUSTOMER (First_Name, Last_Name, Email, Phone, DOB, KYC_Status)
SELECT 'Vikram', 'Singh', 'vikram.singh@email.com', '9800000003', TO_DATE('1978-12-10','YYYY-MM-DD'), 'VERIFIED'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM CUSTOMER WHERE Email = 'vikram.singh@email.com');

INSERT INTO CUSTOMER (First_Name, Last_Name, Email, Phone, DOB, KYC_Status)
SELECT 'Anjali', 'Gupta', 'anjali.gupta@email.com', '9800000004', TO_DATE('1995-03-28','YYYY-MM-DD'), 'PENDING'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM CUSTOMER WHERE Email = 'anjali.gupta@email.com');

INSERT INTO CUSTOMER (First_Name, Last_Name, Email, Phone, DOB, KYC_Status)
SELECT 'Rahul', 'Verma', 'rahul.verma@email.com', '9800000005', TO_DATE('1982-07-17','YYYY-MM-DD'), 'VERIFIED'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM CUSTOMER WHERE Email = 'rahul.verma@email.com');

-- ============================================================
-- ACCOUNT sample data
-- ============================================================
INSERT INTO ACCOUNT (Customer_ID, Branch_ID, Account_Type, Balance, Status, Opened_Date)
SELECT c.Customer_ID, 1, 'SAVINGS', 50000.00, 'ACTIVE', TO_DATE('2023-01-10','YYYY-MM-DD')
FROM CUSTOMER c WHERE c.Email = 'arjun.kumar@email.com'
AND NOT EXISTS (SELECT 1 FROM ACCOUNT a WHERE a.Customer_ID = c.Customer_ID AND a.Account_Type='SAVINGS' AND a.Branch_ID=1);

INSERT INTO ACCOUNT (Customer_ID, Branch_ID, Account_Type, Balance, Status, Opened_Date)
SELECT c.Customer_ID, 1, 'CURRENT', 150000.00, 'ACTIVE', TO_DATE('2023-02-15','YYYY-MM-DD')
FROM CUSTOMER c WHERE c.Email = 'sunita.patel@email.com'
AND NOT EXISTS (SELECT 1 FROM ACCOUNT a WHERE a.Customer_ID = c.Customer_ID AND a.Account_Type='CURRENT' AND a.Branch_ID=1);

INSERT INTO ACCOUNT (Customer_ID, Branch_ID, Account_Type, Balance, Status, Opened_Date)
SELECT c.Customer_ID, 2, 'SAVINGS', 75000.00, 'ACTIVE', TO_DATE('2023-03-20','YYYY-MM-DD')
FROM CUSTOMER c WHERE c.Email = 'vikram.singh@email.com'
AND NOT EXISTS (SELECT 1 FROM ACCOUNT a WHERE a.Customer_ID = c.Customer_ID AND a.Account_Type='SAVINGS' AND a.Branch_ID=2);

INSERT INTO ACCOUNT (Customer_ID, Branch_ID, Account_Type, Balance, Status, Opened_Date)
SELECT c.Customer_ID, 3, 'SAVINGS', 25000.00, 'ACTIVE', TO_DATE('2023-04-05','YYYY-MM-DD')
FROM CUSTOMER c WHERE c.Email = 'rahul.verma@email.com'
AND NOT EXISTS (SELECT 1 FROM ACCOUNT a WHERE a.Customer_ID = c.Customer_ID AND a.Account_Type='SAVINGS' AND a.Branch_ID=3);

-- ============================================================
-- TRANSACTION sample data (using simple inserts instead of PL/SQL block)
-- ============================================================
-- Arjun's transactions (assuming Account_No = 100000001 for arjun)
INSERT INTO TRANSACTION (Account_No, Txn_Type, Amount, Balance_After, Channel, Txn_Date, Remarks)
SELECT 100000001, 'DEPOSIT', 10000.00, 60000.00, 'BRANCH', TO_DATE('2023-05-01','YYYY-MM-DD'), 'SAMPLE_SEED'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM TRANSACTION WHERE Account_No = 100000001 AND Remarks = 'SAMPLE_SEED');

INSERT INTO TRANSACTION (Account_No, Txn_Type, Amount, Balance_After, Channel, Txn_Date, Remarks)
SELECT 100000001, 'WITHDRAWAL', 5000.00, 55000.00, 'ATM', TO_DATE('2023-05-10','YYYY-MM-DD'), 'SAMPLE_SEED'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM TRANSACTION WHERE Account_No = 100000001 AND Remarks = 'SAMPLE_SEED');

INSERT INTO TRANSACTION (Account_No, Txn_Type, Amount, Balance_After, Channel, Txn_Date, Remarks)
SELECT 100000001, 'DEPOSIT', 15000.00, 70000.00, 'NETBANKING', TO_DATE('2023-06-01','YYYY-MM-DD'), 'SAMPLE_SEED'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM TRANSACTION WHERE Account_No = 100000001 AND Remarks = 'SAMPLE_SEED');

-- Sunita's transactions (assuming Account_No = 100000002 for sunita)
INSERT INTO TRANSACTION (Account_No, Txn_Type, Amount, Balance_After, Channel, Txn_Date, Remarks)
SELECT 100000002, 'DEPOSIT', 50000.00, 200000.00, 'BRANCH', TO_DATE('2023-05-05','YYYY-MM-DD'), 'SAMPLE_SEED'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM TRANSACTION WHERE Account_No = 100000002 AND Remarks = 'SAMPLE_SEED');

INSERT INTO TRANSACTION (Account_No, Txn_Type, Amount, Balance_After, Channel, Txn_Date, Remarks)
SELECT 100000002, 'WITHDRAWAL', 20000.00, 180000.00, 'ATM', TO_DATE('2023-05-15','YYYY-MM-DD'), 'SAMPLE_SEED'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM TRANSACTION WHERE Account_No = 100000002 AND Remarks = 'SAMPLE_SEED');

-- ============================================================
-- BENEFICIARY sample data
-- ============================================================
INSERT INTO BENEFICIARY (Customer_ID, Beneficiary_Acc_No, Beneficiary_Name, Bank_Name, IFSC_Code, Max_Limit, Is_Verified, Is_Active)
SELECT c.Customer_ID, '9876543210001', 'Priya Kumar', 'State Bank', 'SBIN0001234', 50000.00, 1, 1
FROM CUSTOMER c WHERE c.Email = 'arjun.kumar@email.com'
AND NOT EXISTS (SELECT 1 FROM BENEFICIARY b WHERE b.Customer_ID = c.Customer_ID AND b.Beneficiary_Acc_No = '9876543210001');

-- ============================================================
-- LOAN sample data
-- ============================================================
INSERT INTO LOAN (Customer_ID, Branch_ID, Sanctioned_By_Emp, Loan_Type, Principal_Amount, Interest_Rate, Loan_Tenure, Loan_Status, Outstanding_Bal)
SELECT c.Customer_ID, 1, (SELECT MIN(Emp_ID) FROM EMPLOYEE WHERE Designation = 'LOAN_OFFICER'),
       'HOME', 2000000.00, 8.50, 240, 'ACTIVE', 1850000.00
FROM CUSTOMER c WHERE c.Email = 'arjun.kumar@email.com'
AND NOT EXISTS (SELECT 1 FROM LOAN l WHERE l.Customer_ID = c.Customer_ID AND l.Loan_Type = 'HOME' AND l.Branch_ID = 1);

INSERT INTO LOAN (Customer_ID, Branch_ID, Sanctioned_By_Emp, Loan_Type, Principal_Amount, Interest_Rate, Loan_Tenure, Loan_Status, Outstanding_Bal)
SELECT c.Customer_ID, 2, (SELECT MIN(Emp_ID) FROM EMPLOYEE WHERE Branch_ID = 2),
       'CAR', 500000.00, 9.00, 60, 'ACTIVE', 425000.00
FROM CUSTOMER c WHERE c.Email = 'vikram.singh@email.com'
AND NOT EXISTS (SELECT 1 FROM LOAN l WHERE l.Customer_ID = c.Customer_ID AND l.Loan_Type = 'CAR' AND l.Branch_ID = 2);

-- ============================================================
-- LOAN_PAYMENT sample data
-- ============================================================
INSERT INTO LOAN_PAYMENT (Loan_ID, Payment_Date, Amount_Paid, Remaining_Balance, Payment_Mode)
SELECT l.Loan_ID, TO_DATE('2023-07-01','YYYY-MM-DD'), 17500.00, 1982500.00, 'EMI'
FROM LOAN l JOIN CUSTOMER c ON l.Customer_ID = c.Customer_ID
WHERE c.Email = 'arjun.kumar@email.com' AND l.Loan_Type = 'HOME'
AND NOT EXISTS (SELECT 1 FROM LOAN_PAYMENT lp WHERE lp.Loan_ID = l.Loan_ID AND lp.Payment_Date = TO_DATE('2023-07-01','YYYY-MM-DD'));

INSERT INTO LOAN_PAYMENT (Loan_ID, Payment_Date, Amount_Paid, Remaining_Balance, Payment_Mode)
SELECT l.Loan_ID, TO_DATE('2023-08-01','YYYY-MM-DD'), 17500.00, 1850000.00, 'EMI'
FROM LOAN l JOIN CUSTOMER c ON l.Customer_ID = c.Customer_ID
WHERE c.Email = 'arjun.kumar@email.com' AND l.Loan_Type = 'HOME'
AND NOT EXISTS (SELECT 1 FROM LOAN_PAYMENT lp WHERE lp.Loan_ID = l.Loan_ID AND lp.Payment_Date = TO_DATE('2023-08-01','YYYY-MM-DD'));

-- ============================================================
-- CARD sample data
-- ============================================================
-- CVV hash of '123' (demo only, not real)
INSERT INTO CARD (Card_Number, Account_No, Card_Type, CVV_Hash, Issue_Date, Expiry_Date, Card_Status)
SELECT '4532' || LPAD(TO_CHAR(a.Account_No), 12, '0'),
       a.Account_No, 'DEBIT',
       '$2a$12$demoHashForCVV123NotReal',
       TO_DATE('2023-01-10','YYYY-MM-DD'),
       TO_DATE('2028-01-31','YYYY-MM-DD'),
       'ACTIVE'
FROM ACCOUNT a JOIN CUSTOMER c ON a.Customer_ID = c.Customer_ID
WHERE c.Email = 'arjun.kumar@email.com'
AND NOT EXISTS (SELECT 1 FROM CARD cd WHERE cd.Account_No = a.Account_No AND cd.Card_Type = 'DEBIT');

INSERT INTO CARD (Card_Number, Account_No, Card_Type, CVV_Hash, Issue_Date, Expiry_Date, Card_Status)
SELECT '5412' || LPAD(TO_CHAR(a.Account_No), 12, '0'),
       a.Account_No, 'DEBIT',
       '$2a$12$demoHashForCVV456NotReal',
       TO_DATE('2023-02-15','YYYY-MM-DD'),
       TO_DATE('2028-02-28','YYYY-MM-DD'),
       'ACTIVE'
FROM ACCOUNT a JOIN CUSTOMER c ON a.Customer_ID = c.Customer_ID
WHERE c.Email = 'sunita.patel@email.com'
AND NOT EXISTS (SELECT 1 FROM CARD cd WHERE cd.Account_No = a.Account_No AND cd.Card_Type = 'DEBIT');

-- ============================================================
-- AUDIT_LOG sample data
-- ============================================================
INSERT INTO AUDIT_LOG (Account_No, Emp_ID, Action_Type, Description, IP_Address)
SELECT NULL, NULL, 'LOGIN', 'Admin login at system initialization', '127.0.0.1'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM AUDIT_LOG WHERE Action_Type = 'LOGIN' AND Description = 'Admin login at system initialization');

COMMIT;
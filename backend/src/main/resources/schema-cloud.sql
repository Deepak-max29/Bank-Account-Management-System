-- ==============================================================================
-- CLOUD COMPATIBLE DDL FOR RENDER / H2 ORACLE MODE
-- Automatically executed on Cloud / Render startup
-- ==============================================================================

-- Sequences
CREATE SEQUENCE IF NOT EXISTS SEQ_USER_ID        START WITH 10 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS SEQ_BANK_ID        START WITH 10 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS SEQ_BRANCH_ID      START WITH 10 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS SEQ_EMP_ID         START WITH 1010 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS SEQ_CUSTOMER_ID    START WITH 2010 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS SEQ_ACCOUNT_NO     START WITH 100000010 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS SEQ_TXN_ID         START WITH 5000010 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS SEQ_BENEFICIARY_ID START WITH 10 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS SEQ_LOAN_ID        START WITH 3010 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS SEQ_PAYMENT_ID     START WITH 10 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS SEQ_CARD_ID        START WITH 10 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS SEQ_LOG_ID         START WITH 10 INCREMENT BY 1;

-- 0. APP_USER
CREATE TABLE IF NOT EXISTS APP_USER (
    User_ID        BIGINT PRIMARY KEY,
    Username       VARCHAR(50)  NOT NULL UNIQUE,
    Password_Hash  VARCHAR(255) NOT NULL,
    Role           VARCHAR(20)  NOT NULL,
    Emp_ID         BIGINT,
    Is_Active      INT          DEFAULT 1 NOT NULL,
    Created_At     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    Last_Login     TIMESTAMP
);

-- 1. BANK
CREATE TABLE IF NOT EXISTS BANK (
    Bank_ID     BIGINT PRIMARY KEY,
    Bank_Name   VARCHAR(100) NOT NULL UNIQUE,
    Head_Office VARCHAR(200) NOT NULL,
    Contact_No  VARCHAR(15)  NOT NULL,
    Email       VARCHAR(100) NOT NULL,
    Website     VARCHAR(100)
);

-- 2. BRANCH
CREATE TABLE IF NOT EXISTS BRANCH (
    Branch_ID      BIGINT PRIMARY KEY,
    Bank_ID        BIGINT       NOT NULL REFERENCES BANK(Bank_ID),
    Branch_Name    VARCHAR(100) NOT NULL,
    IFSC_Code      VARCHAR(15)  NOT NULL UNIQUE,
    City           VARCHAR(50)  NOT NULL,
    State          VARCHAR(50)  NOT NULL,
    Pincode        VARCHAR(6)   NOT NULL,
    Address        VARCHAR(255),
    Contact_Number VARCHAR(15),
    Email          VARCHAR(100)
);

-- 3. EMPLOYEE
CREATE TABLE IF NOT EXISTS EMPLOYEE (
    Emp_ID      BIGINT PRIMARY KEY,
    Branch_ID   BIGINT       NOT NULL REFERENCES BRANCH(Branch_ID),
    First_Name  VARCHAR(50)  NOT NULL,
    Last_Name   VARCHAR(50)  NOT NULL,
    Designation VARCHAR(50)  NOT NULL,
    Salary      DECIMAL(12,2) NOT NULL,
    Phone       VARCHAR(15)  NOT NULL,
    Email       VARCHAR(100) NOT NULL UNIQUE,
    Join_Date   DATE
);

-- 4. CUSTOMER
CREATE TABLE IF NOT EXISTS CUSTOMER (
    Customer_ID BIGINT PRIMARY KEY,
    First_Name  VARCHAR(50)  NOT NULL,
    Last_Name   VARCHAR(50)  NOT NULL,
    Email       VARCHAR(100) NOT NULL UNIQUE,
    Phone       VARCHAR(15)  NOT NULL,
    DOB         DATE         NOT NULL,
    Gender      VARCHAR(10),
    Address     VARCHAR(255),
    KYC_Status  VARCHAR(10)  DEFAULT 'PENDING' NOT NULL,
    Created_At  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. ACCOUNT
CREATE TABLE IF NOT EXISTS ACCOUNT (
    Account_No    BIGINT PRIMARY KEY,
    Customer_ID   BIGINT         NOT NULL REFERENCES CUSTOMER(Customer_ID),
    Branch_ID     BIGINT         NOT NULL REFERENCES BRANCH(Branch_ID),
    Account_Type  VARCHAR(10)    NOT NULL,
    Balance       DECIMAL(15,2)  DEFAULT 0 NOT NULL,
    Status        VARCHAR(10)    DEFAULT 'ACTIVE' NOT NULL,
    Opened_Date   DATE           DEFAULT CURRENT_DATE NOT NULL
);

-- 6. TRANSACTION
CREATE TABLE IF NOT EXISTS TRANSACTION (
    Txn_ID          BIGINT PRIMARY KEY,
    Account_No      BIGINT        NOT NULL REFERENCES ACCOUNT(Account_No),
    Txn_Type        VARCHAR(15)   NOT NULL,
    Amount          DECIMAL(15,2) NOT NULL,
    Balance_After   DECIMAL(15,2) NOT NULL,
    Channel         VARCHAR(15)   NOT NULL,
    Txn_Date        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    Ref_Txn_ID      BIGINT,
    Remarks         VARCHAR(255),
    Idempotency_Key VARCHAR(64)
);

-- 7. BENEFICIARY
CREATE TABLE IF NOT EXISTS BENEFICIARY (
    Beneficiary_ID     BIGINT PRIMARY KEY,
    Customer_ID        BIGINT        NOT NULL REFERENCES CUSTOMER(Customer_ID),
    Beneficiary_Acc_No VARCHAR(20)   NOT NULL,
    Beneficiary_Name   VARCHAR(100)  NOT NULL,
    Bank_Name          VARCHAR(100)  NOT NULL,
    IFSC_Code          VARCHAR(15)   NOT NULL,
    Max_Limit          DECIMAL(15,2) DEFAULT 100000 NOT NULL,
    Is_Verified        INT           DEFAULT 0 NOT NULL,
    Is_Active          INT           DEFAULT 1 NOT NULL,
    Added_Date         DATE          DEFAULT CURRENT_DATE NOT NULL
);

-- 8. LOAN
CREATE TABLE IF NOT EXISTS LOAN (
    Loan_ID           BIGINT PRIMARY KEY,
    Customer_ID       BIGINT        NOT NULL REFERENCES CUSTOMER(Customer_ID),
    Branch_ID         BIGINT        NOT NULL REFERENCES BRANCH(Branch_ID),
    Sanctioned_By_Emp BIGINT        NOT NULL REFERENCES EMPLOYEE(Emp_ID),
    Loan_Type         VARCHAR(20)   NOT NULL,
    Principal_Amount  DECIMAL(15,2) NOT NULL,
    Interest_Rate     DECIMAL(5,2)  NOT NULL,
    Loan_Tenure       INT           NOT NULL,
    Loan_Status       VARCHAR(15)   DEFAULT 'PENDING' NOT NULL,
    Sanction_Date     DATE          DEFAULT CURRENT_DATE NOT NULL,
    Outstanding_Bal   DECIMAL(15,2)
);

-- 9. LOAN_PAYMENT
CREATE TABLE IF NOT EXISTS LOAN_PAYMENT (
    Payment_ID        BIGINT PRIMARY KEY,
    Loan_ID           BIGINT        NOT NULL REFERENCES LOAN(Loan_ID),
    Payment_Date      DATE          DEFAULT CURRENT_DATE NOT NULL,
    Amount_Paid       DECIMAL(15,2) NOT NULL,
    Remaining_Balance DECIMAL(15,2) NOT NULL,
    Payment_Mode      VARCHAR(20)   NOT NULL,
    Remarks           VARCHAR(255)
);

-- 10. CARD
CREATE TABLE IF NOT EXISTS CARD (
    Card_ID      BIGINT PRIMARY KEY,
    Card_Number  VARCHAR(20)  NOT NULL UNIQUE,
    Account_No   BIGINT       NOT NULL REFERENCES ACCOUNT(Account_No),
    Card_Type    VARCHAR(10)  NOT NULL,
    CVV_Hash     VARCHAR(255) NOT NULL,
    Issue_Date   DATE         DEFAULT CURRENT_DATE NOT NULL,
    Expiry_Date  DATE         NOT NULL,
    Card_Status  VARCHAR(12)  DEFAULT 'INACTIVE' NOT NULL
);

-- 11. AUDIT_LOG
CREATE TABLE IF NOT EXISTS AUDIT_LOG (
    Log_ID        BIGINT PRIMARY KEY,
    Account_No    BIGINT,
    Emp_ID        BIGINT,
    Action_Type   VARCHAR(50)  NOT NULL,
    Description   VARCHAR(500),
    IP_Address    VARCHAR(45),
    Log_Timestamp TIMESTAMP    DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ==============================================================================
-- SEED DATA (Idempotent MERGE / Inserts)
-- ==============================================================================

-- Users
MERGE INTO APP_USER KEY(Username) VALUES (1, 'admin', '$2a$12$R3mG5C7xo5u.SgZDv2LbWuYu9sFz.wwHetBl/Lku.nnYnaZG1aG9a', 'ADMIN', NULL, 1, CURRENT_TIMESTAMP, NULL);
MERGE INTO APP_USER KEY(Username) VALUES (2, 'manager1', '$2a$12$RZ/kA6Kq514/BQT7Di5Qx.abyl5WnX/K2UGsHxRcw7gr7Oi/7a/Ta', 'MANAGER', NULL, 1, CURRENT_TIMESTAMP, NULL);
MERGE INTO APP_USER KEY(Username) VALUES (3, 'staff1', '$2a$12$GMQlH/wcQLjO5MGRXJhrb..cfSJ2UpRjgnv8BnXrYNMAtvPtT23Eu', 'STAFF', NULL, 1, CURRENT_TIMESTAMP, NULL);

-- Banks
MERGE INTO BANK KEY(Bank_ID) VALUES (1, 'National Prosperity Bank', 'Connaught Place, New Delhi - 110001', '01123456789', 'info@npbank.in', 'www.npbank.in');
MERGE INTO BANK KEY(Bank_ID) VALUES (2, 'Coastal Commerce Bank', 'MG Road, Bangalore - 560001', '08023456789', 'info@ccbank.in', 'www.ccbank.in');

-- Branches
MERGE INTO BRANCH KEY(Branch_ID) VALUES (1, 1, 'NPB Main Branch', 'NPBK0000001', 'New Delhi', 'Delhi', '110001', 'Connaught Place', '01123456789', 'main@npbank.in');
MERGE INTO BRANCH KEY(Branch_ID) VALUES (2, 1, 'NPB Hyderabad Branch', 'NPBK0000002', 'Hyderabad', 'Telangana', '500001', 'Banjara Hills', '04023456789', 'hyd@npbank.in');
MERGE INTO BRANCH KEY(Branch_ID) VALUES (3, 2, 'CCB Bangalore Main', 'CCBK0000001', 'Bangalore', 'Karnataka', '560001', 'MG Road', '08023456789', 'blr@ccbank.in');

-- Employees
MERGE INTO EMPLOYEE KEY(Emp_ID) VALUES (1001, 1, 'Rajan', 'Mehta', 'MANAGER', 85000.00, '9876543210', 'rajan.mehta@npbank.in', DATE '2020-01-15');
MERGE INTO EMPLOYEE KEY(Emp_ID) VALUES (1002, 1, 'Priya', 'Sharma', 'LOAN_OFFICER', 65000.00, '9876543211', 'priya.sharma@npbank.in', DATE '2021-03-20');
MERGE INTO EMPLOYEE KEY(Emp_ID) VALUES (1003, 2, 'Sanjay', 'Reddy', 'MANAGER', 82000.00, '9876543212', 'sanjay.reddy@npbank.in', DATE '2019-11-10');
MERGE INTO EMPLOYEE KEY(Emp_ID) VALUES (1004, 3, 'Kavitha', 'Nair', 'MANAGER', 80000.00, '9876543213', 'kavitha.nair@ccbank.in', DATE '2022-05-01');

-- Customers
MERGE INTO CUSTOMER KEY(Customer_ID) VALUES (2001, 'Arjun', 'Kumar', 'arjun.kumar@email.com', '9800000001', DATE '1990-05-15', 'MALE', 'Sector 14 Gurgaon', 'VERIFIED', CURRENT_TIMESTAMP);
MERGE INTO CUSTOMER KEY(Customer_ID) VALUES (2002, 'Sunita', 'Patel', 'sunita.patel@email.com', '9800000002', DATE '1985-08-22', 'FEMALE', 'Navrangpura Ahmedabad', 'VERIFIED', CURRENT_TIMESTAMP);
MERGE INTO CUSTOMER KEY(Customer_ID) VALUES (2003, 'Vikram', 'Singh', 'vikram.singh@email.com', '9800000003', DATE '1978-12-10', 'MALE', 'Jubilee Hills Hyderabad', 'VERIFIED', CURRENT_TIMESTAMP);
MERGE INTO CUSTOMER KEY(Customer_ID) VALUES (2004, 'Anjali', 'Gupta', 'anjali.gupta@email.com', '9800000004', DATE '1995-03-28', 'FEMALE', 'Indiranagar Bangalore', 'PENDING', CURRENT_TIMESTAMP);
MERGE INTO CUSTOMER KEY(Customer_ID) VALUES (2005, 'Rahul', 'Verma', 'rahul.verma@email.com', '9800000005', DATE '1982-07-17', 'MALE', 'Aliganj Lucknow', 'VERIFIED', CURRENT_TIMESTAMP);

-- Accounts
MERGE INTO ACCOUNT KEY(Account_No) VALUES (100000001, 2001, 1, 'SAVINGS', 50250.00, 'ACTIVE', DATE '2023-01-10');
MERGE INTO ACCOUNT KEY(Account_No) VALUES (100000002, 2002, 1, 'CURRENT', 150000.00, 'ACTIVE', DATE '2023-02-15');
MERGE INTO ACCOUNT KEY(Account_No) VALUES (100000003, 2003, 2, 'SAVINGS', 75000.00, 'ACTIVE', DATE '2023-03-20');
MERGE INTO ACCOUNT KEY(Account_No) VALUES (100000004, 2005, 3, 'SAVINGS', 25000.00, 'ACTIVE', DATE '2023-04-05');

-- Transactions
MERGE INTO TRANSACTION KEY(Txn_ID) VALUES (5000001, 100000001, 'DEPOSIT', 10000.00, 60000.00, 'BRANCH', CURRENT_TIMESTAMP, NULL, 'Initial Deposit Seed', NULL);
MERGE INTO TRANSACTION KEY(Txn_ID) VALUES (5000002, 100000002, 'DEPOSIT', 50000.00, 150000.00, 'BRANCH', CURRENT_TIMESTAMP, NULL, 'Initial Corporate Deposit', NULL);

-- Loans
MERGE INTO LOAN KEY(Loan_ID) VALUES (3001, 2001, 1, 1002, 'HOME', 2500000.00, 8.50, 240, 'ACTIVE', DATE '2023-01-15', 2450000.00);
MERGE INTO LOAN KEY(Loan_ID) VALUES (3002, 2002, 1, 1002, 'CAR', 800000.00, 9.25, 60, 'ACTIVE', DATE '2023-02-20', 720000.00);
MERGE INTO LOAN KEY(Loan_ID) VALUES (3003, 2003, 2, 1003, 'PERSONAL', 300000.00, 12.00, 36, 'ACTIVE', DATE '2023-03-10', 250000.00);
MERGE INTO LOAN KEY(Loan_ID) VALUES (3004, 2004, 1, 1002, 'EDUCATION', 1500000.00, 7.50, 84, 'PENDING', DATE '2023-04-01', 1500000.00);
MERGE INTO LOAN KEY(Loan_ID) VALUES (3005, 2005, 3, 1004, 'BUSINESS', 5000000.00, 10.50, 120, 'ACTIVE', DATE '2023-04-10', 4800000.00);

-- Beneficiaries
MERGE INTO BENEFICIARY KEY(Beneficiary_ID) VALUES (1, 2001, '100000002', 'Sunita Patel', 'National Prosperity Bank', 'NPBK0000001', 500000.00, 1, 1, DATE '2023-01-20');
MERGE INTO BENEFICIARY KEY(Beneficiary_ID) VALUES (2, 2001, '100000003', 'Vikram Singh', 'National Prosperity Bank', 'NPBK0000002', 200000.00, 1, 1, DATE '2023-02-05');

-- Cards
MERGE INTO CARD KEY(Card_ID) VALUES (1, '4532-1000-0001-9876', 100000001, 'DEBIT', '$2a$12$R3mG5C7xo5u.SgZDv2LbWuYu9sFz.wwHetBl/Lku.nnYnaZG1aG9a', DATE '2023-01-10', DATE '2028-01-10', 'ACTIVE');
MERGE INTO CARD KEY(Card_ID) VALUES (2, '5425-2000-0002-1234', 100000002, 'CREDIT', '$2a$12$R3mG5C7xo5u.SgZDv2LbWuYu9sFz.wwHetBl/Lku.nnYnaZG1aG9a', DATE '2023-02-15', DATE '2027-02-15', 'ACTIVE');

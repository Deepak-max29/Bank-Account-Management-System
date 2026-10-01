-- ============================================================
-- BANK ACCOUNT MANAGEMENT SYSTEM - ORACLE XE 10g SCHEMA
-- College DBMS Project | All data is FICTIONAL
-- ============================================================
-- Run as SYSTEM user on Oracle XE
--
-- NON-DESTRUCTIVE & IDEMPOTENT:
--   * This script NEVER drops or deletes tables, sequences,
--     triggers or data. It only CREATES objects that are
--     missing and ADDS columns/constraints that are missing.
--   * Safe to run multiple times; existing data is preserved.
--   * Safe to run against an already-initialized database.
--
-- Execute sections in order: HELPER -> SEQUENCES -> TABLES
--   -> UPGRADE COLUMNS -> TRIGGERS -> CONSTRAINTS
-- ============================================================

-- ============================================================
-- STEP 0: HELPER PROCEDURE (ignores "already exists" errors)
--   ORA-00955 = object already exists (table/sequence)
--   ORA-01430 = column already exists
-- ============================================================
-- NOTE: role-provided privileges are disabled inside stored PL/SQL,
-- so make sure the executing account holds CREATE SEQUENCE directly
-- before creating sequences through the helper. Re-granting is a
-- harmless no-op if already granted.
GRANT CREATE SEQUENCE TO SYSTEM;

CREATE OR REPLACE PROCEDURE bank_ddl(p_sql VARCHAR2) IS
BEGIN
    EXECUTE IMMEDIATE p_sql;
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE = -955 OR SQLCODE = -1430 THEN
            NULL; -- already exists: nothing to do, keep existing object/data
        ELSE
            RAISE;
        END IF;
END;
/

-- ============================================================
-- STEP 1: SEQUENCES (created only if missing)
-- ============================================================
BEGIN bank_ddl(q'[CREATE SEQUENCE SEQ_USER_ID       START WITH 1  INCREMENT BY 1 NOCACHE NOCYCLE]'); END;
/
BEGIN bank_ddl(q'[CREATE SEQUENCE SEQ_BANK_ID       START WITH 1  INCREMENT BY 1 NOCACHE NOCYCLE]'); END;
/
BEGIN bank_ddl(q'[CREATE SEQUENCE SEQ_BRANCH_ID     START WITH 1  INCREMENT BY 1 NOCACHE NOCYCLE]'); END;
/
BEGIN bank_ddl(q'[CREATE SEQUENCE SEQ_EMP_ID        START WITH 1001 INCREMENT BY 1 NOCACHE NOCYCLE]'); END;
/
BEGIN bank_ddl(q'[CREATE SEQUENCE SEQ_CUSTOMER_ID   START WITH 2001 INCREMENT BY 1 NOCACHE NOCYCLE]'); END;
/
BEGIN bank_ddl(q'[CREATE SEQUENCE SEQ_ACCOUNT_NO    START WITH 100000001 INCREMENT BY 1 NOCACHE NOCYCLE]'); END;
/
BEGIN bank_ddl(q'[CREATE SEQUENCE SEQ_TXN_ID        START WITH 5000001 INCREMENT BY 1 NOCACHE NOCYCLE]'); END;
/
BEGIN bank_ddl(q'[CREATE SEQUENCE SEQ_BENEFICIARY_ID START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE]'); END;
/
BEGIN bank_ddl(q'[CREATE SEQUENCE SEQ_LOAN_ID       START WITH 3001 INCREMENT BY 1 NOCACHE NOCYCLE]'); END;
/
BEGIN bank_ddl(q'[CREATE SEQUENCE SEQ_PAYMENT_ID    START WITH 1  INCREMENT BY 1 NOCACHE NOCYCLE]'); END;
/
BEGIN bank_ddl(q'[CREATE SEQUENCE SEQ_CARD_ID       START WITH 1  INCREMENT BY 1 NOCACHE NOCYCLE]'); END;
/
BEGIN bank_ddl(q'[CREATE SEQUENCE SEQ_LOG_ID        START WITH 1  INCREMENT BY 1 NOCACHE NOCYCLE]'); END;
/

-- ============================================================
-- STEP 2: TABLES (created only if missing; auto-ID via triggers)
-- ============================================================

-- Entity 0: APP_USER (Application login table - NOT a 12th entity)
BEGIN bank_ddl(q'[
CREATE TABLE APP_USER (
    User_ID        NUMBER PRIMARY KEY,
    Username       VARCHAR2(50)  NOT NULL UNIQUE,
    Password_Hash  VARCHAR2(255) NOT NULL,
    Role           VARCHAR2(20)  NOT NULL,
    Emp_ID         NUMBER,
    Is_Active      NUMBER(1)     DEFAULT 1 NOT NULL,
    Created_At     DATE          DEFAULT SYSDATE NOT NULL,
    Last_Login     DATE,
    CONSTRAINT chk_user_role CHECK (Role IN ('ADMIN','STAFF','MANAGER'))
)]'); END;
/

-- Entity 1: BANK
BEGIN bank_ddl(q'[
CREATE TABLE BANK (
    Bank_ID     NUMBER PRIMARY KEY,
    Bank_Name   VARCHAR2(100) NOT NULL,
    Head_Office VARCHAR2(200) NOT NULL,
    Contact_No  VARCHAR2(15)  NOT NULL,
    Email       VARCHAR2(100) NOT NULL,
    Website     VARCHAR2(100),
    CONSTRAINT uq_bank_name    UNIQUE (Bank_Name),
    CONSTRAINT chk_bank_email  CHECK (REGEXP_LIKE(Email, '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')),
    CONSTRAINT chk_bank_phone  CHECK (REGEXP_LIKE(Contact_No, '^[0-9+\-\s]{7,15}$'))
)]'); END;
/

-- Entity 2: BRANCH
BEGIN bank_ddl(q'[
CREATE TABLE BRANCH (
    Branch_ID   NUMBER PRIMARY KEY,
    Bank_ID     NUMBER        NOT NULL,
    Branch_Name VARCHAR2(100) NOT NULL,
    IFSC_Code   VARCHAR2(15)  NOT NULL,
    City        VARCHAR2(50)  NOT NULL,
    State       VARCHAR2(50)  NOT NULL,
    Pincode     VARCHAR2(6)   NOT NULL,
    Address     VARCHAR2(255),
    Contact_Number VARCHAR2(15),
    Email       VARCHAR2(100),
    CONSTRAINT uq_branch_ifsc    UNIQUE (IFSC_Code),
    CONSTRAINT fk_branch_bank    FOREIGN KEY (Bank_ID) REFERENCES BANK(Bank_ID),
    CONSTRAINT chk_branch_pin    CHECK (REGEXP_LIKE(Pincode, '^[1-9][0-9]{5}$')),
    CONSTRAINT chk_branch_ifsc   CHECK (REGEXP_LIKE(IFSC_Code, '^[A-Z]{4}0[A-Z0-9]{6}$'))
)]'); END;
/

-- Entity 3: EMPLOYEE
BEGIN bank_ddl(q'[
CREATE TABLE EMPLOYEE (
    Emp_ID      NUMBER PRIMARY KEY,
    Branch_ID   NUMBER        NOT NULL,
    First_Name  VARCHAR2(50)  NOT NULL,
    Last_Name   VARCHAR2(50)  NOT NULL,
    Designation VARCHAR2(50)  NOT NULL,
    Salary      NUMBER(12,2)  NOT NULL,
    Phone       VARCHAR2(15)  NOT NULL,
    Email       VARCHAR2(100) NOT NULL UNIQUE,
    Join_Date   DATE,
    CONSTRAINT fk_emp_branch    FOREIGN KEY (Branch_ID) REFERENCES BRANCH(Branch_ID),
    CONSTRAINT chk_emp_salary   CHECK (Salary >= 0),
    CONSTRAINT chk_emp_phone    CHECK (REGEXP_LIKE(Phone, '^[0-9+\-\s]{7,15}$')),
    CONSTRAINT chk_emp_email    CHECK (REGEXP_LIKE(Email, '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')),
    CONSTRAINT chk_emp_desig    CHECK (Designation IN (
        'MANAGER','LOAN_OFFICER','TELLER','CLERK','SECURITY','IT_OFFICER','ACCOUNTANT','ASSISTANT_MANAGER'
    ))
)]'); END;
/

-- Entity 4: CUSTOMER
BEGIN bank_ddl(q'[
CREATE TABLE CUSTOMER (
    Customer_ID NUMBER PRIMARY KEY,
    First_Name  VARCHAR2(50)  NOT NULL,
    Last_Name   VARCHAR2(50)  NOT NULL,
    Email       VARCHAR2(100) NOT NULL UNIQUE,
    Phone       VARCHAR2(15)  NOT NULL,
    DOB         DATE          NOT NULL,
    Gender      VARCHAR2(10),
    Address     VARCHAR2(255),
    KYC_Status  VARCHAR2(10)  DEFAULT 'PENDING' NOT NULL,
    Created_At  DATE          DEFAULT SYSDATE NOT NULL,
    CONSTRAINT chk_cust_kyc    CHECK (KYC_Status IN ('PENDING','VERIFIED','REJECTED')),
    CONSTRAINT chk_cust_email  CHECK (REGEXP_LIKE(Email, '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')),
    CONSTRAINT chk_cust_phone  CHECK (REGEXP_LIKE(Phone, '^[0-9+\-\s]{7,15}$')),
    CONSTRAINT chk_cust_gender CHECK (Gender IN ('MALE','FEMALE','OTHER') OR Gender IS NULL)
)]'); END;
/

-- Entity 5: ACCOUNT
BEGIN bank_ddl(q'[
CREATE TABLE ACCOUNT (
    Account_No    NUMBER PRIMARY KEY,
    Customer_ID   NUMBER         NOT NULL,
    Branch_ID     NUMBER         NOT NULL,
    Account_Type  VARCHAR2(10)   NOT NULL,
    Balance       NUMBER(15,2)   DEFAULT 0 NOT NULL,
    Status        VARCHAR2(10)   DEFAULT 'ACTIVE' NOT NULL,
    Opened_Date   DATE           DEFAULT SYSDATE NOT NULL,
    CONSTRAINT fk_acc_customer   FOREIGN KEY (Customer_ID) REFERENCES CUSTOMER(Customer_ID),
    CONSTRAINT fk_acc_branch     FOREIGN KEY (Branch_ID)   REFERENCES BRANCH(Branch_ID),
    CONSTRAINT chk_acc_type      CHECK (Account_Type IN ('SAVINGS','CURRENT')),
    CONSTRAINT chk_acc_status    CHECK (Status IN ('ACTIVE','FROZEN','CLOSED')),
    CONSTRAINT chk_acc_balance   CHECK (Balance >= 0)
)]'); END;
/

-- Entity 6: TRANSACTION
BEGIN bank_ddl(q'[
CREATE TABLE TRANSACTION (
    Txn_ID        NUMBER PRIMARY KEY,
    Account_No    NUMBER         NOT NULL,
    Txn_Type      VARCHAR2(15)   NOT NULL,
    Amount        NUMBER(15,2)   NOT NULL,
    Balance_After NUMBER(15,2)   NOT NULL,
    Channel       VARCHAR2(15)   NOT NULL,
    Txn_Date      DATE           DEFAULT SYSDATE NOT NULL,
    Ref_Txn_ID    NUMBER,
    Remarks       VARCHAR2(255),
    Idempotency_Key VARCHAR2(64),
    CONSTRAINT fk_txn_account    FOREIGN KEY (Account_No) REFERENCES ACCOUNT(Account_No),
    CONSTRAINT chk_txn_type      CHECK (Txn_Type IN ('DEPOSIT','WITHDRAWAL','TRANSFER_DEBIT','TRANSFER_CREDIT')),
    CONSTRAINT chk_txn_channel   CHECK (Channel IN ('ATM','UPI','NETBANKING','BRANCH','SYSTEM')),
    CONSTRAINT chk_txn_amount    CHECK (Amount > 0),
    CONSTRAINT chk_txn_bal       CHECK (Balance_After >= 0)
)]'); END;
/

-- Entity 7: BENEFICIARY
BEGIN bank_ddl(q'[
CREATE TABLE BENEFICIARY (
    Beneficiary_ID   NUMBER PRIMARY KEY,
    Customer_ID      NUMBER        NOT NULL,
    Beneficiary_Acc_No VARCHAR2(20) NOT NULL,
    Beneficiary_Name VARCHAR2(100) NOT NULL,
    Bank_Name        VARCHAR2(100) NOT NULL,
    IFSC_Code        VARCHAR2(15)  NOT NULL,
    Max_Limit        NUMBER(15,2)  DEFAULT 100000 NOT NULL,
    Is_Verified      NUMBER(1)     DEFAULT 0 NOT NULL,
    Is_Active        NUMBER(1)     DEFAULT 1 NOT NULL,
    Added_Date       DATE          DEFAULT SYSDATE NOT NULL,
    CONSTRAINT fk_ben_customer   FOREIGN KEY (Customer_ID) REFERENCES CUSTOMER(Customer_ID),
    CONSTRAINT chk_ben_limit     CHECK (Max_Limit > 0),
    CONSTRAINT chk_ben_verified  CHECK (Is_Verified IN (0,1)),
    CONSTRAINT chk_ben_active    CHECK (Is_Active IN (0,1)),
    CONSTRAINT chk_ben_ifsc      CHECK (REGEXP_LIKE(IFSC_Code, '^[A-Z]{4}0[A-Z0-9]{6}$'))
)]'); END;
/

-- Entity 8: LOAN
BEGIN bank_ddl(q'[
CREATE TABLE LOAN (
    Loan_ID           NUMBER PRIMARY KEY,
    Customer_ID       NUMBER         NOT NULL,
    Branch_ID         NUMBER         NOT NULL,
    Sanctioned_By_Emp NUMBER         NOT NULL,
    Loan_Type         VARCHAR2(20)   NOT NULL,
    Principal_Amount  NUMBER(15,2)   NOT NULL,
    Interest_Rate     NUMBER(5,2)    NOT NULL,
    Loan_Tenure       NUMBER(3)      NOT NULL,
    Loan_Status       VARCHAR2(15)   DEFAULT 'PENDING' NOT NULL,
    Sanction_Date     DATE           DEFAULT SYSDATE NOT NULL,
    Outstanding_Bal   NUMBER(15,2),
    CONSTRAINT fk_loan_customer  FOREIGN KEY (Customer_ID) REFERENCES CUSTOMER(Customer_ID),
    CONSTRAINT fk_loan_branch    FOREIGN KEY (Branch_ID)   REFERENCES BRANCH(Branch_ID),
    CONSTRAINT fk_loan_emp       FOREIGN KEY (Sanctioned_By_Emp) REFERENCES EMPLOYEE(Emp_ID),
    CONSTRAINT chk_loan_type     CHECK (Loan_Type IN ('HOME','CAR','EDUCATION','PERSONAL','BUSINESS')),
    CONSTRAINT chk_loan_status   CHECK (Loan_Status IN ('PENDING','ACTIVE','CLOSED','REJECTED','DEFAULTED')),
    CONSTRAINT chk_loan_amount   CHECK (Principal_Amount > 0),
    CONSTRAINT chk_loan_rate     CHECK (Interest_Rate > 0),
    CONSTRAINT chk_loan_tenure   CHECK (Loan_Tenure > 0),
    CONSTRAINT chk_loan_obal     CHECK (Outstanding_Bal >= 0 OR Outstanding_Bal IS NULL)
)]'); END;
/

-- Entity 9: LOAN_PAYMENT
BEGIN bank_ddl(q'[
CREATE TABLE LOAN_PAYMENT (
    Payment_ID        NUMBER PRIMARY KEY,
    Loan_ID           NUMBER        NOT NULL,
    Payment_Date      DATE          DEFAULT SYSDATE NOT NULL,
    Amount_Paid       NUMBER(15,2)  NOT NULL,
    Remaining_Balance NUMBER(15,2)  NOT NULL,
    Payment_Mode      VARCHAR2(20)  NOT NULL,
    Remarks           VARCHAR2(255),
    CONSTRAINT fk_lpay_loan      FOREIGN KEY (Loan_ID) REFERENCES LOAN(Loan_ID),
    CONSTRAINT chk_lpay_amount   CHECK (Amount_Paid > 0),
    CONSTRAINT chk_lpay_remain   CHECK (Remaining_Balance >= 0),
    CONSTRAINT chk_lpay_mode     CHECK (Payment_Mode IN ('CASH','CHEQUE','ONLINE','EMI','AUTO_DEBIT'))
)]'); END;
/

-- Entity 10: CARD
BEGIN bank_ddl(q'[
CREATE TABLE CARD (
    Card_ID      NUMBER PRIMARY KEY,
    Card_Number  VARCHAR2(20) NOT NULL UNIQUE,
    Account_No   NUMBER       NOT NULL,
    Card_Type    VARCHAR2(10) NOT NULL,
    CVV_Hash     VARCHAR2(255) NOT NULL,
    Issue_Date   DATE         DEFAULT SYSDATE NOT NULL,
    Expiry_Date  DATE         NOT NULL,
    Card_Status  VARCHAR2(12) DEFAULT 'INACTIVE' NOT NULL,
    CONSTRAINT fk_card_account   FOREIGN KEY (Account_No) REFERENCES ACCOUNT(Account_No),
    CONSTRAINT chk_card_type     CHECK (Card_Type IN ('DEBIT','CREDIT')),
    CONSTRAINT chk_card_status   CHECK (Card_Status IN ('ACTIVE','INACTIVE','BLOCKED','EXPIRED')),
    CONSTRAINT chk_card_expiry   CHECK (Expiry_Date > Issue_Date)
)]'); END;
/

-- Entity 11: AUDIT_LOG
-- Canonical columns: LOG_ID, ACCOUNT_NO, EMP_ID, ACTION_TYPE,
--                    DESCRIPTION, IP_ADDRESS, LOG_TIMESTAMP
BEGIN bank_ddl(q'[
CREATE TABLE AUDIT_LOG (
    Log_ID      NUMBER PRIMARY KEY,
    Account_No  NUMBER,
    Emp_ID      NUMBER,
    Action_Type VARCHAR2(50)  NOT NULL,
    Description VARCHAR2(500),
    IP_Address  VARCHAR2(45),
    Log_Timestamp DATE        DEFAULT SYSDATE NOT NULL,
    CONSTRAINT fk_log_account    FOREIGN KEY (Account_No) REFERENCES ACCOUNT(Account_No),
    CONSTRAINT fk_log_emp        FOREIGN KEY (Emp_ID)     REFERENCES EMPLOYEE(Emp_ID)
)]'); END;
/

-- ============================================================
-- STEP 3: UPGRADE COLUMNS FOR EXISTING INSTALLATIONS
--   (non-destructive: only ADDs columns that are missing)
-- ============================================================
BEGIN bank_ddl(q'[ALTER TABLE BANK ADD (Website VARCHAR2(100))]'); END;
/
BEGIN bank_ddl(q'[ALTER TABLE BRANCH ADD (Address VARCHAR2(255))]'); END;
/
BEGIN bank_ddl(q'[ALTER TABLE BRANCH ADD (Contact_Number VARCHAR2(15))]'); END;
/
BEGIN bank_ddl(q'[ALTER TABLE BRANCH ADD (Email VARCHAR2(100))]'); END;
/
BEGIN bank_ddl(q'[ALTER TABLE CUSTOMER ADD (Gender VARCHAR2(10))]'); END;
/
BEGIN bank_ddl(q'[ALTER TABLE CUSTOMER ADD (Address VARCHAR2(255))]'); END;
/
BEGIN bank_ddl(q'[ALTER TABLE EMPLOYEE ADD (Join_Date DATE)]'); END;
/
BEGIN bank_ddl(q'[ALTER TABLE LOAN_PAYMENT ADD (Remarks VARCHAR2(255))]'); END;
/
BEGIN bank_ddl(q'[ALTER TABLE TRANSACTION ADD (Idempotency_Key VARCHAR2(64))]'); END;
/

-- ============================================================
-- STEP 4: TRIGGERS FOR AUTO-ID GENERATION (idempotent)
-- ============================================================
CREATE OR REPLACE TRIGGER TRG_BANK_ID
BEFORE INSERT ON BANK
FOR EACH ROW
WHEN (NEW.Bank_ID IS NULL)
BEGIN
    SELECT SEQ_BANK_ID.NEXTVAL INTO :NEW.Bank_ID FROM DUAL;
END;
/

CREATE OR REPLACE TRIGGER TRG_BRANCH_ID
BEFORE INSERT ON BRANCH
FOR EACH ROW
WHEN (NEW.Branch_ID IS NULL)
BEGIN
    SELECT SEQ_BRANCH_ID.NEXTVAL INTO :NEW.Branch_ID FROM DUAL;
END;
/

CREATE OR REPLACE TRIGGER TRG_EMP_ID
BEFORE INSERT ON EMPLOYEE
FOR EACH ROW
WHEN (NEW.Emp_ID IS NULL)
BEGIN
    SELECT SEQ_EMP_ID.NEXTVAL INTO :NEW.Emp_ID FROM DUAL;
END;
/

CREATE OR REPLACE TRIGGER TRG_CUSTOMER_ID
BEFORE INSERT ON CUSTOMER
FOR EACH ROW
WHEN (NEW.Customer_ID IS NULL)
BEGIN
    SELECT SEQ_CUSTOMER_ID.NEXTVAL INTO :NEW.Customer_ID FROM DUAL;
END;
/

CREATE OR REPLACE TRIGGER TRG_ACCOUNT_NO
BEFORE INSERT ON ACCOUNT
FOR EACH ROW
WHEN (NEW.Account_No IS NULL)
BEGIN
    SELECT SEQ_ACCOUNT_NO.NEXTVAL INTO :NEW.Account_No FROM DUAL;
END;
/

CREATE OR REPLACE TRIGGER TRG_TXN_ID
BEFORE INSERT ON TRANSACTION
FOR EACH ROW
WHEN (NEW.Txn_ID IS NULL)
BEGIN
    SELECT SEQ_TXN_ID.NEXTVAL INTO :NEW.Txn_ID FROM DUAL;
END;
/

CREATE OR REPLACE TRIGGER TRG_BENEFICIARY_ID
BEFORE INSERT ON BENEFICIARY
FOR EACH ROW
WHEN (NEW.Beneficiary_ID IS NULL)
BEGIN
    SELECT SEQ_BENEFICIARY_ID.NEXTVAL INTO :NEW.Beneficiary_ID FROM DUAL;
END;
/

CREATE OR REPLACE TRIGGER TRG_LOAN_ID
BEFORE INSERT ON LOAN
FOR EACH ROW
WHEN (NEW.Loan_ID IS NULL)
BEGIN
    SELECT SEQ_LOAN_ID.NEXTVAL INTO :NEW.Loan_ID FROM DUAL;
END;
/

CREATE OR REPLACE TRIGGER TRG_PAYMENT_ID
BEFORE INSERT ON LOAN_PAYMENT
FOR EACH ROW
WHEN (NEW.Payment_ID IS NULL)
BEGIN
    SELECT SEQ_PAYMENT_ID.NEXTVAL INTO :NEW.Payment_ID FROM DUAL;
END;
/

CREATE OR REPLACE TRIGGER TRG_CARD_ID
BEFORE INSERT ON CARD
FOR EACH ROW
WHEN (NEW.Card_ID IS NULL)
BEGIN
    SELECT SEQ_CARD_ID.NEXTVAL INTO :NEW.Card_ID FROM DUAL;
END;
/

CREATE OR REPLACE TRIGGER TRG_LOG_ID
BEFORE INSERT ON AUDIT_LOG
FOR EACH ROW
WHEN (NEW.Log_ID IS NULL)
BEGIN
    SELECT SEQ_LOG_ID.NEXTVAL INTO :NEW.Log_ID FROM DUAL;
END;
/

CREATE OR REPLACE TRIGGER TRG_USER_ID
BEFORE INSERT ON APP_USER
FOR EACH ROW
WHEN (NEW.User_ID IS NULL)
BEGIN
    SELECT SEQ_USER_ID.NEXTVAL INTO :NEW.User_ID FROM DUAL;
END;
/

-- ============================================================
-- STEP 5: AUDIT_LOG ACTION CONSTRAINT
--   Widened to include every action type the application writes
--   (existing rows are never validated retroactively)
-- ============================================================
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE AUDIT_LOG DROP CONSTRAINT chk_log_action';
EXCEPTION
    WHEN OTHERS THEN NULL; -- constraint not present yet
END;
/
BEGIN bank_ddl(q'[ALTER TABLE AUDIT_LOG ADD CONSTRAINT chk_log_action CHECK (Action_Type IN (
    'LOGIN','LOGOUT','LOGIN_FAILED',
    'ACCOUNT_OPENED','ACCOUNT_UPDATED','ACCOUNT_CLOSED','ACCOUNT_FROZEN',
    'OPEN_ACCOUNT','ACCOUNT_STATUS_CHANGE',
    'DEPOSIT','WITHDRAWAL','TRANSFER','TRANSFER_DEBIT','TRANSFER_CREDIT',
    'LOAN_APPLIED','LOAN_APPROVED','LOAN_REJECTED','LOAN_PAYMENT',
    'APPLY_LOAN','APPROVE_LOAN','REJECT_LOAN',
    'CARD_ISSUED','CARD_ACTIVATED','CARD_BLOCKED','CARD_EXPIRED',
    'ISSUE_CARD','ACTIVATE_CARD','BLOCK_CARD','DEACTIVATE_CARD','EXPIRE_CARD',
    'CUSTOMER_CREATED','CUSTOMER_UPDATED','KYC_UPDATED',
    'CREATE_CUSTOMER','UPDATE_CUSTOMER','UPDATE_KYC',
    'BENEFICIARY_ADDED','BENEFICIARY_VERIFIED','BENEFICIARY_DEACTIVATED',
    'ADD_BENEFICIARY','UPDATE_BENEFICIARY','VERIFY_BENEFICIARY','DEACTIVATE_BENEFICIARY',
    'EMPLOYEE_CREATED','EMPLOYEE_UPDATED','SALARY_CHANGED',
    'CREATE_EMPLOYEE','UPDATE_EMPLOYEE','SALARY_CHANGE',
    'BANK_CREATED','CREATE_BANK','UPDATE_BANK','DELETE_BANK',
    'BRANCH_CREATED','CREATE_BRANCH','UPDATE_BRANCH','DELETE_BRANCH',
    'CSV_IMPORT','CSV_EXPORT','UNAUTHORIZED_ACCESS'
))]'); END;
/

-- Optional gender check for existing installs (added at table level for fresh installs)
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE CUSTOMER DROP CONSTRAINT chk_cust_gender';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/
BEGIN bank_ddl(q'[ALTER TABLE CUSTOMER ADD CONSTRAINT chk_cust_gender CHECK (Gender IN ('MALE','FEMALE','OTHER') OR Gender IS NULL)]'); END;
/

-- ============================================================
-- STEP 6: CLEAN UP HELPER (keeps schema tidy)
-- ============================================================
BEGIN
    EXECUTE IMMEDIATE 'DROP PROCEDURE bank_ddl';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

COMMIT;

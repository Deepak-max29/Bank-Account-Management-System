-- ============================================================
-- INDEXES FOR PERFORMANCE
-- Non-destructive & idempotent: re-running skips existing indexes.
-- ============================================================

-- Helper: ignore "already exists" (-955) and "column list already
-- indexed" (-1408, e.g. UNIQUE constraint already covers it)
CREATE OR REPLACE PROCEDURE bank_idx(p_sql VARCHAR2) IS
BEGIN
    EXECUTE IMMEDIATE p_sql;
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE = -955 OR SQLCODE = -1408 THEN NULL; ELSE RAISE; END IF;
END;
/

-- BRANCH indexes
BEGIN bank_idx(q'[CREATE INDEX idx_branch_bank_id   ON BRANCH(Bank_ID)]'); END;
/
BEGIN bank_idx(q'[CREATE INDEX idx_branch_city      ON BRANCH(City)]'); END;
/

-- EMPLOYEE indexes
BEGIN bank_idx(q'[CREATE INDEX idx_emp_branch_id    ON EMPLOYEE(Branch_ID)]'); END;
/
BEGIN bank_idx(q'[CREATE INDEX idx_emp_designation  ON EMPLOYEE(Designation)]'); END;
/

-- ACCOUNT indexes
BEGIN bank_idx(q'[CREATE INDEX idx_acc_customer_id  ON ACCOUNT(Customer_ID)]'); END;
/
BEGIN bank_idx(q'[CREATE INDEX idx_acc_branch_id    ON ACCOUNT(Branch_ID)]'); END;
/
BEGIN bank_idx(q'[CREATE INDEX idx_acc_status       ON ACCOUNT(Status)]'); END;
/
BEGIN bank_idx(q'[CREATE INDEX idx_acc_type         ON ACCOUNT(Account_Type)]'); END;
/

-- TRANSACTION indexes
BEGIN bank_idx(q'[CREATE INDEX idx_txn_account_no   ON TRANSACTION(Account_No)]'); END;
/
BEGIN bank_idx(q'[CREATE INDEX idx_txn_date         ON TRANSACTION(Txn_Date)]'); END;
/
BEGIN bank_idx(q'[CREATE INDEX idx_txn_type         ON TRANSACTION(Txn_Type)]'); END;
/
BEGIN bank_idx(q'[CREATE INDEX idx_txn_ref_id       ON TRANSACTION(Ref_Txn_ID)]'); END;
/
BEGIN bank_idx(q'[CREATE INDEX idx_txn_idem_key    ON TRANSACTION(Idempotency_Key)]'); END;
/

-- BENEFICIARY indexes
BEGIN bank_idx(q'[CREATE INDEX idx_ben_customer_id  ON BENEFICIARY(Customer_ID)]'); END;
/

-- LOAN indexes
BEGIN bank_idx(q'[CREATE INDEX idx_loan_customer_id ON LOAN(Customer_ID)]'); END;
/
BEGIN bank_idx(q'[CREATE INDEX idx_loan_branch_id   ON LOAN(Branch_ID)]'); END;
/
BEGIN bank_idx(q'[CREATE INDEX idx_loan_emp_id      ON LOAN(Sanctioned_By_Emp)]'); END;
/
BEGIN bank_idx(q'[CREATE INDEX idx_loan_status      ON LOAN(Loan_Status)]'); END;
/

-- LOAN_PAYMENT indexes
BEGIN bank_idx(q'[CREATE INDEX idx_lpay_loan_id     ON LOAN_PAYMENT(Loan_ID)]'); END;
/
BEGIN bank_idx(q'[CREATE INDEX idx_lpay_date        ON LOAN_PAYMENT(Payment_Date)]'); END;
/

-- CARD indexes
BEGIN bank_idx(q'[CREATE INDEX idx_card_account_no  ON CARD(Account_No)]'); END;
/
BEGIN bank_idx(q'[CREATE INDEX idx_card_status      ON CARD(Card_Status)]'); END;
/

-- AUDIT_LOG indexes
BEGIN bank_idx(q'[CREATE INDEX idx_log_account_no   ON AUDIT_LOG(Account_No)]'); END;
/
BEGIN bank_idx(q'[CREATE INDEX idx_log_emp_id       ON AUDIT_LOG(Emp_ID)]'); END;
/
BEGIN bank_idx(q'[CREATE INDEX idx_log_timestamp    ON AUDIT_LOG(Log_Timestamp)]'); END;
/
BEGIN bank_idx(q'[CREATE INDEX idx_log_action       ON AUDIT_LOG(Action_Type)]'); END;
/

-- APP_USER indexes
-- (Username is already indexed by its UNIQUE constraint)
BEGIN bank_idx(q'[CREATE INDEX idx_user_emp_id      ON APP_USER(Emp_ID)]'); END;
/

-- Cleanup helper
BEGIN
    EXECUTE IMMEDIATE 'DROP PROCEDURE bank_idx';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

COMMIT;

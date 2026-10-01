-- ============================================================
-- BANK ACCOUNT MANAGEMENT SYSTEM - ADDITIONAL CONSTRAINTS
-- ============================================================
-- Run AFTER schema.sql
-- Non-destructive & idempotent: re-running skips existing constraints.
-- ============================================================

CREATE OR REPLACE PROCEDURE bank_con(p_sql VARCHAR2) IS
BEGIN
    EXECUTE IMMEDIATE p_sql;
EXCEPTION
    WHEN OTHERS THEN
        -- -2275: constraint already exists
        IF SQLCODE = -2275 OR SQLCODE = -2264 OR SQLCODE = -2261 THEN NULL; ELSE RAISE; END IF;
END;
/

-- APP_USER foreign key to EMPLOYEE (optional link)
-- Not added inline in schema.sql because EMPLOYEE is created after APP_USER
BEGIN bank_con(q'[ALTER TABLE APP_USER ADD CONSTRAINT fk_user_emp FOREIGN KEY (Emp_ID) REFERENCES EMPLOYEE(Emp_ID)]'); END;
/

-- Ensure TRANSACTION.Ref_Txn_ID references a valid transaction
-- (Self-referential FK for transfer linkage)
BEGIN bank_con(q'[ALTER TABLE TRANSACTION ADD CONSTRAINT fk_txn_ref FOREIGN KEY (Ref_Txn_ID) REFERENCES TRANSACTION(Txn_ID)]'); END;
/

-- Ensure at least one ADMIN user always exists (enforced at application level)
-- Oracle does not support CHECK constraints that query other tables

-- Cleanup helper
BEGIN
    EXECUTE IMMEDIATE 'DROP PROCEDURE bank_con';
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
/

COMMIT;

-- Add CUSTOMER_ID column to APP_USER
ALTER TABLE APP_USER ADD (Customer_ID NUMBER);

-- Add FK constraint to CUSTOMER table
ALTER TABLE APP_USER ADD CONSTRAINT fk_user_customer FOREIGN KEY (Customer_ID) REFERENCES CUSTOMER(Customer_ID);

-- Drop old role constraint and add new one including CUSTOMER
ALTER TABLE APP_USER DROP CONSTRAINT chk_user_role;
ALTER TABLE APP_USER ADD CONSTRAINT chk_user_role CHECK (Role IN ('ADMIN','STAFF','MANAGER','CUSTOMER'));

-- Create sample customer logins (BCrypt hash of 'customer123')
-- BCrypt 12 rounds hash for 'customer123' = '$2a$12$LJ6czp0hFH3JLp7uPXxeJeJ4FQKVyxR8eCqLz8D9N6qKzXgxmKqFm'
INSERT INTO APP_USER (Username, Password_Hash, Role, Customer_ID, Is_Active)
SELECT 'arjun.kumar', '$2a$12$LJ6czp0hFH3JLp7uPXxeJeJ4FQKVyxR8eCqLz8D9N6qKzXgxmKqFm', 'CUSTOMER',
  (SELECT Customer_ID FROM CUSTOMER WHERE Email = 'arjun.kumar@email.com'), 1
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM APP_USER WHERE Username = 'arjun.kumar');

INSERT INTO APP_USER (Username, Password_Hash, Role, Customer_ID, Is_Active)
SELECT 'sunita.patel', '$2a$12$LJ6czp0hFH3JLp7uPXxeJeJ4FQKVyxR8eCqLz8D9N6qKzXgxmKqFm', 'CUSTOMER',
  (SELECT Customer_ID FROM CUSTOMER WHERE Email = 'sunita.patel@email.com'), 1
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM APP_USER WHERE Username = 'sunita.patel');

COMMIT;

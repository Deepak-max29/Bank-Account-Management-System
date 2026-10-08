package com.bank.repository;

import com.bank.model.AuditLog;
import com.bank.model.Transaction;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public class DashboardRepository {

    private final JdbcTemplate jdbcTemplate;
    private final TransactionRepository transactionRepository;
    private final AuditLogRepository auditLogRepository;

    public DashboardRepository(JdbcTemplate jdbcTemplate, TransactionRepository transactionRepository, AuditLogRepository auditLogRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.transactionRepository = transactionRepository;
        this.auditLogRepository = auditLogRepository;
    }

    public Long getTotalCustomers() {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM CUSTOMER", Long.class);
    }

    public Long getActiveAccounts() {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM ACCOUNT WHERE STATUS = 'ACTIVE'", Long.class);
    }

    public Long getTotalBranches() {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM BRANCH", Long.class);
    }

    public Long getTransactionCount() {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM TRANSACTION", Long.class);
    }

    public Long getLoanCount() {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM LOAN", Long.class);
    }

    public BigDecimal getTotalDeposits() {
        return jdbcTemplate.queryForObject("SELECT NVL(SUM(AMOUNT), 0) FROM TRANSACTION WHERE TXN_TYPE = 'DEPOSIT'", BigDecimal.class);
    }

    public BigDecimal getTotalWithdrawals() {
        return jdbcTemplate.queryForObject("SELECT NVL(SUM(AMOUNT), 0) FROM TRANSACTION WHERE TXN_TYPE = 'WITHDRAWAL'", BigDecimal.class);
    }

    public List<Transaction> getRecentTransactions(int limit) {
        return transactionRepository.findRecent(limit);
    }

    public List<AuditLog> getRecentAuditLogs(int limit) {
        return auditLogRepository.findRecent(limit);
    }

    public Long getActiveAccountsByCustomer(Long customerId) {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM ACCOUNT WHERE CUSTOMER_ID = ? AND STATUS = 'ACTIVE'", Long.class, customerId);
    }

    public Long getTransactionCountByCustomer(Long customerId) {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(T.TXN_ID) FROM TRANSACTION T JOIN ACCOUNT A ON T.ACCOUNT_NO = A.ACCOUNT_NO WHERE A.CUSTOMER_ID = ?",
                Long.class, customerId);
    }

    public Long getLoanCountByCustomer(Long customerId) {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM LOAN WHERE CUSTOMER_ID = ? AND LOAN_STATUS = 'ACTIVE'", Long.class, customerId);
    }

    public BigDecimal getTotalBalanceByCustomer(Long customerId) {
        return jdbcTemplate.queryForObject("SELECT NVL(SUM(BALANCE), 0) FROM ACCOUNT WHERE CUSTOMER_ID = ? AND STATUS = 'ACTIVE'", BigDecimal.class, customerId);
    }

    public BigDecimal getTotalWithdrawalsByCustomer(Long customerId) {
        return jdbcTemplate.queryForObject(
                "SELECT NVL(SUM(T.AMOUNT), 0) FROM TRANSACTION T JOIN ACCOUNT A ON T.ACCOUNT_NO = A.ACCOUNT_NO WHERE A.CUSTOMER_ID = ? AND T.TXN_TYPE = 'WITHDRAWAL'",
                BigDecimal.class, customerId);
    }

    public List<Transaction> getRecentTransactionsByCustomer(Long customerId, int limit) {
        return transactionRepository.findRecentByCustomerId(customerId, limit);
    }
}

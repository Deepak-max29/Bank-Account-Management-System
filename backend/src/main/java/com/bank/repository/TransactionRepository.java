package com.bank.repository;

import com.bank.model.Transaction;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public class TransactionRepository {

    private final JdbcTemplate jdbcTemplate;

    public TransactionRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Transaction> transactionRowMapper = (rs, rowNum) -> {
        Transaction txn = Transaction.builder()
                .txnId(rs.getLong("TXN_ID"))
                .accountNo(rs.getLong("ACCOUNT_NO"))
                .txnType(rs.getString("TXN_TYPE"))
                .amount(rs.getBigDecimal("AMOUNT"))
                .balanceAfter(rs.getBigDecimal("BALANCE_AFTER"))
                .channel(rs.getString("CHANNEL"))
                .txnDate(rs.getTimestamp("TXN_DATE") != null ? rs.getTimestamp("TXN_DATE").toLocalDateTime() : null)
                .refTxnId(rs.getObject("REF_TXN_ID") != null ? rs.getLong("REF_TXN_ID") : null)
                .remarks(rs.getString("REMARKS"))
                .customerName(rs.getString("FIRST_NAME") + " " + rs.getString("LAST_NAME"))
                .accountHolderName(rs.getString("FIRST_NAME") + " " + rs.getString("LAST_NAME"))
                .build();
        try {
            txn.setIdempotencyKey(rs.getString("IDEMPOTENCY_KEY"));
        } catch (Exception ignored) {
            // Column not present yet (older schema) - ignore
        }
        return txn;
    };

    public Transaction save(Transaction transaction) {
        Long id = jdbcTemplate.queryForObject("SELECT SEQ_TXN_ID.NEXTVAL FROM DUAL", Long.class);
        jdbcTemplate.update(
                "INSERT INTO TRANSACTION (TXN_ID, ACCOUNT_NO, TXN_TYPE, AMOUNT, BALANCE_AFTER, CHANNEL, TXN_DATE, REF_TXN_ID, REMARKS, IDEMPOTENCY_KEY) VALUES (?, ?, ?, ?, ?, ?, SYSDATE, ?, ?, ?)",
                id, transaction.getAccountNo(), transaction.getTxnType(), transaction.getAmount(), transaction.getBalanceAfter(), transaction.getChannel(), transaction.getRefTxnId(), transaction.getRemarks(), transaction.getIdempotencyKey());
        transaction.setTxnId(id);
        return transaction;
    }

    /**
     * Looks up a previously processed request by its idempotency key.
     * Used to make transfers safe to retry (same key => no double debit).
     */
    public Optional<Transaction> findByIdempotencyKey(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return Optional.empty();
        }
        List<Transaction> found = jdbcTemplate.query(
                "SELECT T.*, C.FIRST_NAME, C.LAST_NAME FROM TRANSACTION T JOIN ACCOUNT A ON T.ACCOUNT_NO = A.ACCOUNT_NO JOIN CUSTOMER C ON A.CUSTOMER_ID = C.CUSTOMER_ID WHERE T.IDEMPOTENCY_KEY = ? AND ROWNUM = 1",
                transactionRowMapper, idempotencyKey);
        return found.stream().findFirst();
    }

    public Optional<Transaction> findById(Long id) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(
                    "SELECT T.*, C.FIRST_NAME, C.LAST_NAME FROM TRANSACTION T JOIN ACCOUNT A ON T.ACCOUNT_NO = A.ACCOUNT_NO JOIN CUSTOMER C ON A.CUSTOMER_ID = C.CUSTOMER_ID WHERE T.TXN_ID = ?",
                    transactionRowMapper, id));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<Transaction> findByAccountNo(Long accountNo) {
        return jdbcTemplate.query(
                "SELECT T.*, C.FIRST_NAME, C.LAST_NAME FROM TRANSACTION T JOIN ACCOUNT A ON T.ACCOUNT_NO = A.ACCOUNT_NO JOIN CUSTOMER C ON A.CUSTOMER_ID = C.CUSTOMER_ID WHERE T.ACCOUNT_NO = ? ORDER BY T.TXN_DATE DESC",
                transactionRowMapper, accountNo);
    }

    public int count() {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM TRANSACTION", Integer.class);
    }

    public List<Transaction> findByAccountNoAndDateRange(Long accountNo, LocalDate start, LocalDate end) {
        return jdbcTemplate.query(
                "SELECT T.*, C.FIRST_NAME, C.LAST_NAME FROM TRANSACTION T JOIN ACCOUNT A ON T.ACCOUNT_NO = A.ACCOUNT_NO JOIN CUSTOMER C ON A.CUSTOMER_ID = C.CUSTOMER_ID WHERE T.ACCOUNT_NO = ? AND TRUNC(T.TXN_DATE) >= ? AND TRUNC(T.TXN_DATE) <= ? ORDER BY T.TXN_DATE DESC",
                transactionRowMapper, accountNo, start, end);
    }

    public List<Transaction> findByType(String txnType) {
        return jdbcTemplate.query(
                "SELECT T.*, C.FIRST_NAME, C.LAST_NAME FROM TRANSACTION T JOIN ACCOUNT A ON T.ACCOUNT_NO = A.ACCOUNT_NO JOIN CUSTOMER C ON A.CUSTOMER_ID = C.CUSTOMER_ID WHERE T.TXN_TYPE = ? ORDER BY T.TXN_DATE DESC",
                transactionRowMapper, txnType);
    }

    public List<Transaction> findRecent(int limit) {
        return jdbcTemplate.query(
                "SELECT * FROM (SELECT T.*, C.FIRST_NAME, C.LAST_NAME FROM TRANSACTION T JOIN ACCOUNT A ON T.ACCOUNT_NO = A.ACCOUNT_NO JOIN CUSTOMER C ON A.CUSTOMER_ID = C.CUSTOMER_ID ORDER BY T.TXN_DATE DESC) WHERE ROWNUM <= ?",
                transactionRowMapper, limit);
    }

    public List<Transaction> findByRefTxnId(Long refTxnId) {
        return jdbcTemplate.query(
                "SELECT T.*, C.FIRST_NAME, C.LAST_NAME FROM TRANSACTION T JOIN ACCOUNT A ON T.ACCOUNT_NO = A.ACCOUNT_NO JOIN CUSTOMER C ON A.CUSTOMER_ID = C.CUSTOMER_ID WHERE T.REF_TXN_ID = ?",
                transactionRowMapper, refTxnId);
    }

    public List<Transaction> findPaged(Long accountNo, String type, String channel, LocalDate start, LocalDate end, int page, int size) {
        int offset = page * size;
        StringBuilder sql = new StringBuilder(
                "SELECT T.*, C.FIRST_NAME, C.LAST_NAME FROM TRANSACTION T JOIN ACCOUNT A ON T.ACCOUNT_NO = A.ACCOUNT_NO JOIN CUSTOMER C ON A.CUSTOMER_ID = C.CUSTOMER_ID WHERE 1=1 ");
        if (accountNo != null) sql.append(" AND T.ACCOUNT_NO = ").append(accountNo);
        if (type != null && !type.isEmpty()) sql.append(" AND T.TXN_TYPE = '").append(type).append("'");
        if (channel != null && !channel.isEmpty()) sql.append(" AND T.CHANNEL = '").append(channel).append("'");
        if (start != null) sql.append(" AND TRUNC(T.TXN_DATE) >= TO_DATE('").append(start).append("', 'YYYY-MM-DD')");
        if (end != null) sql.append(" AND TRUNC(T.TXN_DATE) <= TO_DATE('").append(end).append("', 'YYYY-MM-DD')");
        sql.append(" ORDER BY T.TXN_DATE DESC");
        
        // Oracle pagination
        String paginatedSql = "SELECT * FROM (SELECT a.*, ROWNUM rn FROM (" + sql + ") a WHERE ROWNUM <= " + (offset + size) + ") WHERE rn > " + offset;
        return jdbcTemplate.query(paginatedSql, transactionRowMapper);
    }

    public int countFiltered(Long accountNo, String type, String channel, LocalDate start, LocalDate end) {
        StringBuilder sql = new StringBuilder(
                "SELECT COUNT(*) FROM TRANSACTION T JOIN ACCOUNT A ON T.ACCOUNT_NO = A.ACCOUNT_NO JOIN CUSTOMER C ON A.CUSTOMER_ID = C.CUSTOMER_ID WHERE 1=1 ");
        if (accountNo != null) sql.append(" AND T.ACCOUNT_NO = ").append(accountNo);
        if (type != null && !type.isEmpty()) sql.append(" AND T.TXN_TYPE = '").append(type).append("'");
        if (channel != null && !channel.isEmpty()) sql.append(" AND T.CHANNEL = '").append(channel).append("'");
        if (start != null) sql.append(" AND TRUNC(T.TXN_DATE) >= TO_DATE('").append(start).append("', 'YYYY-MM-DD')");
        if (end != null) sql.append(" AND TRUNC(T.TXN_DATE) <= TO_DATE('").append(end).append("', 'YYYY-MM-DD')");
        return jdbcTemplate.queryForObject(sql.toString(), Integer.class);
    }
}
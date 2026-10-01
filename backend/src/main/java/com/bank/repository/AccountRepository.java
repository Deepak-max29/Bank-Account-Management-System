package com.bank.repository;

import com.bank.model.Account;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public class AccountRepository {

    private final JdbcTemplate jdbcTemplate;

    public AccountRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Account> accountRowMapper = (rs, rowNum) -> {
        Account acc = Account.builder()
                .accountNo(rs.getLong("ACCOUNT_NO"))
                .customerId(rs.getLong("CUSTOMER_ID"))
                .branchId(rs.getLong("BRANCH_ID"))
                .accountType(rs.getString("ACCOUNT_TYPE"))
                .balance(rs.getBigDecimal("BALANCE"))
                .status(rs.getString("STATUS"))
                .openedDate(rs.getDate("OPENED_DATE") != null ? rs.getDate("OPENED_DATE").toLocalDate() : null)
                .openDate(rs.getDate("OPENED_DATE") != null ? rs.getDate("OPENED_DATE").toLocalDate() : null)
                .initialBalance(rs.getBigDecimal("BALANCE"))
                .initialDeposit(rs.getBigDecimal("BALANCE"))
                .build();
        try {
            acc.setCustomerName(rs.getString("FIRST_NAME") + " " + rs.getString("LAST_NAME"));
            acc.setBranchName(rs.getString("BRANCH_NAME"));
        } catch (Exception ignored) {}
        return acc;
    };

    public List<Account> findAll() {
        return jdbcTemplate.query(
                "SELECT A.*, C.FIRST_NAME, C.LAST_NAME, B.BRANCH_NAME FROM ACCOUNT A JOIN CUSTOMER C ON A.CUSTOMER_ID = C.CUSTOMER_ID JOIN BRANCH B ON A.BRANCH_ID = B.BRANCH_ID",
                accountRowMapper);
    }

    public Optional<Account> findById(Long accountNo) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(
                    "SELECT A.*, C.FIRST_NAME, C.LAST_NAME, B.BRANCH_NAME FROM ACCOUNT A JOIN CUSTOMER C ON A.CUSTOMER_ID = C.CUSTOMER_ID JOIN BRANCH B ON A.BRANCH_ID = B.BRANCH_ID WHERE A.ACCOUNT_NO = ?",
                    accountRowMapper, accountNo));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Account save(Account account) {
        Long id = jdbcTemplate.queryForObject("SELECT SEQ_ACCOUNT_NO.NEXTVAL FROM DUAL", Long.class);
        jdbcTemplate.update(
                "INSERT INTO ACCOUNT (ACCOUNT_NO, CUSTOMER_ID, BRANCH_ID, ACCOUNT_TYPE, BALANCE, STATUS, OPENED_DATE) VALUES (?, ?, ?, ?, ?, ?, SYSDATE)",
                id, account.getCustomerId(), account.getBranchId(), account.getAccountType(), account.getBalance(), account.getStatus());
        account.setAccountNo(id);
        return account;
    }

    public int count() {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM ACCOUNT", Integer.class);
    }

    public List<Account> findByCustomerId(Long customerId) {
        return jdbcTemplate.query(
                "SELECT A.*, C.FIRST_NAME, C.LAST_NAME, B.BRANCH_NAME FROM ACCOUNT A JOIN CUSTOMER C ON A.CUSTOMER_ID = C.CUSTOMER_ID JOIN BRANCH B ON A.BRANCH_ID = B.BRANCH_ID WHERE A.CUSTOMER_ID = ?",
                accountRowMapper, customerId);
    }

    public List<Account> findByBranchId(Long branchId) {
        return jdbcTemplate.query(
                "SELECT A.*, C.FIRST_NAME, C.LAST_NAME, B.BRANCH_NAME FROM ACCOUNT A JOIN CUSTOMER C ON A.CUSTOMER_ID = C.CUSTOMER_ID JOIN BRANCH B ON A.BRANCH_ID = B.BRANCH_ID WHERE A.BRANCH_ID = ?",
                accountRowMapper, branchId);
    }

    public List<Account> findByStatus(String status) {
        return jdbcTemplate.query(
                "SELECT A.*, C.FIRST_NAME, C.LAST_NAME, B.BRANCH_NAME FROM ACCOUNT A JOIN CUSTOMER C ON A.CUSTOMER_ID = C.CUSTOMER_ID JOIN BRANCH B ON A.BRANCH_ID = B.BRANCH_ID WHERE A.STATUS = ?",
                accountRowMapper, status);
    }

    public void updateBalance(Long accountNo, BigDecimal newBalance) {
        jdbcTemplate.update("UPDATE ACCOUNT SET BALANCE = ? WHERE ACCOUNT_NO = ?", newBalance, accountNo);
    }

    public void updateStatus(Long accountNo, String status) {
        jdbcTemplate.update("UPDATE ACCOUNT SET STATUS = ? WHERE ACCOUNT_NO = ?", status, accountNo);
    }

    public Optional<Account> findByIdForUpdate(Long accountNo) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(
                    "SELECT A.*, C.FIRST_NAME, C.LAST_NAME, B.BRANCH_NAME FROM ACCOUNT A JOIN CUSTOMER C ON A.CUSTOMER_ID = C.CUSTOMER_ID JOIN BRANCH B ON A.BRANCH_ID = B.BRANCH_ID WHERE A.ACCOUNT_NO = ? FOR UPDATE",
                    accountRowMapper, accountNo));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public int countActive() {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM ACCOUNT WHERE STATUS = 'ACTIVE'", Integer.class);
    }
}
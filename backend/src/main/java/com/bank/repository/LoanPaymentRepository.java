package com.bank.repository;

import com.bank.model.LoanPayment;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public class LoanPaymentRepository {

    private final JdbcTemplate jdbcTemplate;

    public LoanPaymentRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<LoanPayment> loanPaymentRowMapper = (rs, rowNum) -> {
        // Canonical LOAN_PAYMENT columns: PAYMENT_ID, LOAN_ID, PAYMENT_DATE, AMOUNT_PAID, REMAINING_BALANCE, PAYMENT_MODE, REMARKS
        LoanPayment payment = LoanPayment.builder()
                .paymentId(rs.getLong("PAYMENT_ID"))
                .loanId(rs.getLong("LOAN_ID"))
                .paymentDate(rs.getDate("PAYMENT_DATE") != null ? rs.getDate("PAYMENT_DATE").toLocalDate() : null)
                .amountPaid(rs.getBigDecimal("AMOUNT_PAID"))
                .remainingBalance(rs.getBigDecimal("REMAINING_BALANCE"))
                .paymentMode(rs.getString("PAYMENT_MODE"))
                .paymentMethod(rs.getString("PAYMENT_MODE"))
                .remarks(rs.getString("REMARKS"))
                .build();
        try {
            payment.setLoanType(rs.getString("LOAN_TYPE"));
            payment.setCustomerName(rs.getString("FIRST_NAME") + " " + rs.getString("LAST_NAME"));
        } catch (Exception ignored) {}
        return payment;
    };

    public List<LoanPayment> findAll() {
        return jdbcTemplate.query(
                "SELECT P.*, L.LOAN_TYPE, C.FIRST_NAME, C.LAST_NAME FROM LOAN_PAYMENT P JOIN LOAN L ON P.LOAN_ID = L.LOAN_ID JOIN CUSTOMER C ON L.CUSTOMER_ID = C.CUSTOMER_ID",
                loanPaymentRowMapper);
    }

    public Optional<LoanPayment> findById(Long id) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(
                    "SELECT P.*, L.LOAN_TYPE, C.FIRST_NAME, C.LAST_NAME FROM LOAN_PAYMENT P JOIN LOAN L ON P.LOAN_ID = L.LOAN_ID JOIN CUSTOMER C ON L.CUSTOMER_ID = C.CUSTOMER_ID WHERE P.PAYMENT_ID = ?",
                    loanPaymentRowMapper, id));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public LoanPayment save(LoanPayment payment) {
        Long id = jdbcTemplate.queryForObject("SELECT SEQ_PAYMENT_ID.NEXTVAL FROM DUAL", Long.class);
        jdbcTemplate.update(
                "INSERT INTO LOAN_PAYMENT (PAYMENT_ID, LOAN_ID, PAYMENT_DATE, AMOUNT_PAID, REMAINING_BALANCE, PAYMENT_MODE, REMARKS) VALUES (?, ?, SYSDATE, ?, ?, ?, ?)",
                id, payment.getLoanId(), payment.getAmountPaid(), payment.getRemainingBalance(), payment.getPaymentMode(), payment.getRemarks());
        payment.setPaymentId(id);
        return payment;
    }

    public int count() {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM LOAN_PAYMENT", Integer.class);
    }

    public List<LoanPayment> findByLoanId(Long loanId) {
        return jdbcTemplate.query(
                "SELECT P.*, L.LOAN_TYPE, C.FIRST_NAME, C.LAST_NAME FROM LOAN_PAYMENT P JOIN LOAN L ON P.LOAN_ID = L.LOAN_ID JOIN CUSTOMER C ON L.CUSTOMER_ID = C.CUSTOMER_ID WHERE P.LOAN_ID = ? ORDER BY P.PAYMENT_DATE DESC",
                loanPaymentRowMapper, loanId);
    }
}
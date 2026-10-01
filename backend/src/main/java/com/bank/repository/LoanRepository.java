package com.bank.repository;

import com.bank.model.Loan;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public class LoanRepository {

    private final JdbcTemplate jdbcTemplate;

    public LoanRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Loan> loanRowMapper = (rs, rowNum) -> {
        Loan loan = Loan.builder()
                .loanId(rs.getLong("LOAN_ID"))
                .customerId(rs.getLong("CUSTOMER_ID"))
                .branchId(rs.getLong("BRANCH_ID"))
                .loanType(rs.getString("LOAN_TYPE"))
                .principalAmount(rs.getBigDecimal("PRINCIPAL_AMOUNT"))
                .interestRate(rs.getBigDecimal("INTEREST_RATE"))
                .loanTenure(rs.getInt("LOAN_TENURE"))
                .loanStatus(rs.getString("LOAN_STATUS"))
                .sanctionDate(rs.getDate("SANCTION_DATE") != null ? rs.getDate("SANCTION_DATE").toLocalDate() : null)
                .outstandingBal(rs.getBigDecimal("OUTSTANDING_BAL"))
                .sanctionedByEmp(rs.getObject("SANCTIONED_BY_EMP") != null ? rs.getLong("SANCTIONED_BY_EMP") : null)
                .sanctionedBy(rs.getObject("SANCTIONED_BY_EMP") != null ? String.valueOf(rs.getLong("SANCTIONED_BY_EMP")) : null)
                .build();
        try {
            loan.setCustomerName(rs.getString("FIRST_NAME") + " " + rs.getString("LAST_NAME"));
            loan.setBranchName(rs.getString("BRANCH_NAME"));
            loan.setEmpName(rs.getString("EMP_FIRST") + " " + rs.getString("EMP_LAST"));
        } catch (Exception ignored) {}
        return loan;
    };

    public List<Loan> findAll() {
        return jdbcTemplate.query(
                "SELECT L.*, C.FIRST_NAME, C.LAST_NAME, B.BRANCH_NAME, E.FIRST_NAME AS EMP_FIRST, E.LAST_NAME AS EMP_LAST FROM LOAN L JOIN CUSTOMER C ON L.CUSTOMER_ID = C.CUSTOMER_ID JOIN BRANCH B ON L.BRANCH_ID = B.BRANCH_ID LEFT JOIN EMPLOYEE E ON L.SANCTIONED_BY_EMP = E.EMP_ID",
                loanRowMapper);
    }

    public Optional<Loan> findById(Long id) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(
                    "SELECT L.*, C.FIRST_NAME, C.LAST_NAME, B.BRANCH_NAME, E.FIRST_NAME AS EMP_FIRST, E.LAST_NAME AS EMP_LAST FROM LOAN L JOIN CUSTOMER C ON L.CUSTOMER_ID = C.CUSTOMER_ID JOIN BRANCH B ON L.BRANCH_ID = B.BRANCH_ID LEFT JOIN EMPLOYEE E ON L.SANCTIONED_BY_EMP = E.EMP_ID WHERE L.LOAN_ID = ?",
                    loanRowMapper, id));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Loan save(Loan loan) {
        Long id = jdbcTemplate.queryForObject("SELECT SEQ_LOAN_ID.NEXTVAL FROM DUAL", Long.class);
        jdbcTemplate.update(
                "INSERT INTO LOAN (LOAN_ID, CUSTOMER_ID, BRANCH_ID, LOAN_TYPE, PRINCIPAL_AMOUNT, INTEREST_RATE, LOAN_TENURE, LOAN_STATUS, SANCTION_DATE, OUTSTANDING_BAL, SANCTIONED_BY_EMP) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                id, loan.getCustomerId(), loan.getBranchId(), loan.getLoanType(), loan.getPrincipalAmount(), loan.getInterestRate(), loan.getLoanTenure(), loan.getLoanStatus(), loan.getSanctionDate(), loan.getOutstandingBal(), loan.getSanctionedByEmp());
        loan.setLoanId(id);
        return loan;
    }

    public void update(Long id, Loan loan) {
        jdbcTemplate.update(
                "UPDATE LOAN SET LOAN_TYPE = ?, PRINCIPAL_AMOUNT = ?, INTEREST_RATE = ?, LOAN_TENURE = ?, LOAN_STATUS = ?, SANCTION_DATE = ?, OUTSTANDING_BAL = ?, SANCTIONED_BY_EMP = ? WHERE LOAN_ID = ?",
                loan.getLoanType(), loan.getPrincipalAmount(), loan.getInterestRate(), loan.getLoanTenure(), loan.getLoanStatus(), loan.getSanctionDate(), loan.getOutstandingBal(), loan.getSanctionedByEmp(), id);
    }

    public int count() {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM LOAN", Integer.class);
    }

    public List<Loan> findByCustomerId(Long customerId) {
        return jdbcTemplate.query(
                "SELECT L.*, C.FIRST_NAME, C.LAST_NAME, B.BRANCH_NAME, E.FIRST_NAME AS EMP_FIRST, E.LAST_NAME AS EMP_LAST FROM LOAN L JOIN CUSTOMER C ON L.CUSTOMER_ID = C.CUSTOMER_ID JOIN BRANCH B ON L.BRANCH_ID = B.BRANCH_ID LEFT JOIN EMPLOYEE E ON L.SANCTIONED_BY_EMP = E.EMP_ID WHERE L.CUSTOMER_ID = ?",
                loanRowMapper, customerId);
    }

    public List<Loan> findByBranchId(Long branchId) {
        return jdbcTemplate.query(
                "SELECT L.*, C.FIRST_NAME, C.LAST_NAME, B.BRANCH_NAME, E.FIRST_NAME AS EMP_FIRST, E.LAST_NAME AS EMP_LAST FROM LOAN L JOIN CUSTOMER C ON L.CUSTOMER_ID = C.CUSTOMER_ID JOIN BRANCH B ON L.BRANCH_ID = B.BRANCH_ID LEFT JOIN EMPLOYEE E ON L.SANCTIONED_BY_EMP = E.EMP_ID WHERE L.BRANCH_ID = ?",
                loanRowMapper, branchId);
    }

    public List<Loan> findByStatus(String status) {
        return jdbcTemplate.query(
                "SELECT L.*, C.FIRST_NAME, C.LAST_NAME, B.BRANCH_NAME, E.FIRST_NAME AS EMP_FIRST, E.LAST_NAME AS EMP_LAST FROM LOAN L JOIN CUSTOMER C ON L.CUSTOMER_ID = C.CUSTOMER_ID JOIN BRANCH B ON L.BRANCH_ID = B.BRANCH_ID LEFT JOIN EMPLOYEE E ON L.SANCTIONED_BY_EMP = E.EMP_ID WHERE L.LOAN_STATUS = ?",
                loanRowMapper, status);
    }

    public void updateStatus(Long id, String status) {
        jdbcTemplate.update("UPDATE LOAN SET LOAN_STATUS = ? WHERE LOAN_ID = ?", status, id);
    }

    public void updateOutstandingBalance(Long id, BigDecimal balance) {
        jdbcTemplate.update("UPDATE LOAN SET OUTSTANDING_BAL = ? WHERE LOAN_ID = ?", balance, id);
    }
}
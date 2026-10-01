package com.bank.repository;

import com.bank.model.Beneficiary;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public class BeneficiaryRepository {

    private final JdbcTemplate jdbcTemplate;

    public BeneficiaryRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Beneficiary> beneficiaryRowMapper = (rs, rowNum) -> Beneficiary.builder()
            .beneficiaryId(rs.getLong("BENEFICIARY_ID"))
            .customerId(rs.getLong("CUSTOMER_ID"))
            .beneficiaryAccNo(rs.getString("BENEFICIARY_ACC_NO"))
            .beneficiaryAccountNo(rs.getString("BENEFICIARY_ACC_NO"))
            .beneficiaryName(rs.getString("BENEFICIARY_NAME"))
            .bankName(rs.getString("BANK_NAME"))
            .ifscCode(rs.getString("IFSC_CODE"))
            .maxLimit(rs.getBigDecimal("MAX_LIMIT"))
            .isVerified(rs.getInt("IS_VERIFIED") == 1)
            .isActive(rs.getInt("IS_ACTIVE") == 1)
            .addedDate(rs.getDate("ADDED_DATE") != null ? rs.getDate("ADDED_DATE").toLocalDate() : null)
            .build();

    public List<Beneficiary> findAll() {
        return jdbcTemplate.query("SELECT * FROM BENEFICIARY", beneficiaryRowMapper);
    }

    public Optional<Beneficiary> findById(Long id) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject("SELECT * FROM BENEFICIARY WHERE BENEFICIARY_ID = ?", beneficiaryRowMapper, id));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Beneficiary save(Beneficiary beneficiary) {
        Long id = jdbcTemplate.queryForObject("SELECT SEQ_BENEFICIARY_ID.NEXTVAL FROM DUAL", Long.class);
        jdbcTemplate.update(
                "INSERT INTO BENEFICIARY (BENEFICIARY_ID, CUSTOMER_ID, BENEFICIARY_ACC_NO, BENEFICIARY_NAME, BANK_NAME, IFSC_CODE, MAX_LIMIT, IS_VERIFIED, IS_ACTIVE, ADDED_DATE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, SYSDATE)",
                id, beneficiary.getCustomerId(), beneficiary.getBeneficiaryAccNo(), beneficiary.getBeneficiaryName(), beneficiary.getBankName(), beneficiary.getIfscCode(), beneficiary.getMaxLimit(), beneficiary.getIsVerified() ? 1 : 0, beneficiary.getIsActive() ? 1 : 0);
        beneficiary.setBeneficiaryId(id);
        return beneficiary;
    }

    public void update(Long id, Beneficiary beneficiary) {
        jdbcTemplate.update(
                "UPDATE BENEFICIARY SET BENEFICIARY_NAME = ?, BANK_NAME = ?, IFSC_CODE = ?, MAX_LIMIT = ? WHERE BENEFICIARY_ID = ?",
                beneficiary.getBeneficiaryName(), beneficiary.getBankName(), beneficiary.getIfscCode(), beneficiary.getMaxLimit(), id);
    }

    public int count() {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM BENEFICIARY", Integer.class);
    }

    public List<Beneficiary> findByCustomerId(Long customerId) {
        return jdbcTemplate.query("SELECT * FROM BENEFICIARY WHERE CUSTOMER_ID = ?", beneficiaryRowMapper, customerId);
    }

    public void updateVerificationStatus(Long id, boolean verified) {
        jdbcTemplate.update("UPDATE BENEFICIARY SET IS_VERIFIED = ? WHERE BENEFICIARY_ID = ?", verified ? 1 : 0, id);
    }

    public void updateActiveStatus(Long id, boolean active) {
        jdbcTemplate.update("UPDATE BENEFICIARY SET IS_ACTIVE = ? WHERE BENEFICIARY_ID = ?", active ? 1 : 0, id);
    }
}
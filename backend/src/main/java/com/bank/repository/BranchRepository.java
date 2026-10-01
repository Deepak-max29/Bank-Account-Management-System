package com.bank.repository;

import com.bank.model.Branch;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class BranchRepository {

    private final JdbcTemplate jdbcTemplate;

    public BranchRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Branch> branchRowMapper = (rs, rowNum) -> {
        Branch branch = Branch.builder()
                .branchId(rs.getLong("BRANCH_ID"))
                .bankId(rs.getLong("BANK_ID"))
                .branchName(rs.getString("BRANCH_NAME"))
                .ifscCode(rs.getString("IFSC_CODE"))
                .city(rs.getString("CITY"))
                .state(rs.getString("STATE"))
                .pincode(rs.getString("PINCODE"))
                .address(rs.getString("ADDRESS"))
                .contactNumber(rs.getString("CONTACT_NUMBER"))
                .email(rs.getString("EMAIL"))
                .build();
        try {
            branch.setBankName(rs.getString("BANK_NAME"));
        } catch (Exception ignored) {}
        return branch;
    };

    public List<Branch> findAll() {
        return jdbcTemplate.query(
                "SELECT BR.*, B.BANK_NAME FROM BRANCH BR JOIN BANK B ON BR.BANK_ID = B.BANK_ID",
                branchRowMapper);
    }

    public Optional<Branch> findById(Long id) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(
                    "SELECT BR.*, B.BANK_NAME FROM BRANCH BR JOIN BANK B ON BR.BANK_ID = B.BANK_ID WHERE BR.BRANCH_ID = ?",
                    branchRowMapper, id));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Branch save(Branch branch) {
        Long id = jdbcTemplate.queryForObject("SELECT SEQ_BRANCH_ID.NEXTVAL FROM DUAL", Long.class);
        jdbcTemplate.update(
                "INSERT INTO BRANCH (BRANCH_ID, BANK_ID, BRANCH_NAME, IFSC_CODE, CITY, STATE, PINCODE, ADDRESS, CONTACT_NUMBER, EMAIL) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                id, branch.getBankId(), branch.getBranchName(), branch.getIfscCode(), branch.getCity(), 
                branch.getState(), branch.getPincode(), branch.getAddress(), branch.getContactNumber(), branch.getEmail());
        branch.setBranchId(id);
        return branch;
    }

    public void update(Long id, Branch branch) {
        jdbcTemplate.update(
                "UPDATE BRANCH SET BANK_ID = ?, BRANCH_NAME = ?, IFSC_CODE = ?, CITY = ?, STATE = ?, PINCODE = ?, ADDRESS = ?, CONTACT_NUMBER = ?, EMAIL = ? WHERE BRANCH_ID = ?",
                branch.getBankId(), branch.getBranchName(), branch.getIfscCode(), branch.getCity(), 
                branch.getState(), branch.getPincode(), branch.getAddress(), branch.getContactNumber(), branch.getEmail(), id);
    }

    public void delete(Long id) {
        jdbcTemplate.update("DELETE FROM BRANCH WHERE BRANCH_ID = ?", id);
    }

    public int count() {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM BRANCH", Integer.class);
    }

    public List<Branch> findByBankId(Long bankId) {
        return jdbcTemplate.query(
                "SELECT BR.*, B.BANK_NAME FROM BRANCH BR JOIN BANK B ON BR.BANK_ID = B.BANK_ID WHERE BR.BANK_ID = ?",
                branchRowMapper, bankId);
    }

    public List<Branch> findByCity(String city) {
        return jdbcTemplate.query(
                "SELECT BR.*, B.BANK_NAME FROM BRANCH BR JOIN BANK B ON BR.BANK_ID = B.BANK_ID WHERE BR.CITY = ?",
                branchRowMapper, city);
    }

    public boolean existsByIfscCode(String ifscCode) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM BRANCH WHERE IFSC_CODE = ?", Integer.class, ifscCode);
        return count != null && count > 0;
    }

    public boolean hasReferences(Long branchId) {
        Integer empCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM EMPLOYEE WHERE BRANCH_ID = ?", Integer.class, branchId);
        Integer accCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM ACCOUNT WHERE BRANCH_ID = ?", Integer.class, branchId);
        Integer loanCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM LOAN WHERE BRANCH_ID = ?", Integer.class, branchId);
        return (empCount != null && empCount > 0) ||
               (accCount != null && accCount > 0) ||
               (loanCount != null && loanCount > 0);
    }
}
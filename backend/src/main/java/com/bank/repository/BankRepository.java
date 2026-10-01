package com.bank.repository;

import com.bank.model.Bank;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class BankRepository {

    private final JdbcTemplate jdbcTemplate;

    public BankRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Bank> bankRowMapper = (rs, rowNum) -> Bank.builder()
            .bankId(rs.getLong("BANK_ID"))
            .bankName(rs.getString("BANK_NAME"))
            .headOffice(rs.getString("HEAD_OFFICE"))
            .contactNo(rs.getString("CONTACT_NO"))
            .email(rs.getString("EMAIL"))
            .hoAddress(rs.getString("HEAD_OFFICE"))
            .website(rs.getString("WEBSITE"))
            .build();

    public List<Bank> findAll() {
        return jdbcTemplate.query("SELECT * FROM BANK", bankRowMapper);
    }

    public Optional<Bank> findById(Long id) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject("SELECT * FROM BANK WHERE BANK_ID = ?", bankRowMapper, id));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Bank save(Bank bank) {
        Long id = jdbcTemplate.queryForObject("SELECT SEQ_BANK_ID.NEXTVAL FROM DUAL", Long.class);
        jdbcTemplate.update("INSERT INTO BANK (BANK_ID, BANK_NAME, HEAD_OFFICE, CONTACT_NO, EMAIL) VALUES (?, ?, ?, ?, ?)",
                id, bank.getBankName(), bank.getHeadOffice(), bank.getContactNo(), bank.getEmail());
        bank.setBankId(id);
        return bank;
    }

    public void update(Long id, Bank bank) {
        jdbcTemplate.update("UPDATE BANK SET BANK_NAME = ?, HEAD_OFFICE = ?, CONTACT_NO = ?, EMAIL = ? WHERE BANK_ID = ?",
                bank.getBankName(), bank.getHeadOffice(), bank.getContactNo(), bank.getEmail(), id);
    }

    public void delete(Long id) {
        jdbcTemplate.update("DELETE FROM BANK WHERE BANK_ID = ?", id);
    }

    public int count() {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM BANK", Integer.class);
    }

    public Optional<Bank> findByName(String name) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject("SELECT * FROM BANK WHERE BANK_NAME = ?", bankRowMapper, name));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public boolean existsByName(String name) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM BANK WHERE BANK_NAME = ?", Integer.class, name);
        return count != null && count > 0;
    }
}
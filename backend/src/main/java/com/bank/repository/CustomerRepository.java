package com.bank.repository;

import com.bank.model.Customer;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class CustomerRepository {

    private final JdbcTemplate jdbcTemplate;

    public CustomerRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Customer> customerRowMapper = (rs, rowNum) -> Customer.builder()
            .customerId(rs.getLong("CUSTOMER_ID"))
            .firstName(rs.getString("FIRST_NAME"))
            .lastName(rs.getString("LAST_NAME"))
            .dob(rs.getDate("DOB") != null ? rs.getDate("DOB").toLocalDate() : null)
            .gender(rs.getString("GENDER"))
            .address(rs.getString("ADDRESS"))
            .phone(rs.getString("PHONE"))
            .email(rs.getString("EMAIL"))
            .kycStatus(rs.getString("KYC_STATUS"))
            .createdAt(rs.getDate("CREATED_AT") != null ? rs.getDate("CREATED_AT").toLocalDate() : null)
            .dateOfBirth(rs.getDate("DOB") != null ? rs.getDate("DOB").toLocalDate() : null)
            .build();

    public List<Customer> findAll() {
        return jdbcTemplate.query("SELECT * FROM CUSTOMER", customerRowMapper);
    }

    public Optional<Customer> findById(Long id) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject("SELECT * FROM CUSTOMER WHERE CUSTOMER_ID = ?", customerRowMapper, id));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Customer save(Customer customer) {
        Long id = jdbcTemplate.queryForObject("SELECT SEQ_CUSTOMER_ID.NEXTVAL FROM DUAL", Long.class);
        jdbcTemplate.update(
                "INSERT INTO CUSTOMER (CUSTOMER_ID, FIRST_NAME, LAST_NAME, DOB, GENDER, ADDRESS, PHONE, EMAIL, KYC_STATUS) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                id, customer.getFirstName(), customer.getLastName(), customer.getDob(), customer.getGender(), customer.getAddress(), customer.getPhone(), customer.getEmail(), customer.getKycStatus());
        customer.setCustomerId(id);
        return customer;
    }

    public void update(Long id, Customer customer) {
        jdbcTemplate.update(
                "UPDATE CUSTOMER SET FIRST_NAME = ?, LAST_NAME = ?, DOB = ?, GENDER = ?, ADDRESS = ?, PHONE = ?, EMAIL = ?, KYC_STATUS = ? WHERE CUSTOMER_ID = ?",
                customer.getFirstName(), customer.getLastName(), customer.getDob(), customer.getGender(), customer.getAddress(), customer.getPhone(), customer.getEmail(), customer.getKycStatus(), id);
    }

    public int count() {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM CUSTOMER", Integer.class);
    }

    public Optional<Customer> findByEmail(String email) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject("SELECT * FROM CUSTOMER WHERE EMAIL = ?", customerRowMapper, email));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<Customer> findByPhone(String phone) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject("SELECT * FROM CUSTOMER WHERE PHONE = ?", customerRowMapper, phone));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<Customer> search(String query) {
        String likeQuery = "%" + query.toUpperCase() + "%";
        return jdbcTemplate.query(
                "SELECT * FROM CUSTOMER WHERE UPPER(FIRST_NAME) LIKE ? OR UPPER(LAST_NAME) LIKE ? OR UPPER(EMAIL) LIKE ? OR PHONE LIKE ?",
                customerRowMapper, likeQuery, likeQuery, likeQuery, likeQuery);
    }

    public boolean existsByEmail(String email) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM CUSTOMER WHERE EMAIL = ?", Integer.class, email);
        return count != null && count > 0;
    }
}
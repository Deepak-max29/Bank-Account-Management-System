package com.bank.repository;

import com.bank.model.AppUser;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class AppUserRepository {

    private final JdbcTemplate jdbcTemplate;

    public AppUserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<AppUser> appUserRowMapper = (rs, rowNum) -> AppUser.builder()
            .userId(rs.getLong("USER_ID"))
            .username(rs.getString("USERNAME"))
            .passwordHash(rs.getString("PASSWORD_HASH"))
            .role(rs.getString("ROLE"))
            .empId(rs.getObject("EMP_ID") != null ? rs.getLong("EMP_ID") : null)
            .isActive(rs.getBoolean("IS_ACTIVE"))
            .createdAt(rs.getTimestamp("CREATED_AT") != null ? rs.getTimestamp("CREATED_AT").toLocalDateTime() : null)
            .lastLogin(rs.getTimestamp("LAST_LOGIN") != null ? rs.getTimestamp("LAST_LOGIN").toLocalDateTime() : null)
            .build();

    public Optional<AppUser> findByUsername(String username) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject("SELECT * FROM APP_USER WHERE USERNAME = ?", appUserRowMapper, username));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<AppUser> findById(Long id) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject("SELECT * FROM APP_USER WHERE USER_ID = ?", appUserRowMapper, id));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Long save(AppUser appUser) {
        Long id = jdbcTemplate.queryForObject("SELECT SEQ_USER_ID.NEXTVAL FROM DUAL", Long.class);
        jdbcTemplate.update(
                "INSERT INTO APP_USER (USER_ID, USERNAME, PASSWORD_HASH, ROLE, EMP_ID, IS_ACTIVE) VALUES (?, ?, ?, ?, ?, ?)",
                id, appUser.getUsername(), appUser.getPasswordHash(), appUser.getRole(), appUser.getEmpId(), appUser.getIsActive());
        return id;
    }

    public void updateLastLogin(String username) {
        jdbcTemplate.update("UPDATE APP_USER SET LAST_LOGIN = SYSDATE WHERE USERNAME = ?", username);
    }

    public void updatePassword(String username, String passwordHash) {
        jdbcTemplate.update("UPDATE APP_USER SET PASSWORD_HASH = ? WHERE USERNAME = ?", passwordHash, username);
    }

    public List<AppUser> findAll() {
        return jdbcTemplate.query("SELECT * FROM APP_USER", appUserRowMapper);
    }

    public boolean existsByUsername(String username) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM APP_USER WHERE USERNAME = ?", Integer.class, username);
        return count != null && count > 0;
    }
}

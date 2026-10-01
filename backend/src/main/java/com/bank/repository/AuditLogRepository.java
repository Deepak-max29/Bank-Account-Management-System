package com.bank.repository;

import com.bank.model.AuditLog;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class AuditLogRepository {

    private final JdbcTemplate jdbcTemplate;

    public AuditLogRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<AuditLog> auditLogRowMapper = (rs, rowNum) -> {
        // Canonical AUDIT_LOG columns: LOG_ID, ACCOUNT_NO, EMP_ID, ACTION_TYPE, DESCRIPTION, IP_ADDRESS, LOG_TIMESTAMP
        String description = rs.getString("DESCRIPTION");
        AuditLog log = AuditLog.builder()
                .logId(rs.getLong("LOG_ID"))
                .actionType(rs.getString("ACTION_TYPE"))
                .empId(rs.getObject("EMP_ID") != null ? rs.getLong("EMP_ID") : null)
                .accountNo(rs.getObject("ACCOUNT_NO") != null ? rs.getLong("ACCOUNT_NO") : null)
                .description(description)
                .details(description)   // alias: same canonical column
                .ipAddress(rs.getString("IP_ADDRESS"))
                .logTimestamp(rs.getTimestamp("LOG_TIMESTAMP") != null ? rs.getTimestamp("LOG_TIMESTAMP").toLocalDateTime() : null)
                .timestamp(rs.getTimestamp("LOG_TIMESTAMP") != null ? rs.getTimestamp("LOG_TIMESTAMP").toLocalDateTime() : null)
                .logDate(rs.getTimestamp("LOG_TIMESTAMP") != null ? rs.getTimestamp("LOG_TIMESTAMP").toLocalDateTime() : null)
                .build();
        try {
            String fn = rs.getString("FIRST_NAME");
            String ln = rs.getString("LAST_NAME");
            if (fn != null || ln != null) {
                log.setEmpName(((fn != null ? fn : "") + " " + (ln != null ? ln : "")).trim());
            }
        } catch (Exception ignored) {}
        return log;
    };

    public AuditLog save(AuditLog log) {
        Long id = jdbcTemplate.queryForObject("SELECT SEQ_LOG_ID.NEXTVAL FROM DUAL", Long.class);
        String description = log.getDescription() != null ? log.getDescription() : log.getDetails();
        jdbcTemplate.update(
                "INSERT INTO AUDIT_LOG (LOG_ID, ACTION_TYPE, EMP_ID, ACCOUNT_NO, DESCRIPTION, IP_ADDRESS, LOG_TIMESTAMP) VALUES (?, ?, ?, ?, ?, ?, SYSDATE)",
                id, log.getActionType(), log.getEmpId(), log.getAccountNo(), description, log.getIpAddress());
        log.setLogId(id);
        return log;
    }

    public List<AuditLog> findAll(int page, int size) {
        int offset = Math.max(0, page) * size;
        return jdbcTemplate.query(
                "SELECT * FROM (SELECT a.*, ROWNUM rn FROM (SELECT AL.*, E.FIRST_NAME, E.LAST_NAME FROM AUDIT_LOG AL LEFT JOIN EMPLOYEE E ON AL.EMP_ID = E.EMP_ID ORDER BY AL.LOG_TIMESTAMP DESC) a WHERE ROWNUM <= ?) WHERE rn > ?",
                auditLogRowMapper, offset + size, offset);
    }

    public Optional<AuditLog> findById(Long id) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(
                    "SELECT AL.*, E.FIRST_NAME, E.LAST_NAME FROM AUDIT_LOG AL LEFT JOIN EMPLOYEE E ON AL.EMP_ID = E.EMP_ID WHERE AL.LOG_ID = ?",
                    auditLogRowMapper, id));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public int count() {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM AUDIT_LOG", Integer.class);
    }

    public List<AuditLog> findByAccountNo(Long accountNo) {
        return jdbcTemplate.query(
                "SELECT AL.*, E.FIRST_NAME, E.LAST_NAME FROM AUDIT_LOG AL LEFT JOIN EMPLOYEE E ON AL.EMP_ID = E.EMP_ID WHERE AL.ACCOUNT_NO = ? ORDER BY AL.LOG_TIMESTAMP DESC",
                auditLogRowMapper, accountNo);
    }

    public List<AuditLog> findByEmpId(Long empId) {
        return jdbcTemplate.query(
                "SELECT AL.*, E.FIRST_NAME, E.LAST_NAME FROM AUDIT_LOG AL LEFT JOIN EMPLOYEE E ON AL.EMP_ID = E.EMP_ID WHERE AL.EMP_ID = ? ORDER BY AL.LOG_TIMESTAMP DESC",
                auditLogRowMapper, empId);
    }

    public List<AuditLog> findByActionType(String actionType) {
        return jdbcTemplate.query(
                "SELECT AL.*, E.FIRST_NAME, E.LAST_NAME FROM AUDIT_LOG AL LEFT JOIN EMPLOYEE E ON AL.EMP_ID = E.EMP_ID WHERE AL.ACTION_TYPE = ? ORDER BY AL.LOG_TIMESTAMP DESC",
                auditLogRowMapper, actionType);
    }

    public List<AuditLog> findByDateRange(LocalDateTime start, LocalDateTime end) {
        return jdbcTemplate.query(
                "SELECT AL.*, E.FIRST_NAME, E.LAST_NAME FROM AUDIT_LOG AL LEFT JOIN EMPLOYEE E ON AL.EMP_ID = E.EMP_ID WHERE AL.LOG_TIMESTAMP >= ? AND AL.LOG_TIMESTAMP <= ? ORDER BY AL.LOG_TIMESTAMP DESC",
                auditLogRowMapper, start, end);
    }

    public List<AuditLog> findRecent(int limit) {
        return jdbcTemplate.query(
                "SELECT * FROM (SELECT AL.*, E.FIRST_NAME, E.LAST_NAME FROM AUDIT_LOG AL LEFT JOIN EMPLOYEE E ON AL.EMP_ID = E.EMP_ID ORDER BY AL.LOG_TIMESTAMP DESC) WHERE ROWNUM <= ?",
                auditLogRowMapper, limit);
    }

    public List<AuditLog> filterLogs(Long accountNo, Long empId, String actionType, LocalDateTime start, LocalDateTime end) {
        StringBuilder sql = new StringBuilder("SELECT AL.*, E.FIRST_NAME, E.LAST_NAME FROM AUDIT_LOG AL LEFT JOIN EMPLOYEE E ON AL.EMP_ID = E.EMP_ID WHERE 1=1 ");
        List<Object> args = new java.util.ArrayList<>();
        if (accountNo != null) { sql.append(" AND AL.ACCOUNT_NO = ?"); args.add(accountNo); }
        if (empId != null) { sql.append(" AND AL.EMP_ID = ?"); args.add(empId); }
        if (actionType != null && !actionType.isEmpty()) { sql.append(" AND AL.ACTION_TYPE = ?"); args.add(actionType); }
        if (start != null) { sql.append(" AND AL.LOG_TIMESTAMP >= ?"); args.add(java.sql.Timestamp.valueOf(start)); }
        if (end != null) { sql.append(" AND AL.LOG_TIMESTAMP <= ?"); args.add(java.sql.Timestamp.valueOf(end)); }
        sql.append(" ORDER BY AL.LOG_TIMESTAMP DESC");
        return jdbcTemplate.query(sql.toString(), auditLogRowMapper, args.toArray());
    }

    public List<AuditLog> findFiltered(Long accountNo, Long empId, String actionType, LocalDateTime start, LocalDateTime end, int page, int size) {
        int offset = page * size;
        StringBuilder sql = new StringBuilder("SELECT AL.*, E.FIRST_NAME, E.LAST_NAME FROM AUDIT_LOG AL LEFT JOIN EMPLOYEE E ON AL.EMP_ID = E.EMP_ID WHERE 1=1 ");
        List<Object> args = new java.util.ArrayList<>();
        if (accountNo != null) { sql.append(" AND AL.ACCOUNT_NO = ?"); args.add(accountNo); }
        if (empId != null) { sql.append(" AND AL.EMP_ID = ?"); args.add(empId); }
        if (actionType != null && !actionType.isEmpty()) { sql.append(" AND AL.ACTION_TYPE = ?"); args.add(actionType); }
        if (start != null) { sql.append(" AND AL.LOG_TIMESTAMP >= ?"); args.add(java.sql.Timestamp.valueOf(start)); }
        if (end != null) { sql.append(" AND AL.LOG_TIMESTAMP <= ?"); args.add(java.sql.Timestamp.valueOf(end)); }
        sql.append(" ORDER BY AL.LOG_TIMESTAMP DESC");

        // Oracle pagination
        String paginatedSql = "SELECT * FROM (SELECT a.*, ROWNUM rn FROM (" + sql + ") a WHERE ROWNUM <= " + (offset + size) + ") WHERE rn > " + offset;
        return jdbcTemplate.query(paginatedSql, auditLogRowMapper, args.toArray());
    }

    public int countFiltered(Long accountNo, Long empId, String actionType, LocalDateTime start, LocalDateTime end) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM AUDIT_LOG AL LEFT JOIN EMPLOYEE E ON AL.EMP_ID = E.EMP_ID WHERE 1=1 ");
        List<Object> args = new java.util.ArrayList<>();
        if (accountNo != null) { sql.append(" AND AL.ACCOUNT_NO = ?"); args.add(accountNo); }
        if (empId != null) { sql.append(" AND AL.EMP_ID = ?"); args.add(empId); }
        if (actionType != null && !actionType.isEmpty()) { sql.append(" AND AL.ACTION_TYPE = ?"); args.add(actionType); }
        if (start != null) { sql.append(" AND AL.LOG_TIMESTAMP >= ?"); args.add(java.sql.Timestamp.valueOf(start)); }
        if (end != null) { sql.append(" AND AL.LOG_TIMESTAMP <= ?"); args.add(java.sql.Timestamp.valueOf(end)); }
        return jdbcTemplate.queryForObject(sql.toString(), Integer.class, args.toArray());
    }
}
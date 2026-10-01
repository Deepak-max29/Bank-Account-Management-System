package com.bank.repository;

import com.bank.model.Employee;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public class EmployeeRepository {

    private final JdbcTemplate jdbcTemplate;

    public EmployeeRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Employee> employeeRowMapper = (rs, rowNum) -> {
        Employee emp = Employee.builder()
                .empId(rs.getLong("EMP_ID"))
                .branchId(rs.getLong("BRANCH_ID"))
                .firstName(rs.getString("FIRST_NAME"))
                .lastName(rs.getString("LAST_NAME"))
                .designation(rs.getString("DESIGNATION"))
                .salary(rs.getBigDecimal("SALARY"))
                .email(rs.getString("EMAIL"))
                .phone(rs.getString("PHONE"))
                .joinDate(rs.getDate("JOIN_DATE") != null ? rs.getDate("JOIN_DATE").toLocalDate() : null)
                .hireDate(rs.getDate("JOIN_DATE") != null ? rs.getDate("JOIN_DATE").toLocalDate() : null)
                .build();
        try {
            emp.setBranchName(rs.getString("BRANCH_NAME"));
        } catch (Exception ignored) {}
        return emp;
    };

    public List<Employee> findAll() {
        return jdbcTemplate.query(
                "SELECT E.*, B.BRANCH_NAME FROM EMPLOYEE E JOIN BRANCH B ON E.BRANCH_ID = B.BRANCH_ID",
                employeeRowMapper);
    }

    public Optional<Employee> findById(Long id) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(
                    "SELECT E.*, B.BRANCH_NAME FROM EMPLOYEE E JOIN BRANCH B ON E.BRANCH_ID = B.BRANCH_ID WHERE E.EMP_ID = ?",
                    employeeRowMapper, id));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Employee save(Employee emp) {
        Long id = jdbcTemplate.queryForObject("SELECT SEQ_EMP_ID.NEXTVAL FROM DUAL", Long.class);
        jdbcTemplate.update(
                "INSERT INTO EMPLOYEE (EMP_ID, BRANCH_ID, FIRST_NAME, LAST_NAME, DESIGNATION, SALARY, EMAIL, PHONE, JOIN_DATE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                id, emp.getBranchId(), emp.getFirstName(), emp.getLastName(), emp.getDesignation(), emp.getSalary(), emp.getEmail(), emp.getPhone(), emp.getJoinDate());
        emp.setEmpId(id);
        return emp;
    }

    public void update(Long id, Employee emp) {
        jdbcTemplate.update(
                "UPDATE EMPLOYEE SET BRANCH_ID = ?, FIRST_NAME = ?, LAST_NAME = ?, DESIGNATION = ?, SALARY = ?, EMAIL = ?, PHONE = ?, JOIN_DATE = ? WHERE EMP_ID = ?",
                emp.getBranchId(), emp.getFirstName(), emp.getLastName(), emp.getDesignation(), emp.getSalary(), emp.getEmail(), emp.getPhone(), emp.getJoinDate(), id);
    }

    public int count() {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM EMPLOYEE", Integer.class);
    }

    public List<Employee> findByBranchId(Long branchId) {
        return jdbcTemplate.query(
                "SELECT E.*, B.BRANCH_NAME FROM EMPLOYEE E JOIN BRANCH B ON E.BRANCH_ID = B.BRANCH_ID WHERE E.BRANCH_ID = ?",
                employeeRowMapper, branchId);
    }

    public List<Employee> findByDesignation(String designation) {
        return jdbcTemplate.query(
                "SELECT E.*, B.BRANCH_NAME FROM EMPLOYEE E JOIN BRANCH B ON E.BRANCH_ID = B.BRANCH_ID WHERE E.DESIGNATION = ?",
                employeeRowMapper, designation);
    }

    public List<Employee> findManagers() {
        return jdbcTemplate.query(
                "SELECT E.*, B.BRANCH_NAME FROM EMPLOYEE E JOIN BRANCH B ON E.BRANCH_ID = B.BRANCH_ID WHERE E.DESIGNATION IN ('MANAGER', 'LOAN_OFFICER')",
                employeeRowMapper);
    }
}
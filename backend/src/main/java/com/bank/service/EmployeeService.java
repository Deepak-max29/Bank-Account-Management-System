package com.bank.service;

import com.bank.dto.request.EmployeeRequest;
import com.bank.model.Employee;
import java.util.List;

public interface EmployeeService {
    List<Employee> getAllEmployees();
    Employee getEmployeeById(Long id);
    Employee createEmployee(EmployeeRequest request);
    Employee updateEmployee(Long id, EmployeeRequest request);
    List<Employee> getEmployeesByBranch(Long branchId);
    List<Employee> getEmployeesByDesignation(String designation);
    List<Employee> getManagers();
}

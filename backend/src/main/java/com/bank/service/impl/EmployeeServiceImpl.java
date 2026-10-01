package com.bank.service.impl;

import com.bank.dto.request.EmployeeRequest;
import com.bank.exception.ResourceNotFoundException;
import com.bank.model.Employee;
import com.bank.repository.BranchRepository;
import com.bank.repository.EmployeeRepository;
import com.bank.service.AuditLogService;
import com.bank.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final BranchRepository branchRepository;
    private final AuditLogService auditLogService;

    @Override
    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    @Override
    public Employee getEmployeeById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
    }

    @Override
    @Transactional
    public Employee createEmployee(EmployeeRequest request) {
        branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with id: " + request.getBranchId()));
        Employee emp = Employee.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .branchId(request.getBranchId())
                .designation(request.getDesignation())
                .salary(request.getSalary())
                .hireDate(request.getHireDate())
                .joinDate(request.getHireDate())
                .build();
        Employee saved = employeeRepository.save(emp);
        auditLogService.logAction("CREATE_EMPLOYEE", null, saved.getEmpId(), "Created employee: " + saved.getEmail(), null);
        return saved;
    }

    @Override
    @Transactional
    public Employee updateEmployee(Long id, EmployeeRequest request) {
        Employee existing = getEmployeeById(id);
        branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with id: " + request.getBranchId()));
        
        if (existing.getSalary() != null && !existing.getSalary().equals(request.getSalary())) {
            auditLogService.logAction("SALARY_CHANGE", null, id, "Salary changed from " + existing.getSalary() + " to " + request.getSalary(), null);
        }

        existing.setFirstName(request.getFirstName());
        existing.setLastName(request.getLastName());
        existing.setEmail(request.getEmail());
        existing.setPhone(request.getPhone());
        existing.setBranchId(request.getBranchId());
        existing.setDesignation(request.getDesignation());
        existing.setSalary(request.getSalary());
        existing.setHireDate(request.getHireDate());
        existing.setJoinDate(request.getHireDate());
        employeeRepository.update(id, existing);
        auditLogService.logAction("UPDATE_EMPLOYEE", null, id, "Updated employee details", null);
        return existing;
    }

    @Override
    public List<Employee> getEmployeesByBranch(Long branchId) {
        return employeeRepository.findByBranchId(branchId);
    }

    @Override
    public List<Employee> getEmployeesByDesignation(String designation) {
        return employeeRepository.findByDesignation(designation);
    }

    @Override
    public List<Employee> getManagers() {
        return employeeRepository.findManagers();
    }
}
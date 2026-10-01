package com.bank.controller;

import com.bank.dto.request.EmployeeRequest;
import com.bank.dto.response.ApiResponse;
import com.bank.model.Employee;
import com.bank.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Employee>>> getAllEmployees() {
        return ResponseEntity.ok(ApiResponse.ok(employeeService.getAllEmployees()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Employee>> getEmployeeById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(employeeService.getEmployeeById(id)));
    }

    @GetMapping("/branch/{branchId}")
    public ResponseEntity<ApiResponse<List<Employee>>> getEmployeesByBranch(@PathVariable Long branchId) {
        return ResponseEntity.ok(ApiResponse.ok(employeeService.getEmployeesByBranch(branchId)));
    }

    @GetMapping("/designation/{designation}")
    public ResponseEntity<ApiResponse<List<Employee>>> getEmployeesByDesignation(@PathVariable String designation) {
        return ResponseEntity.ok(ApiResponse.ok(employeeService.getEmployeesByDesignation(designation)));
    }

    @GetMapping("/managers")
    public ResponseEntity<ApiResponse<List<Employee>>> getManagers() {
        return ResponseEntity.ok(ApiResponse.ok(employeeService.getManagers()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Employee>> createEmployee(@Valid @RequestBody EmployeeRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(employeeService.createEmployee(request), "Employee created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Employee>> updateEmployee(@PathVariable Long id, @Valid @RequestBody EmployeeRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(employeeService.updateEmployee(id, request), "Employee updated successfully"));
    }
}
package com.bank.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee {
    private Long empId;
    private Long branchId;
    private String branchName;  // populated via JOIN
    private String firstName;
    private String lastName;
    private String designation;
    private BigDecimal salary;
    private String phone;
    private String email;
    private LocalDate joinDate;  // Used in repo/services
    private LocalDate hireDate;  // Alias used in services

    public String getFullName() {
        return firstName + " " + lastName;
    }
}
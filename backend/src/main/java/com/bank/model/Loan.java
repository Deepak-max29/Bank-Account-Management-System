package com.bank.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Loan {
    private Long loanId;
    private Long customerId;
    private String customerName; // JOIN
    private Long branchId;
    private String branchName; // JOIN
    private Long sanctionedByEmp;
    private String sanctionedBy;  // Alias used in repo
    private String empName; // JOIN
    private String loanType;
    private BigDecimal principalAmount;
    private BigDecimal interestRate;
    private Integer loanTenure;
    private String loanStatus;
    private LocalDate sanctionDate;
    private BigDecimal outstandingBal;
}
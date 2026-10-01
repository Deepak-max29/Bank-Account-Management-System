package com.bank.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoanRequest {
    @NotNull(message = "Customer ID cannot be null")
    private Long customerId;
    
    @NotNull(message = "Branch ID cannot be null")
    private Long branchId;
    
    @NotNull(message = "Sanctioned by employee ID cannot be null")
    private Long sanctionedByEmp;
    
    @NotBlank(message = "Loan type cannot be blank")
    private String loanType;
    
    @NotNull(message = "Principal amount cannot be null")
    @DecimalMin(value = "1000.0", message = "Principal amount must be at least 1000")
    private BigDecimal principalAmount;
    
    @NotNull(message = "Interest rate cannot be null")
    @DecimalMin(value = "0.1", message = "Interest rate must be greater than 0")
    private BigDecimal interestRate;
    
    @NotNull(message = "Loan tenure cannot be null")
    @Min(value = 1, message = "Loan tenure must be at least 1 month")
    private Integer loanTenure;
}

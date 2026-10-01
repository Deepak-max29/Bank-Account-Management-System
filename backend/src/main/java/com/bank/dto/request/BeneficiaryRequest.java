package com.bank.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BeneficiaryRequest {
    @NotNull(message = "Customer ID cannot be null")
    private Long customerId;
    
    @NotNull(message = "Beneficiary account number cannot be null")
    private String beneficiaryAccNo;  // String to match DB
    
    @NotBlank(message = "Beneficiary name cannot be blank")
    private String beneficiaryName;
    
    @NotBlank(message = "Bank name cannot be blank")
    private String bankName;
    
    @NotBlank(message = "IFSC code cannot be blank")
    @Pattern(regexp = "^[A-Z]{4}0[A-Z0-9]{6}$", message = "Invalid IFSC code format")
    private String ifscCode;
    
    @NotNull(message = "Max limit cannot be null")
    @DecimalMin(value = "1.0", message = "Max limit must be greater than 0")
    private BigDecimal maxLimit;
    
    public String getAccountNo() { return beneficiaryAccNo; }
}
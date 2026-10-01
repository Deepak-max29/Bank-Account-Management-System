package com.bank.dto.request;

import jakarta.validation.constraints.DecimalMin;
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
public class LoanPaymentRequest {
    @NotNull(message = "Loan ID cannot be null")
    private Long loanId;
    
    @NotNull(message = "Amount paid cannot be null")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amountPaid;
    
    @NotBlank(message = "Payment mode cannot be blank")
    private String paymentMode;
    
    private String paymentMethod;
    private String remarks;
    
    public String getPaymentMethod() { return paymentMethod != null ? paymentMethod : paymentMode; }
}
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
public class LoanPayment {
    private Long paymentId;
    private Long loanId;
    private LocalDate paymentDate;
    private BigDecimal amountPaid;
    private BigDecimal remainingBalance;
    private String paymentMode;
    private String paymentMethod;  // Alias used in services
    private String remarks;        // Used in repo
    private BigDecimal principalComponent;  // Used in repo
    private BigDecimal interestComponent;   // Used in repo
    
    // For JOINs
    private String customerName;
    private String loanType;
}
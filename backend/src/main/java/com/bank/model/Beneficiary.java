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
public class Beneficiary {
    private Long beneficiaryId;
    private Long customerId;
    private String customerName; // JOIN
    private String beneficiaryAccNo;  // String to match DB
    private String beneficiaryAccountNo;  // Alias used in repo/services
    private String beneficiaryName;
    private String bankName;
    private String ifscCode;
    private BigDecimal maxLimit;
    private Boolean isVerified;
    private Boolean isActive;
    private LocalDate addedDate;
}
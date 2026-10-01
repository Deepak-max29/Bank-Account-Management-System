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
public class Account {
    private Long accountNo;
    private Long customerId;
    private String customerName;  // populated via JOIN
    private Long branchId;
    private String branchName;    // populated via JOIN
    private String accountType;
    private BigDecimal balance;
    private String status;
    private LocalDate openedDate;
    private LocalDate openDate;   // Alias used in repo
    private BigDecimal initialBalance;  // Used in services
    private BigDecimal initialDeposit;  // Alias used in services
}
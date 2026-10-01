package com.bank.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStats {
    private Long totalCustomers;
    private Long activeAccounts;
    private Long totalBranches;
    private Long transactionCount;
    private Long loanCount;
    private BigDecimal totalDeposits;
    private BigDecimal totalWithdrawals;
}

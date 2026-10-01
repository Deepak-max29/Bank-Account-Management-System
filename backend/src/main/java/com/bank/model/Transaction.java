package com.bank.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {
    private Long txnId;
    private Long accountNo;
    private String txnType;
    private BigDecimal amount;
    private BigDecimal balanceAfter;
    private String channel;
    private LocalDateTime txnDate;
    private Long refTxnId;
    private String remarks;
    private String idempotencyKey;
    
    // For JOINs
    private String customerName;
    private String accountHolderName;  // Alias used in repo
}
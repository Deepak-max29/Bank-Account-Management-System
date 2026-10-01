package com.bank.dto.response;

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
public class TransactionReceipt {
    private Long txnId;
    private Long refTxnId;
    private Long accountNo;
    private String txnType;
    private BigDecimal amount;
    private BigDecimal balanceAfter;
    private String channel;
    private LocalDateTime txnDate;
    private String status;
    private String remarks;
    
    // Constructor used by TransactionServiceImpl (7 args)
    public TransactionReceipt(Long txnId, Long accountNo, String txnType, BigDecimal amount, BigDecimal balanceAfter, LocalDateTime txnDate, String remarks) {
        this.txnId = txnId;
        this.accountNo = accountNo;
        this.txnType = txnType;
        this.amount = amount;
        this.balanceAfter = balanceAfter;
        this.txnDate = txnDate;
        this.remarks = remarks;
    }
}
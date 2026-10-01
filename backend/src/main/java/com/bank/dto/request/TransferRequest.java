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
public class TransferRequest {
    @NotNull(message = "Source account number cannot be null")
    private Long sourceAccountNo;
    
    @NotNull(message = "Destination account number cannot be null")
    private Long destinationAccountNo;
    
    @NotNull(message = "Amount cannot be null")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;
    
    @NotBlank(message = "Channel cannot be blank")
    private String channel;
    
    private String remarks;
    
    @NotBlank(message = "Idempotency key cannot be blank")
    private String idempotencyKey;
}

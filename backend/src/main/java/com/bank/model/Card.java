package com.bank.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Card {
    private Long cardId;
    private String cardNumber;
    private Long accountNo;
    private String customerName; // JOIN
    private String cardType;
    @com.fasterxml.jackson.annotation.JsonIgnore
    private String cvvHash;
    private LocalDate issueDate;
    private LocalDate expiryDate;
    private String cardStatus;
    private String status;  // Alias used in repo/services
}
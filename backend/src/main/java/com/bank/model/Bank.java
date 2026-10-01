package com.bank.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bank {
    private Long bankId;
    private String bankName;
    private String headOffice;
    private String contactNo;
    private String email;
    private String hoAddress;  // Additional field used in repo
    private String website;     // Additional field used in services
}
package com.bank.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Branch {
    private Long branchId;
    private Long bankId;
    private String bankName;  // populated via JOIN
    private String branchName;
    private String ifscCode;
    private String city;
    private String state;
    private String pincode;
    private String address;           // Used in services/repos
    private String contactNumber;     // Used in services/repos
    private String email;             // Used in services/repos
}
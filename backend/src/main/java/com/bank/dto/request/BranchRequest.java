package com.bank.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BranchRequest {
    @NotNull(message = "Bank ID cannot be null")
    private Long bankId;
    
    @NotBlank(message = "Branch name cannot be blank")
    private String branchName;
    
    @NotBlank(message = "IFSC code cannot be blank")
    @Pattern(regexp = "^[A-Z]{4}0[A-Z0-9]{6}$", message = "Invalid IFSC code format")
    private String ifscCode;
    
    private String city;
    private String state;
    
    @Pattern(regexp = "^\\d{6}$", message = "Pincode must be 6 digits")
    private String pincode;
    
    private String address;
    private String contactNumber;
    private String email;
    
    public String getAddress() { return address; }
    public String getContactNumber() { return contactNumber; }
}
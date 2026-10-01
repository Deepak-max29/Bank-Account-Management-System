package com.bank.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankRequest {
    @NotBlank(message = "Bank name cannot be blank")
    private String bankName;
    
    @NotBlank(message = "Head office cannot be blank")
    private String headOffice;
    
    @NotBlank(message = "Contact number cannot be blank")
    @Pattern(regexp = "^\\d{10}$", message = "Contact number must be 10 digits")
    private String contactNo;
    
    @NotBlank(message = "Email cannot be blank")
    @Email(message = "Invalid email format")
    private String email;
    
    private String hoAddress;
    private String website;
    
    public String getName() { return bankName; }
    public String getContactNumber() { return contactNo; }
}
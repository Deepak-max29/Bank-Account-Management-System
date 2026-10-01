package com.bank.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerRequest {
    @NotBlank(message = "First name cannot be blank")
    private String firstName;
    
    @NotBlank(message = "Last name cannot be blank")
    private String lastName;
    
    @NotBlank(message = "Email cannot be blank")
    @Email(message = "Invalid email format")
    private String email;
    
    @NotBlank(message = "Phone cannot be blank")
    @Pattern(regexp = "^\\d{10}$", message = "Phone number must be 10 digits")
    private String phone;
    
    @NotNull(message = "Date of birth cannot be null")
    private LocalDate dob;
    
    @NotBlank(message = "KYC status cannot be blank")
    @Pattern(regexp = "^(PENDING|VERIFIED|REJECTED)$", message = "Invalid KYC status")
    private String kycStatus;
    
    private String address;
    private String gender;
    private LocalDate dateOfBirth;
    
    public String getAddress() { return address; }
    public LocalDate getDateOfBirth() { return dateOfBirth != null ? dateOfBirth : dob; }
}
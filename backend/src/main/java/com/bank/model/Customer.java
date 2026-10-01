package com.bank.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer {
    private Long customerId;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private LocalDate dob;
    private String kycStatus;
    private LocalDate createdAt;
    private String gender;      // Used in repo
    private String address;     // Used in repo/services
    private LocalDate dateOfBirth;  // Alias for dob used in services

    public String getFullName() {
        return firstName + " " + lastName;
    }
}
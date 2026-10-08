package com.bank.controller;

import com.bank.dto.request.CustomerRequest;
import com.bank.dto.response.ApiResponse;
import com.bank.model.Customer;
import com.bank.security.SecurityUtils;
import com.bank.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Customer>>> getAllCustomers() {
        if (securityUtils.isCustomer()) {
            Long customerId = securityUtils.getCurrentCustomerId();
            if (customerId != null) {
                return ResponseEntity.ok(ApiResponse.ok(Collections.singletonList(customerService.getCustomerById(customerId))));
            }
            return ResponseEntity.ok(ApiResponse.ok(Collections.emptyList()));
        }
        return ResponseEntity.ok(ApiResponse.ok(customerService.getAllCustomers()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Customer>> getCustomerById(@PathVariable Long id) {
        if (securityUtils.isCustomer() && !id.equals(securityUtils.getCurrentCustomerId())) {
            throw new AccessDeniedException("Access denied: You do not have permission to view other customer records");
        }
        return ResponseEntity.ok(ApiResponse.ok(customerService.getCustomerById(id)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<Customer>>> searchCustomers(@RequestParam String query) {
        if (securityUtils.isCustomer()) {
            Long customerId = securityUtils.getCurrentCustomerId();
            if (customerId != null) {
                Customer c = customerService.getCustomerById(customerId);
                String q = query.toLowerCase();
                if ((c.getFirstName() != null && c.getFirstName().toLowerCase().contains(q)) ||
                    (c.getLastName() != null && c.getLastName().toLowerCase().contains(q)) ||
                    (c.getEmail() != null && c.getEmail().toLowerCase().contains(q))) {
                    return ResponseEntity.ok(ApiResponse.ok(Collections.singletonList(c)));
                }
            }
            return ResponseEntity.ok(ApiResponse.ok(Collections.emptyList()));
        }
        return ResponseEntity.ok(ApiResponse.ok(customerService.searchCustomers(query)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<Customer>> createCustomer(@Valid @RequestBody CustomerRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(customerService.createCustomer(request), "Customer created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<Customer>> updateCustomer(@PathVariable Long id, @Valid @RequestBody CustomerRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(customerService.updateCustomer(id, request), "Customer updated successfully"));
    }

    @PatchMapping("/{id}/kyc")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> updateKycStatus(@PathVariable Long id, @RequestParam String status) {
        customerService.updateKycStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok(null, "KYC status updated successfully"));
    }
}
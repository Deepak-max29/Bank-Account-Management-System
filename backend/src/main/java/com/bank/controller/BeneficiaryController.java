package com.bank.controller;

import com.bank.dto.request.BeneficiaryRequest;
import com.bank.dto.response.ApiResponse;
import com.bank.model.Beneficiary;
import com.bank.security.SecurityUtils;
import com.bank.service.BeneficiaryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/beneficiaries")
@RequiredArgsConstructor
public class BeneficiaryController {

    private final BeneficiaryService beneficiaryService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Beneficiary>>> getAllBeneficiaries() {
        if (securityUtils.isCustomer()) {
            Long customerId = securityUtils.getCurrentCustomerId();
            if (customerId != null) {
                return ResponseEntity.ok(ApiResponse.ok(beneficiaryService.getBeneficiariesByCustomer(customerId)));
            }
            return ResponseEntity.ok(ApiResponse.ok(Collections.emptyList()));
        }
        return ResponseEntity.ok(ApiResponse.ok(beneficiaryService.getAllBeneficiaries()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Beneficiary>> getBeneficiaryById(@PathVariable Long id) {
        Beneficiary b = beneficiaryService.getBeneficiaryById(id);
        if (securityUtils.isCustomer() && !b.getCustomerId().equals(securityUtils.getCurrentCustomerId())) {
            throw new AccessDeniedException("Access denied: You do not have permission to view this beneficiary");
        }
        return ResponseEntity.ok(ApiResponse.ok(b));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<List<Beneficiary>>> getBeneficiariesByCustomer(@PathVariable Long customerId) {
        if (securityUtils.isCustomer() && !customerId.equals(securityUtils.getCurrentCustomerId())) {
            throw new AccessDeniedException("Access denied: You can only view your own beneficiaries");
        }
        return ResponseEntity.ok(ApiResponse.ok(beneficiaryService.getBeneficiariesByCustomer(customerId)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF') or hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Beneficiary>> addBeneficiary(@Valid @RequestBody BeneficiaryRequest request) {
        if (securityUtils.isCustomer()) {
            request.setCustomerId(securityUtils.getCurrentCustomerId());
        }
        return ResponseEntity.ok(ApiResponse.ok(beneficiaryService.addBeneficiary(request), "Beneficiary added successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF') or hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Beneficiary>> updateBeneficiary(@PathVariable Long id, @Valid @RequestBody BeneficiaryRequest request) {
        if (securityUtils.isCustomer()) {
            Beneficiary b = beneficiaryService.getBeneficiaryById(id);
            if (!b.getCustomerId().equals(securityUtils.getCurrentCustomerId())) {
                throw new AccessDeniedException("Access denied: You do not have permission to modify this beneficiary");
            }
            request.setCustomerId(securityUtils.getCurrentCustomerId());
        }
        return ResponseEntity.ok(ApiResponse.ok(beneficiaryService.updateBeneficiary(id, request), "Beneficiary updated successfully"));
    }

    @PatchMapping("/{id}/verify")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> verifyBeneficiary(@PathVariable Long id) {
        beneficiaryService.verifyBeneficiary(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Beneficiary verified successfully"));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deactivateBeneficiary(@PathVariable Long id) {
        beneficiaryService.deactivateBeneficiary(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Beneficiary deactivated successfully"));
    }
}
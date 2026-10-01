package com.bank.controller;

import com.bank.dto.request.BeneficiaryRequest;
import com.bank.dto.response.ApiResponse;
import com.bank.model.Beneficiary;
import com.bank.service.BeneficiaryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/beneficiaries")
@RequiredArgsConstructor
public class BeneficiaryController {

    private final BeneficiaryService beneficiaryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Beneficiary>>> getAllBeneficiaries() {
        return ResponseEntity.ok(ApiResponse.ok(beneficiaryService.getAllBeneficiaries()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Beneficiary>> getBeneficiaryById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(beneficiaryService.getBeneficiaryById(id)));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<List<Beneficiary>>> getBeneficiariesByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(ApiResponse.ok(beneficiaryService.getBeneficiariesByCustomer(customerId)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<Beneficiary>> addBeneficiary(@Valid @RequestBody BeneficiaryRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(beneficiaryService.addBeneficiary(request), "Beneficiary added successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<Beneficiary>> updateBeneficiary(@PathVariable Long id, @Valid @RequestBody BeneficiaryRequest request) {
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
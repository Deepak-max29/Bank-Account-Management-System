package com.bank.controller;

import com.bank.dto.request.BankRequest;
import com.bank.dto.response.ApiResponse;
import com.bank.model.Bank;
import com.bank.service.BankService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/banks")
@RequiredArgsConstructor
public class BankController {

    private final BankService bankService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Bank>>> getAllBanks() {
        return ResponseEntity.ok(ApiResponse.ok(bankService.getAllBanks()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Bank>> getBankById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(bankService.getBankById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Bank>> createBank(@Valid @RequestBody BankRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(bankService.createBank(request), "Bank created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Bank>> updateBank(@PathVariable Long id, @Valid @RequestBody BankRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(bankService.updateBank(id, request), "Bank updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteBank(@PathVariable Long id) {
        bankService.deleteBank(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Bank deleted successfully"));
    }
}
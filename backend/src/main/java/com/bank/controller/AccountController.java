package com.bank.controller;

import com.bank.dto.request.AccountRequest;
import com.bank.dto.response.ApiResponse;
import com.bank.model.Account;
import com.bank.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Account>>> getAllAccounts() {
        return ResponseEntity.ok(ApiResponse.ok(accountService.getAllAccounts()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Account>> getAccountById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(accountService.getAccountById(id)));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<List<Account>>> getAccountsByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(ApiResponse.ok(accountService.getAccountsByCustomer(customerId)));
    }

    @GetMapping("/branch/{branchId}")
    public ResponseEntity<ApiResponse<List<Account>>> getAccountsByBranch(@PathVariable Long branchId) {
        return ResponseEntity.ok(ApiResponse.ok(accountService.getAccountsByBranch(branchId)));
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Integer>> getAccountCount() {
        return ResponseEntity.ok(ApiResponse.ok(accountService.count()));
    }

    @GetMapping("/active/count")
    public ResponseEntity<ApiResponse<Integer>> getActiveAccountCount() {
        return ResponseEntity.ok(ApiResponse.ok(accountService.countActive()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<Account>> openAccount(@Valid @RequestBody AccountRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(accountService.openAccount(request), "Account opened successfully"));
    }

    @PatchMapping("/{accountNo}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> changeAccountStatus(@PathVariable Long accountNo, @RequestParam String status) {
        accountService.changeAccountStatus(accountNo, status);
        return ResponseEntity.ok(ApiResponse.ok(null, "Account status changed successfully"));
    }
}
package com.bank.controller;

import com.bank.dto.request.AccountRequest;
import com.bank.dto.response.ApiResponse;
import com.bank.model.Account;
import com.bank.security.SecurityUtils;
import com.bank.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Account>>> getAllAccounts() {
        if (securityUtils.isCustomer()) {
            Long customerId = securityUtils.getCurrentCustomerId();
            if (customerId != null) {
                return ResponseEntity.ok(ApiResponse.ok(accountService.getAccountsByCustomer(customerId)));
            }
            return ResponseEntity.ok(ApiResponse.ok(Collections.emptyList()));
        }
        return ResponseEntity.ok(ApiResponse.ok(accountService.getAllAccounts()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Account>> getAccountById(@PathVariable Long id) {
        if (securityUtils.isCustomer()) {
            securityUtils.validateAccountAccess(id);
        }
        return ResponseEntity.ok(ApiResponse.ok(accountService.getAccountById(id)));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<List<Account>>> getAccountsByCustomer(@PathVariable Long customerId) {
        if (securityUtils.isCustomer() && !customerId.equals(securityUtils.getCurrentCustomerId())) {
            throw new AccessDeniedException("Access denied: You can only view your own accounts");
        }
        return ResponseEntity.ok(ApiResponse.ok(accountService.getAccountsByCustomer(customerId)));
    }

    @GetMapping("/branch/{branchId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF') or hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<List<Account>>> getAccountsByBranch(@PathVariable Long branchId) {
        return ResponseEntity.ok(ApiResponse.ok(accountService.getAccountsByBranch(branchId)));
    }

    @GetMapping("/count")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF') or hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Integer>> getAccountCount() {
        return ResponseEntity.ok(ApiResponse.ok(accountService.count()));
    }

    @GetMapping("/active/count")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF') or hasRole('MANAGER')")
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
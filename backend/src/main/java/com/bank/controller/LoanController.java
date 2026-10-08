package com.bank.controller;

import com.bank.dto.request.LoanRequest;
import com.bank.dto.response.ApiResponse;
import com.bank.dto.response.LoanScheduleEntry;
import com.bank.model.Loan;
import com.bank.security.SecurityUtils;
import com.bank.service.LoanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/loans")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Loan>>> getAllLoans() {
        if (securityUtils.isCustomer()) {
            Long customerId = securityUtils.getCurrentCustomerId();
            if (customerId != null) {
                return ResponseEntity.ok(ApiResponse.ok(loanService.getLoansByCustomer(customerId)));
            }
            return ResponseEntity.ok(ApiResponse.ok(Collections.emptyList()));
        }
        return ResponseEntity.ok(ApiResponse.ok(loanService.getAllLoans()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Loan>> getLoanById(@PathVariable Long id) {
        if (securityUtils.isCustomer()) {
            securityUtils.validateLoanAccess(id);
        }
        return ResponseEntity.ok(ApiResponse.ok(loanService.getLoanById(id)));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<List<Loan>>> getLoansByCustomer(@PathVariable Long customerId) {
        if (securityUtils.isCustomer() && !customerId.equals(securityUtils.getCurrentCustomerId())) {
            throw new AccessDeniedException("Access denied: You can only view your own loans");
        }
        return ResponseEntity.ok(ApiResponse.ok(loanService.getLoansByCustomer(customerId)));
    }

    @GetMapping("/branch/{branchId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF') or hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<List<Loan>>> getLoansByBranch(@PathVariable Long branchId) {
        return ResponseEntity.ok(ApiResponse.ok(loanService.getLoansByBranch(branchId)));
    }

    @GetMapping("/count")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF') or hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Integer>> getLoanCount() {
        return ResponseEntity.ok(ApiResponse.ok(loanService.count()));
    }

    @GetMapping("/{loanId}/schedule")
    public ResponseEntity<ApiResponse<List<LoanScheduleEntry>>> calculateEmiSchedule(@PathVariable Long loanId) {
        if (securityUtils.isCustomer()) {
            securityUtils.validateLoanAccess(loanId);
        }
        return ResponseEntity.ok(ApiResponse.ok(loanService.calculateEmiSchedule(loanId)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF') or hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Loan>> applyForLoan(@Valid @RequestBody LoanRequest request) {
        if (securityUtils.isCustomer()) {
            request.setCustomerId(securityUtils.getCurrentCustomerId());
        }
        return ResponseEntity.ok(ApiResponse.ok(loanService.applyForLoan(request), "Loan application submitted successfully"));
    }

    @PatchMapping("/{loanId}/approve")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> approveLoan(@PathVariable Long loanId) {
        loanService.approveLoan(loanId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Loan approved successfully"));
    }

    @PatchMapping("/{loanId}/reject")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> rejectLoan(@PathVariable Long loanId) {
        loanService.rejectLoan(loanId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Loan rejected"));
    }
}
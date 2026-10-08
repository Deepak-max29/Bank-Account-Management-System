package com.bank.controller;

import com.bank.dto.request.LoanPaymentRequest;
import com.bank.dto.response.ApiResponse;
import com.bank.model.LoanPayment;
import com.bank.security.SecurityUtils;
import com.bank.service.LoanPaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/loan-payments")
@RequiredArgsConstructor
public class LoanPaymentController {

    private final LoanPaymentService loanPaymentService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public ResponseEntity<ApiResponse<List<LoanPayment>>> getAllPayments() {
        if (securityUtils.isCustomer()) {
            Long customerId = securityUtils.getCurrentCustomerId();
            if (customerId != null) {
                return ResponseEntity.ok(ApiResponse.ok(loanPaymentService.getPaymentsByCustomer(customerId)));
            }
            return ResponseEntity.ok(ApiResponse.ok(Collections.emptyList()));
        }
        return ResponseEntity.ok(ApiResponse.ok(loanPaymentService.getAllPayments()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LoanPayment>> getPaymentById(@PathVariable Long id) {
        LoanPayment payment = loanPaymentService.getPaymentById(id);
        if (securityUtils.isCustomer()) {
            securityUtils.validateLoanAccess(payment.getLoanId());
        }
        return ResponseEntity.ok(ApiResponse.ok(payment));
    }

    @GetMapping("/loan/{loanId}")
    public ResponseEntity<ApiResponse<List<LoanPayment>>> getPaymentsByLoan(@PathVariable Long loanId) {
        if (securityUtils.isCustomer()) {
            securityUtils.validateLoanAccess(loanId);
        }
        return ResponseEntity.ok(ApiResponse.ok(loanPaymentService.getPaymentsByLoan(loanId)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF') or hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<LoanPayment>> makePayment(@Valid @RequestBody LoanPaymentRequest request) {
        if (securityUtils.isCustomer()) {
            securityUtils.validateLoanAccess(request.getLoanId());
        }
        return ResponseEntity.ok(ApiResponse.ok(loanPaymentService.makePayment(request), "Payment recorded successfully"));
    }
}
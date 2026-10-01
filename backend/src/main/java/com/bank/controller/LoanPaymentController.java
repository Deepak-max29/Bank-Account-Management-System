package com.bank.controller;

import com.bank.dto.request.LoanPaymentRequest;
import com.bank.dto.response.ApiResponse;
import com.bank.model.LoanPayment;
import com.bank.service.LoanPaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loan-payments")
@RequiredArgsConstructor
public class LoanPaymentController {

    private final LoanPaymentService loanPaymentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<LoanPayment>>> getAllPayments() {
        return ResponseEntity.ok(ApiResponse.ok(loanPaymentService.getAllPayments()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LoanPayment>> getPaymentById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(loanPaymentService.getPaymentById(id)));
    }

    @GetMapping("/loan/{loanId}")
    public ResponseEntity<ApiResponse<List<LoanPayment>>> getPaymentsByLoan(@PathVariable Long loanId) {
        return ResponseEntity.ok(ApiResponse.ok(loanPaymentService.getPaymentsByLoan(loanId)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<LoanPayment>> makePayment(@Valid @RequestBody LoanPaymentRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(loanPaymentService.makePayment(request), "Payment recorded successfully"));
    }
}
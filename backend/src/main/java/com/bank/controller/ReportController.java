package com.bank.controller;

import com.bank.dto.response.ApiResponse;
import com.bank.dto.response.ReportData;
import com.bank.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/account-balances")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<ReportData>> getAccountBalanceReport() {
        return ResponseEntity.ok(ApiResponse.ok(reportService.generateAccountBalanceReport()));
    }

    @GetMapping("/customer-accounts/{customerId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<ReportData>> getCustomerAccountReport(@PathVariable Long customerId) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.generateCustomerAccountReport(customerId)));
    }

    @GetMapping("/transaction-summary")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<ReportData>> getTransactionSummaryReport(
            @RequestParam(required = false) LocalDate start,
            @RequestParam(required = false) LocalDate end) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.generateTransactionSummaryReport(start, end)));
    }

    @GetMapping("/branch-activity")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<ReportData>> getBranchActivityReport() {
        return ResponseEntity.ok(ApiResponse.ok(reportService.generateBranchActivityReport()));
    }

    @GetMapping("/loan-repayments")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<ReportData>> getLoanRepaymentReport() {
        return ResponseEntity.ok(ApiResponse.ok(reportService.generateLoanRepaymentReport()));
    }
}
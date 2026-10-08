package com.bank.controller;

import com.bank.dto.response.ApiResponse;
import com.bank.dto.response.DashboardStats;
import com.bank.model.AuditLog;
import com.bank.model.Transaction;
import com.bank.security.SecurityUtils;
import com.bank.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final SecurityUtils securityUtils;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardStats>> getDashboardStats() {
        if (securityUtils.isCustomer()) {
            Long customerId = securityUtils.getCurrentCustomerId();
            if (customerId != null) {
                return ResponseEntity.ok(ApiResponse.ok(dashboardService.getCustomerDashboardStats(customerId)));
            }
        }
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getDashboardStats()));
    }

    @GetMapping("/recent-transactions")
    public ResponseEntity<ApiResponse<List<Transaction>>> getRecentTransactions(@RequestParam(defaultValue = "10") int limit) {
        if (securityUtils.isCustomer()) {
            Long customerId = securityUtils.getCurrentCustomerId();
            if (customerId != null) {
                return ResponseEntity.ok(ApiResponse.ok(dashboardService.getRecentTransactionsForCustomer(customerId, limit)));
            }
            return ResponseEntity.ok(ApiResponse.ok(Collections.emptyList()));
        }
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getRecentTransactions(limit)));
    }

    @GetMapping("/recent-audit-logs")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getRecentAuditLogs(@RequestParam(defaultValue = "10") int limit) {
        if (securityUtils.isCustomer()) {
            return ResponseEntity.ok(ApiResponse.ok(Collections.emptyList()));
        }
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getRecentAuditLogs(limit)));
    }
}
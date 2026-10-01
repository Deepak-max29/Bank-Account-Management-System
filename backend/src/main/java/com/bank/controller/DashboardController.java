package com.bank.controller;

import com.bank.dto.response.ApiResponse;
import com.bank.dto.response.DashboardStats;
import com.bank.model.AuditLog;
import com.bank.model.Transaction;
import com.bank.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardStats>> getDashboardStats() {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getDashboardStats()));
    }

    @GetMapping("/recent-transactions")
    public ResponseEntity<ApiResponse<List<Transaction>>> getRecentTransactions(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getRecentTransactions(limit)));
    }

    @GetMapping("/recent-audit-logs")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getRecentAuditLogs(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getRecentAuditLogs(limit)));
    }
}
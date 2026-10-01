package com.bank.controller;

import com.bank.dto.response.ApiResponse;
import com.bank.dto.response.PagedResponse;
import com.bank.model.AuditLog;
import com.bank.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<PagedResponse<AuditLog>>> getAuditLogs(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        // Adjust to 0-based page for service
        return ResponseEntity.ok(ApiResponse.ok(auditLogService.getAuditLogs(page - 1, size)));
    }

    @GetMapping("/recent")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<List<AuditLog>>> getRecentAuditLogs(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(auditLogService.getRecentLogs(limit)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<AuditLog>> getAuditLogById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(auditLogService.getAuditLogById(id)));
    }

    @GetMapping("/filter")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<PagedResponse<AuditLog>>> getFilteredLogs(
            @RequestParam(required = false) Long accountNo,
            @RequestParam(required = false) Long empId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) LocalDateTime start,
            @RequestParam(required = false) LocalDateTime end,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        // Adjust to 0-based page for service
        return ResponseEntity.ok(ApiResponse.ok(auditLogService.getFilteredLogs(accountNo, empId, action, start, end, page - 1, size)));
    }
}
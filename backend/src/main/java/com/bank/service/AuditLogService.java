package com.bank.service;

import com.bank.dto.response.PagedResponse;
import com.bank.model.AuditLog;
import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogService {
    void logAction(String actionType, Long accountNo, Long empId, String description, String ipAddress);
    PagedResponse<AuditLog> getAuditLogs(int page, int size);
    AuditLog getAuditLogById(Long id);
    PagedResponse<AuditLog> getFilteredLogs(Long accountNo, Long empId, String action, LocalDateTime start, LocalDateTime end, int page, int size);
    List<AuditLog> getRecentLogs(int limit);
}

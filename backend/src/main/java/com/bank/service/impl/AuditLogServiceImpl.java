package com.bank.service.impl;

import com.bank.dto.response.PagedResponse;
import com.bank.exception.ResourceNotFoundException;
import com.bank.model.AuditLog;
import com.bank.repository.AuditLogRepository;
import com.bank.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Override
    public void logAction(String actionType, Long accountNo, Long empId, String description, String ipAddress) {
        AuditLog log = AuditLog.builder()
                .actionType(actionType)
                .accountNo(accountNo)
                .empId(empId)
                .details(description)
                .description(description)
                .ipAddress(ipAddress)
                .logTimestamp(LocalDateTime.now())
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(log);
    }

    @Override
    public PagedResponse<AuditLog> getAuditLogs(int page, int size) {
        List<AuditLog> content = auditLogRepository.findAll(page, size);
        int total = auditLogRepository.count();
        int totalPages = (int) Math.ceil((double) total / size);
        return new PagedResponse<>(content, page, size, total, totalPages, page >= totalPages - 1);
    }

    @Override
    public AuditLog getAuditLogById(Long id) {
        return auditLogRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("AuditLog not found"));
    }

    @Override
    public PagedResponse<AuditLog> getFilteredLogs(Long accountNo, Long empId, String action, LocalDateTime start, LocalDateTime end, int page, int size) {
        List<AuditLog> content = auditLogRepository.findFiltered(accountNo, empId, action, start, end, page, size);
        int total = auditLogRepository.countFiltered(accountNo, empId, action, start, end);
        int totalPages = (int) Math.ceil((double) total / size);
        return new PagedResponse<>(content, page, size, total, totalPages, page >= totalPages - 1);
    }

    @Override
    public List<AuditLog> getRecentLogs(int limit) {
        return auditLogRepository.findRecent(limit);
    }

    @Override
    public byte[] exportFilteredAuditLogs(Long accountNo, Long empId, String action, LocalDateTime start, LocalDateTime end) {
        List<AuditLog> logs = auditLogRepository.filterLogs(accountNo, empId, action, start, end);
        StringBuilder sb = new StringBuilder();
        sb.append("LogId,Timestamp,ActionType,Description,AccountNo,EmpId,EmpName,IpAddress\r\n");
        for (AuditLog log : logs) {
            sb.append(log.getLogId() != null ? log.getLogId() : "").append(",");
            sb.append(escapeCsv(log.getLogTimestamp() != null ? log.getLogTimestamp().toString() : "")).append(",");
            sb.append(escapeCsv(log.getActionType() != null ? log.getActionType() : "")).append(",");
            sb.append(escapeCsv(log.getDescription() != null ? log.getDescription() : "")).append(",");
            sb.append(log.getAccountNo() != null ? log.getAccountNo() : "").append(",");
            sb.append(log.getEmpId() != null ? log.getEmpId() : "").append(",");
            sb.append(escapeCsv(log.getEmpName() != null ? log.getEmpName() : "")).append(",");
            sb.append(escapeCsv(log.getIpAddress() != null ? log.getIpAddress() : "")).append("\r\n");
        }
        return sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    private String escapeCsv(String val) {
        if (val == null || val.isEmpty()) return "";
        // Prevent formula injection
        if (val.startsWith("=") || val.startsWith("+") || val.startsWith("-") || val.startsWith("@") || val.startsWith("\t") || val.startsWith("\r")) {
            val = "'" + val;
        }
        if (val.contains(",") || val.contains("\"") || val.contains("\n") || val.contains("\r")) {
            return "\"" + val.replace("\"", "\"\"") + "\"";
        }
        return val;
    }
}
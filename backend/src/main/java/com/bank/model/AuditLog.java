package com.bank.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {
    private Long logId;
    private Long accountNo;
    private Long empId;
    private String empName; // JOIN
    private String actionType;
    private String description;
    private String details;  // Alias used in repo/services
    private String ipAddress;
    private LocalDateTime logTimestamp;
    private LocalDateTime timestamp;  // Alias used in services
    private String entityType;  // Used in repo
    private Long entityId;      // Used in repo
    private LocalDateTime logDate;  // Alias used in repo
}
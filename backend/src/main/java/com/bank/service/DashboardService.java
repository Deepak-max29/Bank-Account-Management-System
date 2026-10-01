package com.bank.service;

import com.bank.dto.response.DashboardStats;
import com.bank.model.AuditLog;
import com.bank.model.Transaction;
import java.util.List;

public interface DashboardService {
    DashboardStats getDashboardStats();
    List<Transaction> getRecentTransactions(int limit);
    List<AuditLog> getRecentAuditLogs(int limit);
}

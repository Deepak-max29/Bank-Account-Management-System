package com.bank.service.impl;

import com.bank.dto.response.DashboardStats;
import com.bank.model.AuditLog;
import com.bank.model.Transaction;
import com.bank.repository.DashboardRepository;
import com.bank.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final DashboardRepository dashboardRepository;

    @Override
    public DashboardStats getDashboardStats() {
        return DashboardStats.builder()
                .totalCustomers(dashboardRepository.getTotalCustomers())
                .activeAccounts(dashboardRepository.getActiveAccounts())
                .totalBranches(dashboardRepository.getTotalBranches())
                .transactionCount(dashboardRepository.getTransactionCount())
                .loanCount(dashboardRepository.getLoanCount())
                .totalDeposits(dashboardRepository.getTotalDeposits())
                .totalWithdrawals(dashboardRepository.getTotalWithdrawals())
                .build();
    }

    @Override
    public List<Transaction> getRecentTransactions(int limit) {
        return dashboardRepository.getRecentTransactions(limit);
    }

    @Override
    public List<AuditLog> getRecentAuditLogs(int limit) {
        return dashboardRepository.getRecentAuditLogs(limit);
    }
}

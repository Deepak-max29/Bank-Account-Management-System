package com.bank.service;

import com.bank.dto.response.ReportData;
import java.time.LocalDate;

public interface ReportService {
    ReportData generateAccountBalanceReport();
    ReportData generateCustomerAccountReport(Long customerId);
    ReportData generateTransactionSummaryReport(LocalDate start, LocalDate end);
    ReportData generateBranchActivityReport();
    ReportData generateLoanRepaymentReport();
    ReportData generateFilteredTransactionReport(Long customerId, Long accountNo, String txnType, LocalDate start, LocalDate end, Double minAmount, Double maxAmount);
}

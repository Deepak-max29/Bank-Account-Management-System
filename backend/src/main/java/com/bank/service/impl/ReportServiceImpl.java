package com.bank.service.impl;

import com.bank.dto.response.ReportData;
import com.bank.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public ReportData generateAccountBalanceReport() {
        String sql = "SELECT a.Account_No AS \"AccountNo\", "
                + "c.First_Name || ' ' || c.Last_Name AS \"Customer\", "
                + "a.Account_Type AS \"AccountType\", "
                + "b.Branch_Name AS \"Branch\", "
                + "a.Balance AS \"Balance\", "
                + "a.Status AS \"Status\" "
                + "FROM ACCOUNT a "
                + "JOIN CUSTOMER c ON a.Customer_ID = c.Customer_ID "
                + "JOIN BRANCH b ON a.Branch_ID = b.Branch_ID "
                + "ORDER BY a.Account_No";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
        return build("ACCOUNT_BALANCES", "Account Balances Report", List.of("AccountNo", "Customer", "AccountType", "Branch", "Balance", "Status"), rows);
    }

    @Override
    public ReportData generateCustomerAccountReport(Long customerId) {
        String sql = "SELECT a.Account_No AS \"AccountNo\", "
                + "c.First_Name || ' ' || c.Last_Name AS \"CustomerName\", "
                + "a.Account_Type AS \"AccountType\", "
                + "b.Branch_Name AS \"Branch\", "
                + "a.Balance AS \"Balance\", "
                + "a.Status AS \"Status\" "
                + "FROM ACCOUNT a "
                + "JOIN CUSTOMER c ON a.Customer_ID = c.Customer_ID "
                + "JOIN BRANCH b ON a.Branch_ID = b.Branch_ID "
                + "WHERE a.Customer_ID = ? "
                + "ORDER BY a.Account_No";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, customerId);
        return build("CUSTOMER_ACCOUNTS", "Customer Account Report - " + customerId, List.of("AccountNo", "CustomerName", "AccountType", "Branch", "Balance", "Status"), rows);
    }

    @Override
    public ReportData generateTransactionSummaryReport(LocalDate start, LocalDate end) {
        StringBuilder sql = new StringBuilder("SELECT Txn_Type AS \"TxnType\", COUNT(*) AS \"TxnCount\", SUM(Amount) AS \"TotalAmount\" FROM TRANSACTION WHERE 1=1");
        List<Object> params = new java.util.ArrayList<>();
        if (start != null) {
            sql.append(" AND TRUNC(Txn_Date) >= TO_DATE(?,'YYYY-MM-DD')");
            params.add(start.toString());
        }
        if (end != null) {
            sql.append(" AND TRUNC(Txn_Date) <= TO_DATE(?,'YYYY-MM-DD')");
            params.add(end.toString());
        }
        sql.append(" GROUP BY Txn_Type ORDER BY Txn_Type");
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql.toString(), params.toArray());
        return build("TRANSACTION_SUMMARY", "Transaction Summary Report", List.of("TxnType", "TxnCount", "TotalAmount"), rows);
    }

    @Override
    public ReportData generateBranchActivityReport() {
        String sql = "SELECT b.Branch_Name AS \"Branch\", b.City AS \"City\", "
                + "COUNT(DISTINCT a.Account_No) AS \"Accounts\", "
                + "COUNT(t.Txn_ID) AS \"TxnCount\", "
                + "NVL(SUM(t.Amount),0) AS \"TxnVolume\" "
                + "FROM BRANCH b "
                + "LEFT JOIN ACCOUNT a ON a.Branch_ID = b.Branch_ID "
                + "LEFT JOIN TRANSACTION t ON t.Account_No = a.Account_No "
                + "GROUP BY b.Branch_Name, b.City "
                + "ORDER BY b.Branch_Name";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
        return build("BRANCH_ACTIVITY", "Branch Activity Report", List.of("Branch", "City", "Accounts", "TxnCount", "TxnVolume"), rows);
    }

    @Override
    public ReportData generateLoanRepaymentReport() {
        String sql = "SELECT l.Loan_ID AS \"LoanId\", "
                + "c.First_Name || ' ' || c.Last_Name AS \"Customer\", "
                + "l.Loan_Type AS \"LoanType\", "
                + "l.Loan_Status AS \"Status\", "
                + "l.Principal_Amount AS \"Principal\", "
                + "l.Outstanding_Bal AS \"Outstanding\", "
                + "COUNT(p.Payment_ID) AS \"Payments\", "
                + "NVL(SUM(p.Amount_Paid),0) AS \"TotalPaid\" "
                + "FROM LOAN l "
                + "JOIN CUSTOMER c ON l.Customer_ID = c.Customer_ID "
                + "LEFT JOIN LOAN_PAYMENT p ON p.Loan_ID = l.Loan_ID "
                + "GROUP BY l.Loan_ID, c.First_Name, c.Last_Name, l.Loan_Type, l.Loan_Status, l.Principal_Amount, l.Outstanding_Bal "
                + "ORDER BY l.Loan_ID";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
        return build("LOAN_REPAYMENT", "Loan Repayment Report", List.of("LoanId", "Customer", "LoanType", "Status", "Principal", "Outstanding", "Payments", "TotalPaid"), rows);
    }

    private ReportData build(String type, String title, List<String> headers, List<Map<String, Object>> rows) {
        ReportData data = new ReportData(headers, rows);
        data.setReportType(type);
        data.setTitle(title);
        data.setGeneratedAt(LocalDateTime.now());
        return data;
    }
}
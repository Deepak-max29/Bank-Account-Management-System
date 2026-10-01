package com.bank.service;

import com.bank.dto.request.LoanRequest;
import com.bank.dto.response.LoanScheduleEntry;
import com.bank.model.Loan;
import java.util.List;

public interface LoanService {
    List<Loan> getAllLoans();
    Loan getLoanById(Long id);
    Loan applyForLoan(LoanRequest request);
    int count();
    List<Loan> getLoansByCustomer(Long customerId);
    List<Loan> getLoansByBranch(Long branchId);
    void approveLoan(Long loanId);
    void rejectLoan(Long loanId);
    List<LoanScheduleEntry> calculateEmiSchedule(Long loanId);
}

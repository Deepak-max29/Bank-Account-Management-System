package com.bank.service.impl;

import com.bank.dto.request.LoanRequest;
import com.bank.dto.response.LoanScheduleEntry;
import com.bank.exception.BusinessRuleException;
import com.bank.exception.ResourceNotFoundException;
import com.bank.model.Loan;
import com.bank.repository.BranchRepository;
import com.bank.repository.CustomerRepository;
import com.bank.repository.EmployeeRepository;
import com.bank.repository.LoanRepository;
import com.bank.service.AuditLogService;
import com.bank.service.LoanService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LoanServiceImpl implements LoanService {

    private final LoanRepository loanRepository;
    private final CustomerRepository customerRepository;
    private final BranchRepository branchRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditLogService auditLogService;

    @Override
    public List<Loan> getAllLoans() {
        return loanRepository.findAll();
    }

    @Override
    public Loan getLoanById(Long id) {
        return loanRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Loan not found"));
    }

    @Override
    @Transactional
    public Loan applyForLoan(LoanRequest request) {
        customerRepository.findById(request.getCustomerId()).orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        branchRepository.findById(request.getBranchId()).orElseThrow(() -> new ResourceNotFoundException("Branch not found"));
        
        Loan loan = Loan.builder()
                .customerId(request.getCustomerId())
                .branchId(request.getBranchId())
                .sanctionedByEmp(request.getSanctionedByEmp())
                .sanctionDate(LocalDate.now())
                .loanType(request.getLoanType())
                .principalAmount(request.getPrincipalAmount())
                .interestRate(request.getInterestRate())
                .loanTenure(request.getLoanTenure())
                .loanStatus("PENDING")
                .outstandingBal(BigDecimal.ZERO)
                .build();
        Loan saved = loanRepository.save(loan);
        auditLogService.logAction("APPLY_LOAN", null, null, "Applied for " + saved.getLoanType() + " loan", null);
        return saved;
    }

    @Override
    public int count() {
        return loanRepository.count();
    }

    @Override
    public List<Loan> getLoansByCustomer(Long customerId) {
        return loanRepository.findByCustomerId(customerId);
    }

    @Override
    public List<Loan> getLoansByBranch(Long branchId) {
        return loanRepository.findByBranchId(branchId);
    }

    @Override
    @Transactional
    public void approveLoan(Long loanId) {
        Loan loan = getLoanById(loanId);
        if (!"PENDING".equals(loan.getLoanStatus())) {
            throw new BusinessRuleException("Only PENDING loans can be approved");
        }
        loanRepository.updateStatus(loanId, "ACTIVE");
        
        // Calculate total payable = Principal + Interest (simple calculation for demonstration, or compound)
        // Here we just set outstanding balance to principal as a baseline, or P + (P*R*T)/100
        BigDecimal p = loan.getPrincipalAmount();
        BigDecimal r = loan.getInterestRate();
        BigDecimal t = new BigDecimal(loan.getLoanTenure()).divide(new BigDecimal(12), 4, RoundingMode.HALF_UP);
        BigDecimal interest = p.multiply(r).multiply(t).divide(new BigDecimal(100), 2, RoundingMode.HALF_UP);
        BigDecimal outstanding = p.add(interest);
        
        loanRepository.updateOutstandingBalance(loanId, outstanding);
        
        auditLogService.logAction("APPROVE_LOAN", null, null, "Approved loan " + loanId, null);
    }

    @Override
    @Transactional
    public void rejectLoan(Long loanId) {
        Loan loan = getLoanById(loanId);
        if (!"PENDING".equals(loan.getLoanStatus())) {
            throw new BusinessRuleException("Only PENDING loans can be rejected");
        }
        loanRepository.updateStatus(loanId, "REJECTED");
        auditLogService.logAction("REJECT_LOAN", null, null, "Rejected loan " + loanId, null);
    }

    @Override
    public List<LoanScheduleEntry> calculateEmiSchedule(Long loanId) {
        Loan loan = getLoanById(loanId);
        BigDecimal p = loan.getPrincipalAmount();
        BigDecimal r = loan.getInterestRate().divide(new BigDecimal(1200), 10, RoundingMode.HALF_UP); // monthly rate
        int n = loan.getLoanTenure();
        
        if (r.compareTo(BigDecimal.ZERO) == 0) {
            BigDecimal emi = p.divide(new BigDecimal(n), 2, RoundingMode.HALF_UP);
            List<LoanScheduleEntry> schedule = new ArrayList<>();
            for (int i=1; i<=n; i++) {
                schedule.add(new LoanScheduleEntry(i, LocalDate.now().plusMonths(i), emi, emi, BigDecimal.ZERO, p.subtract(emi.multiply(new BigDecimal(i)))));
            }
            return schedule;
        }

        double pVal = p.doubleValue();
        double rVal = r.doubleValue();
        double emiVal = (pVal * rVal * Math.pow(1 + rVal, n)) / (Math.pow(1 + rVal, n) - 1);
        BigDecimal emi = new BigDecimal(emiVal).setScale(2, RoundingMode.HALF_UP);

        List<LoanScheduleEntry> schedule = new ArrayList<>();
        BigDecimal balance = p;
        for (int i = 1; i <= n; i++) {
            BigDecimal interestComp = balance.multiply(r).setScale(2, RoundingMode.HALF_UP);
            BigDecimal principalComp = emi.subtract(interestComp);
            balance = balance.subtract(principalComp);
            if (balance.compareTo(BigDecimal.ZERO) < 0) balance = BigDecimal.ZERO;
            schedule.add(new LoanScheduleEntry(i, LocalDate.now().plusMonths(i), emi, principalComp, interestComp, balance));
        }
        return schedule;
    }
}
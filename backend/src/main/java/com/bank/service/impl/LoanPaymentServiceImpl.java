package com.bank.service.impl;

import com.bank.dto.request.LoanPaymentRequest;
import com.bank.exception.BusinessRuleException;
import com.bank.exception.ResourceNotFoundException;
import com.bank.model.Loan;
import com.bank.model.LoanPayment;
import com.bank.repository.LoanPaymentRepository;
import com.bank.repository.LoanRepository;
import com.bank.service.AuditLogService;
import com.bank.service.LoanPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LoanPaymentServiceImpl implements LoanPaymentService {

    private final LoanPaymentRepository loanPaymentRepository;
    private final LoanRepository loanRepository;
    private final AuditLogService auditLogService;

    @Override
    public List<LoanPayment> getAllPayments() {
        return loanPaymentRepository.findAll();
    }

    @Override
    public LoanPayment getPaymentById(Long id) {
        return loanPaymentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
    }

    @Override
    public List<LoanPayment> getPaymentsByLoan(Long loanId) {
        return loanPaymentRepository.findByLoanId(loanId);
    }

    @Override
    @Transactional
    public LoanPayment makePayment(LoanPaymentRequest request) {
        Loan loan = loanRepository.findById(request.getLoanId()).orElseThrow(() -> new ResourceNotFoundException("Loan not found"));
        if (!"ACTIVE".equals(loan.getLoanStatus())) {
            throw new BusinessRuleException("Loan is not active");
        }
        if (request.getAmountPaid().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Payment amount must be greater than zero");
        }
        if (request.getAmountPaid().compareTo(loan.getOutstandingBal()) > 0) {
            throw new BusinessRuleException("Payment amount exceeds outstanding balance");
        }

        BigDecimal newBalance = loan.getOutstandingBal().subtract(request.getAmountPaid());
        
        LoanPayment payment = LoanPayment.builder()
                .loanId(loan.getLoanId())
                .paymentDate(LocalDate.now())
                .amountPaid(request.getAmountPaid())
                .remainingBalance(newBalance)
                .paymentMode(request.getPaymentMode())
                .paymentMethod(request.getPaymentMode())
                .remarks(request.getRemarks())
                .build();
        LoanPayment saved = loanPaymentRepository.save(payment);
        
        loanRepository.updateOutstandingBalance(loan.getLoanId(), newBalance);
        if (newBalance.compareTo(BigDecimal.ZERO) == 0) {
            loanRepository.updateStatus(loan.getLoanId(), "CLOSED");
        }
        
        auditLogService.logAction("LOAN_PAYMENT", null, null, "Made payment of " + request.getAmountPaid() + " for loan " + loan.getLoanId(), null);
        return saved;
    }
}
package com.bank.service;

import com.bank.dto.request.LoanPaymentRequest;
import com.bank.model.LoanPayment;
import java.util.List;

public interface LoanPaymentService {
    List<LoanPayment> getAllPayments();
    LoanPayment getPaymentById(Long id);
    List<LoanPayment> getPaymentsByLoan(Long loanId);
    LoanPayment makePayment(LoanPaymentRequest request);
}

package com.bank.service;

import com.bank.dto.request.BankRequest;
import com.bank.model.Bank;
import java.util.List;

public interface BankService {
    List<Bank> getAllBanks();
    Bank getBankById(Long id);
    Bank createBank(BankRequest request);
    Bank updateBank(Long id, BankRequest request);
    void deleteBank(Long id);
}

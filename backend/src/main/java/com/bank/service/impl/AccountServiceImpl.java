package com.bank.service.impl;

import com.bank.dto.request.AccountRequest;
import com.bank.exception.BusinessRuleException;
import com.bank.exception.ResourceNotFoundException;
import com.bank.model.Account;
import com.bank.model.Customer;
import com.bank.repository.AccountRepository;
import com.bank.repository.BranchRepository;
import com.bank.repository.CustomerRepository;
import com.bank.service.AccountService;
import com.bank.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {

    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final BranchRepository branchRepository;
    private final AuditLogService auditLogService;

    @Override
    public List<Account> getAllAccounts() {
        return accountRepository.findAll();
    }

    @Override
    public Account getAccountById(Long id) {
        return accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with no: " + id));
    }

    @Override
    @Transactional
    public Account openAccount(AccountRequest request) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        if (!"VERIFIED".equals(customer.getKycStatus())) {
            throw new BusinessRuleException("Customer KYC must be VERIFIED to open an account");
        }
        branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));
        
        BigDecimal initialBalance = request.getInitialBalance() != null ? request.getInitialBalance() : BigDecimal.ZERO;
        Account account = Account.builder()
                .customerId(request.getCustomerId())
                .branchId(request.getBranchId())
                .accountType(request.getAccountType())
                .balance(initialBalance)
                .status("ACTIVE")
                .openedDate(LocalDate.now())
                .openDate(LocalDate.now())
                .initialBalance(initialBalance)
                .initialDeposit(initialBalance)
                .build();
        Account saved = accountRepository.save(account);
        auditLogService.logAction("OPEN_ACCOUNT", saved.getAccountNo(), null, "Opened " + saved.getAccountType() + " account", null);
        return saved;
    }

    @Override
    public int count() {
        return accountRepository.count();
    }

    @Override
    public int countActive() {
        return accountRepository.countActive();
    }

    @Override
    public List<Account> getAccountsByCustomer(Long customerId) {
        return accountRepository.findByCustomerId(customerId);
    }

    @Override
    public List<Account> getAccountsByBranch(Long branchId) {
        return accountRepository.findByBranchId(branchId);
    }

    @Override
    @Transactional
    public void changeAccountStatus(Long accountNo, String newStatus) {
        accountRepository.findById(accountNo)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        accountRepository.updateStatus(accountNo, newStatus);
        auditLogService.logAction("ACCOUNT_STATUS_CHANGE", accountNo, null, "Status changed to " + newStatus, null);
    }
}
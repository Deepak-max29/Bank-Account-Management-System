package com.bank.service.impl;

import com.bank.dto.request.TransactionRequest;
import com.bank.dto.request.TransferRequest;
import com.bank.dto.response.PagedResponse;
import com.bank.dto.response.TransactionReceipt;
import com.bank.exception.BusinessRuleException;
import com.bank.exception.InsufficientFundsException;
import com.bank.exception.ResourceNotFoundException;
import com.bank.model.Account;
import com.bank.model.Customer;
import com.bank.model.Transaction;
import com.bank.repository.AccountRepository;
import com.bank.repository.CustomerRepository;
import com.bank.repository.TransactionRepository;
import com.bank.service.AuditLogService;
import com.bank.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CustomerRepository customerRepository;
    private final AuditLogService auditLogService;

    @Value("${bank.savings.minimum-balance:500}")
    private BigDecimal savingsMinBalance;

    @Value("${bank.current.minimum-balance:1000}")
    private BigDecimal currentMinBalance;

    @Value("${bank.transfer.max-amount:1000000}")
    private BigDecimal maxTransferAmount;

    @Override
    @Transactional
    public TransactionReceipt deposit(TransactionRequest request) {
        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Deposit amount must be greater than zero");
        }
        Account account = accountRepository.findByIdForUpdate(request.getAccountNo())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        if (!"ACTIVE".equals(account.getStatus())) {
            throw new BusinessRuleException("Account is not active");
        }

        BigDecimal newBalance = account.getBalance().add(request.getAmount());
        accountRepository.updateBalance(account.getAccountNo(), newBalance);

        Transaction txn = Transaction.builder()
                .accountNo(account.getAccountNo())
                .txnType("DEPOSIT")
                .amount(request.getAmount())
                .balanceAfter(newBalance)
                .channel(request.getChannel())
                .txnDate(LocalDateTime.now())
                .remarks(request.getRemarks())
                .build();
        Transaction saved = transactionRepository.save(txn);
        
        auditLogService.logAction("DEPOSIT", account.getAccountNo(), null, "Deposited " + request.getAmount(), null);
        
        return new TransactionReceipt(saved.getTxnId(), saved.getAccountNo(), saved.getTxnType(), saved.getAmount(), saved.getBalanceAfter(), saved.getTxnDate(), saved.getRemarks());
    }

    @Override
    @Transactional
    public TransactionReceipt withdraw(TransactionRequest request) {
        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Withdrawal amount must be greater than zero");
        }
        Account account = accountRepository.findByIdForUpdate(request.getAccountNo())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        if (!"ACTIVE".equals(account.getStatus())) {
            throw new BusinessRuleException("Account is not active");
        }
        Customer customer = customerRepository.findById(account.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        if (!"VERIFIED".equals(customer.getKycStatus())) {
            throw new BusinessRuleException("KYC must be VERIFIED for withdrawals");
        }

        BigDecimal minBalance = "SAVINGS".equalsIgnoreCase(account.getAccountType()) ? savingsMinBalance : currentMinBalance;
        if (account.getBalance().subtract(request.getAmount()).compareTo(minBalance) < 0) {
            throw new InsufficientFundsException("Insufficient funds. Minimum balance must be maintained.");
        }

        BigDecimal newBalance = account.getBalance().subtract(request.getAmount());
        accountRepository.updateBalance(account.getAccountNo(), newBalance);

        Transaction txn = Transaction.builder()
                .accountNo(account.getAccountNo())
                .txnType("WITHDRAWAL")
                .amount(request.getAmount())
                .balanceAfter(newBalance)
                .channel(request.getChannel())
                .txnDate(LocalDateTime.now())
                .remarks(request.getRemarks())
                .build();
        Transaction saved = transactionRepository.save(txn);
        
        auditLogService.logAction("WITHDRAWAL", account.getAccountNo(), null, "Withdrew " + request.getAmount(), null);

        return new TransactionReceipt(saved.getTxnId(), saved.getAccountNo(), saved.getTxnType(), saved.getAmount(), saved.getBalanceAfter(), saved.getTxnDate(), saved.getRemarks());
    }

    @Override
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public TransactionReceipt transfer(TransferRequest request) {
        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Transfer amount must be greater than zero");
        }

        // Idempotency: if this key was already processed, return the original receipt
        // instead of executing the transfer a second time (retry safety).
        Optional<Transaction> replay = transactionRepository.findByIdempotencyKey(request.getIdempotencyKey());
        if (replay.isPresent()) {
            Transaction existingTxn = replay.get();
            return new TransactionReceipt(existingTxn.getTxnId(), existingTxn.getAccountNo(), existingTxn.getTxnType(),
                    existingTxn.getAmount(), existingTxn.getBalanceAfter(), existingTxn.getTxnDate(), existingTxn.getRemarks());
        }

        if (request.getAmount().compareTo(maxTransferAmount) > 0) {
            throw new BusinessRuleException("Transfer amount exceeds maximum limit of " + maxTransferAmount);
        }
        if (request.getSourceAccountNo().equals(request.getDestinationAccountNo())) {
            throw new BusinessRuleException("Source and destination accounts must be different");
        }

        Account source, dest;
        if (request.getSourceAccountNo().compareTo(request.getDestinationAccountNo()) < 0) {
            source = accountRepository.findByIdForUpdate(request.getSourceAccountNo()).orElseThrow(() -> new ResourceNotFoundException("Source account not found"));
            dest = accountRepository.findByIdForUpdate(request.getDestinationAccountNo()).orElseThrow(() -> new ResourceNotFoundException("Destination account not found"));
        } else {
            dest = accountRepository.findByIdForUpdate(request.getDestinationAccountNo()).orElseThrow(() -> new ResourceNotFoundException("Destination account not found"));
            source = accountRepository.findByIdForUpdate(request.getSourceAccountNo()).orElseThrow(() -> new ResourceNotFoundException("Source account not found"));
        }

        if (!"ACTIVE".equals(source.getStatus()) || !"ACTIVE".equals(dest.getStatus())) {
            throw new BusinessRuleException("Both accounts must be ACTIVE");
        }

        Customer sourceCustomer = customerRepository.findById(source.getCustomerId()).orElseThrow();
        if (!"VERIFIED".equals(sourceCustomer.getKycStatus())) {
            throw new BusinessRuleException("Source customer KYC must be VERIFIED for transfers");
        }

        BigDecimal minBalance = "SAVINGS".equalsIgnoreCase(source.getAccountType()) ? savingsMinBalance : currentMinBalance;
        if (source.getBalance().subtract(request.getAmount()).compareTo(minBalance) < 0) {
            throw new InsufficientFundsException("Insufficient funds in source account. Minimum balance must be maintained.");
        }

        BigDecimal sourceNewBal = source.getBalance().subtract(request.getAmount());
        BigDecimal destNewBal = dest.getBalance().add(request.getAmount());
        
        accountRepository.updateBalance(source.getAccountNo(), sourceNewBal);
        accountRepository.updateBalance(dest.getAccountNo(), destNewBal);
        
        LocalDateTime now = LocalDateTime.now();

        Transaction debitTxn = Transaction.builder()
                .accountNo(source.getAccountNo())
                .txnType("TRANSFER_DEBIT")
                .amount(request.getAmount())
                .balanceAfter(sourceNewBal)
                .channel(request.getChannel())
                .txnDate(now)
                .remarks(request.getRemarks())
                .idempotencyKey(request.getIdempotencyKey())
                .build();
        Transaction savedDebit = transactionRepository.save(debitTxn);

        Transaction creditTxn = Transaction.builder()
                .accountNo(dest.getAccountNo())
                .txnType("TRANSFER_CREDIT")
                .amount(request.getAmount())
                .balanceAfter(destNewBal)
                .channel(request.getChannel())
                .txnDate(now)
                .refTxnId(savedDebit.getTxnId())
                .remarks(request.getRemarks())
                .build();
        transactionRepository.save(creditTxn);
        
        auditLogService.logAction("TRANSFER_DEBIT", source.getAccountNo(), null, "Transferred " + request.getAmount() + " to " + dest.getAccountNo(), null);
        auditLogService.logAction("TRANSFER_CREDIT", dest.getAccountNo(), null, "Received " + request.getAmount() + " from " + source.getAccountNo(), null);

        return new TransactionReceipt(savedDebit.getTxnId(), source.getAccountNo(), savedDebit.getTxnType(), savedDebit.getAmount(), savedDebit.getBalanceAfter(), savedDebit.getTxnDate(), savedDebit.getRemarks());
    }

    @Override
    public Transaction getTransactionById(Long id) {
        return transactionRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
    }

    @Override
    public List<Transaction> getTransactionsByAccount(Long accountNo) {
        return transactionRepository.findByAccountNo(accountNo);
    }

    @Override
    public PagedResponse<Transaction> getTransactionHistory(Long accountNo, String type, String channel, LocalDate start, LocalDate end, int page, int size) {
        List<Transaction> content = transactionRepository.findPaged(accountNo, type, channel, start, end, page, size);
        int total = transactionRepository.countFiltered(accountNo, type, channel, start, end);
        int totalPages = (int) Math.ceil((double) total / size);
        return new PagedResponse<>(content, page, size, total, totalPages, page >= totalPages - 1);
    }

    @Override
    public List<Transaction> getRecentTransactions(int limit) {
        return transactionRepository.findRecent(limit);
    }
}

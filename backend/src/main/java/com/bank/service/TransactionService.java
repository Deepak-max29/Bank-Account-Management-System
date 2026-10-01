package com.bank.service;

import com.bank.dto.request.TransactionRequest;
import com.bank.dto.request.TransferRequest;
import com.bank.dto.response.PagedResponse;
import com.bank.dto.response.TransactionReceipt;
import com.bank.model.Transaction;
import java.time.LocalDate;
import java.util.List;

public interface TransactionService {
    TransactionReceipt deposit(TransactionRequest request);
    TransactionReceipt withdraw(TransactionRequest request);
    TransactionReceipt transfer(TransferRequest request);
    Transaction getTransactionById(Long id);
    List<Transaction> getTransactionsByAccount(Long accountNo);
    PagedResponse<Transaction> getTransactionHistory(Long accountNo, String type, String channel, LocalDate start, LocalDate end, int page, int size);
    List<Transaction> getRecentTransactions(int limit);
}

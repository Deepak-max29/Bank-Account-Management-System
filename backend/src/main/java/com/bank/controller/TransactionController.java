package com.bank.controller;

import com.bank.dto.request.TransactionRequest;
import com.bank.dto.request.TransferRequest;
import com.bank.dto.response.ApiResponse;
import com.bank.dto.response.PagedResponse;
import com.bank.dto.response.TransactionReceipt;
import com.bank.model.Transaction;
import com.bank.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<Transaction>>> getRecentTransactions(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(transactionService.getRecentTransactions(limit)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Transaction>> getTransactionById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(transactionService.getTransactionById(id)));
    }

    @GetMapping("/account/{accountNo}")
    public ResponseEntity<ApiResponse<List<Transaction>>> getTransactionsByAccount(@PathVariable Long accountNo) {
        return ResponseEntity.ok(ApiResponse.ok(transactionService.getTransactionsByAccount(accountNo)));
    }

    @GetMapping("/account/{accountNo}/history")
    public ResponseEntity<ApiResponse<PagedResponse<Transaction>>> getTransactionHistory(
            @PathVariable Long accountNo,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String channel,
            @RequestParam(required = false) LocalDate start,
            @RequestParam(required = false) LocalDate end,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(transactionService.getTransactionHistory(accountNo, type, channel, start, end, page, size)));
    }

    @PostMapping("/deposit")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<TransactionReceipt>> deposit(@Valid @RequestBody TransactionRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(transactionService.deposit(request), "Deposit successful"));
    }

    @PostMapping("/withdraw")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<TransactionReceipt>> withdraw(@Valid @RequestBody TransactionRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(transactionService.withdraw(request), "Withdrawal successful"));
    }

    @PostMapping("/transfer")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<ApiResponse<TransactionReceipt>> transfer(@Valid @RequestBody TransferRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(transactionService.transfer(request), "Transfer successful"));
    }
}
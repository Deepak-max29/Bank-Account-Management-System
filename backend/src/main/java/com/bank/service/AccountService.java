package com.bank.service;

import com.bank.dto.request.AccountRequest;
import com.bank.model.Account;
import java.util.List;

public interface AccountService {
    List<Account> getAllAccounts();
    Account getAccountById(Long id);
    Account openAccount(AccountRequest request);
    int count();
    int countActive();
    List<Account> getAccountsByCustomer(Long customerId);
    List<Account> getAccountsByBranch(Long branchId);
    void changeAccountStatus(Long accountNo, String newStatus);
}

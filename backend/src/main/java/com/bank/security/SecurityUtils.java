package com.bank.security;

import com.bank.model.Account;
import com.bank.model.AppUser;
import com.bank.model.Loan;
import com.bank.repository.AccountRepository;
import com.bank.repository.AppUserRepository;
import com.bank.repository.LoanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class SecurityUtils {

    private final AppUserRepository appUserRepository;
    private final AccountRepository accountRepository;
    private final LoanRepository loanRepository;

    public Optional<AppUser> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof org.springframework.security.authentication.AnonymousAuthenticationToken) {
            return Optional.empty();
        }
        return appUserRepository.findByUsername(auth.getName());
    }

    public boolean isCustomer() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return false;
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_CUSTOMER") || a.equals("CUSTOMER"));
    }

    public Long getCurrentCustomerId() {
        return getCurrentUser().map(AppUser::getCustomerId).orElse(null);
    }

    public void validateAccountAccess(Long accountNo) {
        if (!isCustomer()) return;
        Long customerId = getCurrentCustomerId();
        if (customerId == null) {
            throw new AccessDeniedException("Customer profile not linked");
        }
        Optional<Account> acc = accountRepository.findById(accountNo);
        if (acc.isEmpty() || !customerId.equals(acc.get().getCustomerId())) {
            throw new AccessDeniedException("Access denied: You do not have permission to access this account");
        }
    }

    public void validateLoanAccess(Long loanId) {
        if (!isCustomer()) return;
        Long customerId = getCurrentCustomerId();
        if (customerId == null) {
            throw new AccessDeniedException("Customer profile not linked");
        }
        Optional<Loan> loan = loanRepository.findById(loanId);
        if (loan.isEmpty() || !customerId.equals(loan.get().getCustomerId())) {
            throw new AccessDeniedException("Access denied: You do not have permission to access this loan");
        }
    }
}

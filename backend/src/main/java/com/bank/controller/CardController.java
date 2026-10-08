package com.bank.controller;

import com.bank.dto.request.CardRequest;
import com.bank.dto.response.ApiResponse;
import com.bank.model.Card;
import com.bank.security.SecurityUtils;
import com.bank.service.CardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/cards")
@RequiredArgsConstructor
public class CardController {

    private final CardService cardService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Card>>> getAllCards() {
        if (securityUtils.isCustomer()) {
            Long customerId = securityUtils.getCurrentCustomerId();
            if (customerId != null) {
                return ResponseEntity.ok(ApiResponse.ok(cardService.getCardsByCustomer(customerId)));
            }
            return ResponseEntity.ok(ApiResponse.ok(Collections.emptyList()));
        }
        return ResponseEntity.ok(ApiResponse.ok(cardService.getAllCards()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Card>> getCardById(@PathVariable Long id) {
        Card card = cardService.getCardById(id);
        if (securityUtils.isCustomer()) {
            securityUtils.validateAccountAccess(card.getAccountNo());
        }
        return ResponseEntity.ok(ApiResponse.ok(card));
    }

    @GetMapping("/account/{accountNo}")
    public ResponseEntity<ApiResponse<List<Card>>> getCardsByAccount(@PathVariable Long accountNo) {
        if (securityUtils.isCustomer()) {
            securityUtils.validateAccountAccess(accountNo);
        }
        return ResponseEntity.ok(ApiResponse.ok(cardService.getCardsByAccount(accountNo)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF') or hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Card>> issueCard(@Valid @RequestBody CardRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(cardService.issueCard(request), "Card issued successfully"));
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF') or hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> activateCard(@PathVariable Long id) {
        cardService.activateCard(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Card activated successfully"));
    }

    @PatchMapping("/{id}/block")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF') or hasRole('MANAGER') or hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Void>> blockCard(@PathVariable Long id) {
        if (securityUtils.isCustomer()) {
            Card card = cardService.getCardById(id);
            securityUtils.validateAccountAccess(card.getAccountNo());
        }
        cardService.blockCard(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Card blocked successfully"));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF') or hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deactivateCard(@PathVariable Long id) {
        cardService.deactivateCard(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Card deactivated successfully"));
    }

    @PatchMapping("/{id}/check-expiry")
    public ResponseEntity<ApiResponse<Void>> checkExpiry(@PathVariable Long id) {
        if (securityUtils.isCustomer()) {
            Card card = cardService.getCardById(id);
            securityUtils.validateAccountAccess(card.getAccountNo());
        }
        cardService.checkExpiry(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Expiry check completed"));
    }
}
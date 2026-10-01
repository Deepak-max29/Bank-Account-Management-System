package com.bank.service.impl;

import com.bank.dto.request.CardRequest;
import com.bank.exception.BusinessRuleException;
import com.bank.exception.DuplicateResourceException;
import com.bank.exception.ResourceNotFoundException;
import com.bank.model.Account;
import com.bank.model.Card;
import com.bank.repository.AccountRepository;
import com.bank.repository.CardRepository;
import com.bank.service.AuditLogService;
import com.bank.service.CardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class CardServiceImpl implements CardService {

    private final CardRepository cardRepository;
    private final AccountRepository accountRepository;
    private final AuditLogService auditLogService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public List<Card> getAllCards() {
        return cardRepository.findAll();
    }

    @Override
    public Card getCardById(Long id) {
        return cardRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Card not found"));
    }

    @Override
    public List<Card> getCardsByAccount(Long accountNo) {
        return cardRepository.findByAccountNo(accountNo);
    }

    @Override
    @Transactional
    public Card issueCard(CardRequest request) {
        String type = request.getCardType() != null ? request.getCardType().trim().toUpperCase() : "";
        if (!"DEBIT".equals(type) && !"CREDIT".equals(type)) {
            throw new BusinessRuleException("Card type must be either DEBIT or CREDIT");
        }
        request.setCardType(type);

        Account account = accountRepository.findById(request.getAccountNo()).orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        if (!"ACTIVE".equals(account.getStatus())) {
            throw new BusinessRuleException("Account is not active");
        }
        if (cardRepository.existsByAccountNoAndType(request.getAccountNo(), request.getCardType())) {
            throw new DuplicateResourceException("Card of type " + request.getCardType() + " already exists for this account");
        }

        String bin = "DEBIT".equals(request.getCardType()) ? "411111" : "512345";
        String cardNumber = cardRepository.generateCardNumber(bin);
        String cvv = String.format("%03d", new Random().nextInt(1000));
        String cvvHash = passwordEncoder.encode(cvv);

        Card card = Card.builder()
                .accountNo(request.getAccountNo())
                .cardNumber(cardNumber)
                .cardType(request.getCardType())
                .expiryDate(LocalDate.now().plusYears(5))
                .cvvHash(cvvHash)
                .cardStatus("INACTIVE")
                .status("INACTIVE")
                .issueDate(LocalDate.now())
                .build();
        Card saved = cardRepository.save(card);
        auditLogService.logAction("ISSUE_CARD", account.getAccountNo(), null, "Issued " + request.getCardType() + " card", null);
        return saved;
    }

    @Override
    @Transactional
    public void activateCard(Long id) {
        Card card = getCardById(id);
        if ("EXPIRED".equals(card.getCardStatus()) || (card.getExpiryDate() != null && card.getExpiryDate().isBefore(LocalDate.now()))) {
            throw new BusinessRuleException("Cannot activate an expired card");
        }
        cardRepository.updateStatus(id, "ACTIVE");
        auditLogService.logAction("ACTIVATE_CARD", null, null, "Activated card " + id, null);
    }

    @Override
    @Transactional
    public void blockCard(Long id) {
        getCardById(id);
        cardRepository.updateStatus(id, "BLOCKED");
        auditLogService.logAction("BLOCK_CARD", null, null, "Blocked card " + id, null);
    }

    @Override
    @Transactional
    public void deactivateCard(Long id) {
        getCardById(id);
        cardRepository.updateStatus(id, "INACTIVE");
        auditLogService.logAction("DEACTIVATE_CARD", null, null, "Deactivated card " + id, null);
    }

    @Override
    @Transactional
    public void checkExpiry(Long id) {
        Card card = getCardById(id);
        if (card.getExpiryDate() != null && card.getExpiryDate().isBefore(LocalDate.now())) {
            cardRepository.updateStatus(id, "EXPIRED");
            auditLogService.logAction("EXPIRE_CARD", null, null, "Card " + id + " has expired", null);
        }
    }
}
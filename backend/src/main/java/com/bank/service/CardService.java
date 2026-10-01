package com.bank.service;

import com.bank.dto.request.CardRequest;
import com.bank.model.Card;
import java.util.List;

public interface CardService {
    List<Card> getAllCards();
    Card getCardById(Long id);
    List<Card> getCardsByAccount(Long accountNo);
    Card issueCard(CardRequest request);
    void activateCard(Long id);
    void blockCard(Long id);
    void deactivateCard(Long id);
    void checkExpiry(Long id);
}

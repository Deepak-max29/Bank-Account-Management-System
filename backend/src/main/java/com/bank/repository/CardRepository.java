package com.bank.repository;

import com.bank.model.Card;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class CardRepository {

    private final JdbcTemplate jdbcTemplate;

    public CardRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Card> cardRowMapper = (rs, rowNum) -> {
        Card card = Card.builder()
                .cardId(rs.getLong("CARD_ID"))
                .accountNo(rs.getLong("ACCOUNT_NO"))
                .cardNumber(rs.getString("CARD_NUMBER"))
                .cardType(rs.getString("CARD_TYPE"))
                .expiryDate(rs.getDate("EXPIRY_DATE") != null ? rs.getDate("EXPIRY_DATE").toLocalDate() : null)
                .cvvHash(rs.getString("CVV_HASH"))
                .cardStatus(rs.getString("CARD_STATUS"))
                .status(rs.getString("CARD_STATUS"))
                .issueDate(rs.getDate("ISSUE_DATE") != null ? rs.getDate("ISSUE_DATE").toLocalDate() : null)
                .build();
        try {
            String fn = rs.getString("FIRST_NAME");
            String ln = rs.getString("LAST_NAME");
            if (fn != null || ln != null) {
                card.setCustomerName(((fn != null ? fn : "") + " " + (ln != null ? ln : "")).trim());
            }
        } catch (Exception ignored) {}
        return card;
    };

    public List<Card> findAll() {
        return jdbcTemplate.query(
                "SELECT CD.*, C.FIRST_NAME, C.LAST_NAME FROM CARD CD JOIN ACCOUNT A ON CD.ACCOUNT_NO = A.ACCOUNT_NO JOIN CUSTOMER C ON A.CUSTOMER_ID = C.CUSTOMER_ID ORDER BY CD.CARD_ID DESC",
                cardRowMapper);
    }

    public Optional<Card> findById(Long id) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(
                    "SELECT CD.*, C.FIRST_NAME, C.LAST_NAME FROM CARD CD JOIN ACCOUNT A ON CD.ACCOUNT_NO = A.ACCOUNT_NO JOIN CUSTOMER C ON A.CUSTOMER_ID = C.CUSTOMER_ID WHERE CD.CARD_ID = ?",
                    cardRowMapper, id));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Card save(Card card) {
        Long id = jdbcTemplate.queryForObject("SELECT SEQ_CARD_ID.NEXTVAL FROM DUAL", Long.class);
        jdbcTemplate.update(
                "INSERT INTO CARD (CARD_ID, ACCOUNT_NO, CARD_NUMBER, CARD_TYPE, EXPIRY_DATE, CVV_HASH, CARD_STATUS, ISSUE_DATE) VALUES (?, ?, ?, ?, ?, ?, ?, SYSDATE)",
                id, card.getAccountNo(), card.getCardNumber(), card.getCardType(), card.getExpiryDate(), card.getCvvHash(), card.getCardStatus());
        card.setCardId(id);
        return card;
    }

    public int count() {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM CARD", Integer.class);
    }

    public List<Card> findByAccountNo(Long accountNo) {
        return jdbcTemplate.query(
                "SELECT CD.*, C.FIRST_NAME, C.LAST_NAME FROM CARD CD JOIN ACCOUNT A ON CD.ACCOUNT_NO = A.ACCOUNT_NO JOIN CUSTOMER C ON A.CUSTOMER_ID = C.CUSTOMER_ID WHERE CD.ACCOUNT_NO = ? ORDER BY CD.CARD_ID DESC",
                cardRowMapper, accountNo);
    }

    public void updateStatus(Long cardId, String status) {
        jdbcTemplate.update("UPDATE CARD SET CARD_STATUS = ? WHERE CARD_ID = ?", status, cardId);
    }

    public boolean existsByAccountNoAndType(Long accountNo, String cardType) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM CARD WHERE ACCOUNT_NO = ? AND CARD_TYPE = ?", Integer.class, accountNo, cardType);
        return count != null && count > 0;
    }

    public String generateCardNumber(String prefixOrType) {
        String prefix = (prefixOrType != null && (prefixOrType.startsWith("4") || "DEBIT".equalsIgnoreCase(prefixOrType))) ? "4" : "5";
        StringBuilder sb = new StringBuilder(prefix);
        java.util.Random rnd = new java.util.Random();
        for (int i = 0; i < 15; i++) {
            sb.append(rnd.nextInt(10));
        }
        return sb.toString();
    }
}
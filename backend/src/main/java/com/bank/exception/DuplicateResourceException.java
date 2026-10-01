package com.bank.exception;

public class DuplicateResourceException extends BusinessRuleException {
    public DuplicateResourceException(String message) {
        super(message);
    }
}

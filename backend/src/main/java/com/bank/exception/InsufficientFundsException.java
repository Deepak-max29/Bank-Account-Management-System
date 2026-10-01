package com.bank.exception;

public class InsufficientFundsException extends BusinessRuleException {
    public InsufficientFundsException(String message) {
        super(message);
    }
}

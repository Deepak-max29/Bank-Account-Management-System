package com.bank.exception;

import java.util.List;

public class CsvValidationException extends RuntimeException {
    private final List<String> rowErrors;

    public CsvValidationException(String message, List<String> rowErrors) {
        super(message);
        this.rowErrors = rowErrors;
    }

    public List<String> getRowErrors() {
        return rowErrors;
    }
}

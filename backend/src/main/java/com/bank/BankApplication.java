package com.bank;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * Bank Account Management System
 * College DBMS Project - Spring Boot + Oracle XE
 * 
 * NOTE: This is a demonstration project only.
 * Real banking deployment requires additional security review,
 * regulatory compliance, and independent testing.
 */
@SpringBootApplication
@EnableTransactionManagement
public class BankApplication {
    public static void main(String[] args) {
        SpringApplication.run(BankApplication.class, args);
    }
}

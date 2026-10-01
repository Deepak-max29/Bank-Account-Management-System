package com.bank.service;

import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

public interface CsvService {
    Map<String, Object> importBanks(MultipartFile file);
    Map<String, Object> importBranches(MultipartFile file);
    Map<String, Object> importCustomers(MultipartFile file);
    Map<String, Object> importEmployees(MultipartFile file);
    
    byte[] exportBanks();
    byte[] exportBranches();
    byte[] exportCustomers();
    byte[] exportEmployees();
    byte[] exportAccounts();
    byte[] exportTransactions();
    byte[] exportLoans();
}

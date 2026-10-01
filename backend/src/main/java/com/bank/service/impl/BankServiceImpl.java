package com.bank.service.impl;

import com.bank.dto.request.BankRequest;
import com.bank.exception.DuplicateResourceException;
import com.bank.exception.ResourceNotFoundException;
import com.bank.model.Bank;
import com.bank.repository.BankRepository;
import com.bank.service.AuditLogService;
import com.bank.service.BankService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BankServiceImpl implements BankService {

    private final BankRepository bankRepository;
    private final AuditLogService auditLogService;

    @Override
    public List<Bank> getAllBanks() {
        return bankRepository.findAll();
    }

    @Override
    public Bank getBankById(Long id) {
        return bankRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bank not found with id: " + id));
    }

    @Override
    @Transactional
    public Bank createBank(BankRequest request) {
        if (bankRepository.existsByName(request.getBankName())) {
            throw new DuplicateResourceException("Bank already exists with name: " + request.getBankName());
        }
        Bank bank = Bank.builder()
                .bankName(request.getBankName())
                .headOffice(request.getHeadOffice())
                .contactNo(request.getContactNo())
                .email(request.getEmail())
                .hoAddress(request.getHeadOffice())
                .website(request.getWebsite())
                .build();
        Bank saved = bankRepository.save(bank);
        auditLogService.logAction("CREATE_BANK", null, null, "Created bank: " + saved.getBankName(), null);
        return saved;
    }

    @Override
    @Transactional
    public Bank updateBank(Long id, BankRequest request) {
        Bank existing = getBankById(id);
        if (!existing.getBankName().equals(request.getBankName()) && bankRepository.existsByName(request.getBankName())) {
            throw new DuplicateResourceException("Bank already exists with name: " + request.getBankName());
        }
        existing.setBankName(request.getBankName());
        existing.setHeadOffice(request.getHeadOffice());
        existing.setContactNo(request.getContactNo());
        existing.setEmail(request.getEmail());
        existing.setHoAddress(request.getHeadOffice());
        existing.setWebsite(request.getWebsite());
        bankRepository.update(id, existing);
        auditLogService.logAction("UPDATE_BANK", null, null, "Updated bank: " + existing.getBankName(), null);
        return existing;
    }

    @Override
    @Transactional
    public void deleteBank(Long id) {
        Bank bank = getBankById(id);
        bankRepository.delete(id);
        auditLogService.logAction("DELETE_BANK", null, null, "Deleted bank: " + bank.getBankName(), null);
    }
}
package com.bank.service.impl;

import com.bank.dto.request.BeneficiaryRequest;
import com.bank.exception.BusinessRuleException;
import com.bank.exception.ResourceNotFoundException;
import com.bank.model.Beneficiary;
import com.bank.repository.BeneficiaryRepository;
import com.bank.repository.CustomerRepository;
import com.bank.service.AuditLogService;
import com.bank.service.BeneficiaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BeneficiaryServiceImpl implements BeneficiaryService {

    private final BeneficiaryRepository beneficiaryRepository;
    private final CustomerRepository customerRepository;
    private final AuditLogService auditLogService;

    @Override
    public List<Beneficiary> getAllBeneficiaries() {
        return beneficiaryRepository.findAll();
    }

    @Override
    public Beneficiary getBeneficiaryById(Long id) {
        return beneficiaryRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Beneficiary not found"));
    }

    @Override
    @Transactional
    public Beneficiary addBeneficiary(BeneficiaryRequest request) {
        customerRepository.findById(request.getCustomerId()).orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        if (!request.getIfscCode().matches("^[A-Z]{4}0[A-Z0-9]{6}$")) {
            throw new BusinessRuleException("Invalid IFSC format");
        }
        Beneficiary b = Beneficiary.builder()
                .customerId(request.getCustomerId())
                .beneficiaryAccNo(request.getBeneficiaryAccNo())
                .beneficiaryAccountNo(request.getBeneficiaryAccNo())
                .beneficiaryName(request.getBeneficiaryName())
                .bankName(request.getBankName())
                .ifscCode(request.getIfscCode())
                .maxLimit(request.getMaxLimit() != null ? request.getMaxLimit() : BigDecimal.valueOf(100000))
                .isVerified(false)
                .isActive(true)
                .addedDate(LocalDate.now())
                .build();
        Beneficiary saved = beneficiaryRepository.save(b);
        auditLogService.logAction("ADD_BENEFICIARY", null, null, "Added beneficiary " + saved.getBeneficiaryName(), null);
        return saved;
    }

    @Override
    @Transactional
    public Beneficiary updateBeneficiary(Long id, BeneficiaryRequest request) {
        Beneficiary existing = getBeneficiaryById(id);
        if (!request.getIfscCode().matches("^[A-Z]{4}0[A-Z0-9]{6}$")) {
            throw new BusinessRuleException("Invalid IFSC format");
        }
        existing.setBeneficiaryName(request.getBeneficiaryName());
        existing.setBankName(request.getBankName());
        existing.setIfscCode(request.getIfscCode());
        existing.setBeneficiaryAccNo(request.getBeneficiaryAccNo());
        existing.setBeneficiaryAccountNo(request.getBeneficiaryAccNo());
        existing.setMaxLimit(request.getMaxLimit() != null ? request.getMaxLimit() : existing.getMaxLimit());
        existing.setIsVerified(false); // require re-verification
        beneficiaryRepository.update(id, existing);
        auditLogService.logAction("UPDATE_BENEFICIARY", null, null, "Updated beneficiary " + id, null);
        return existing;
    }

    @Override
    public List<Beneficiary> getBeneficiariesByCustomer(Long customerId) {
        return beneficiaryRepository.findByCustomerId(customerId);
    }

    @Override
    @Transactional
    public void verifyBeneficiary(Long id) {
        beneficiaryRepository.updateVerificationStatus(id, true);
        auditLogService.logAction("VERIFY_BENEFICIARY", null, null, "Verified beneficiary " + id, null);
    }

    @Override
    @Transactional
    public void deactivateBeneficiary(Long id) {
        beneficiaryRepository.updateActiveStatus(id, false);
        auditLogService.logAction("DEACTIVATE_BENEFICIARY", null, null, "Deactivated beneficiary " + id, null);
    }
}
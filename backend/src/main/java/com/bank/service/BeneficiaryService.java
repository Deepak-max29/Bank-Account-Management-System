package com.bank.service;

import com.bank.dto.request.BeneficiaryRequest;
import com.bank.model.Beneficiary;
import java.util.List;

public interface BeneficiaryService {
    List<Beneficiary> getAllBeneficiaries();
    Beneficiary getBeneficiaryById(Long id);
    Beneficiary addBeneficiary(BeneficiaryRequest request);
    Beneficiary updateBeneficiary(Long id, BeneficiaryRequest request);
    List<Beneficiary> getBeneficiariesByCustomer(Long customerId);
    void verifyBeneficiary(Long id);
    void deactivateBeneficiary(Long id);
}

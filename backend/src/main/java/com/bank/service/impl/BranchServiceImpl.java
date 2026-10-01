package com.bank.service.impl;

import com.bank.dto.request.BranchRequest;
import com.bank.exception.BusinessRuleException;
import com.bank.exception.DuplicateResourceException;
import com.bank.exception.ResourceNotFoundException;
import com.bank.model.Branch;
import com.bank.repository.BankRepository;
import com.bank.repository.BranchRepository;
import com.bank.service.AuditLogService;
import com.bank.service.BranchService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BranchServiceImpl implements BranchService {

    private final BranchRepository branchRepository;
    private final BankRepository bankRepository;
    private final AuditLogService auditLogService;

    @Override
    public List<Branch> getAllBranches() {
        return branchRepository.findAll();
    }

    @Override
    public Branch getBranchById(Long id) {
        return branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with id: " + id));
    }

    @Override
    @Transactional
    public Branch createBranch(BranchRequest request) {
        bankRepository.findById(request.getBankId())
                .orElseThrow(() -> new ResourceNotFoundException("Bank not found with id: " + request.getBankId()));
        if (branchRepository.existsByIfscCode(request.getIfscCode())) {
            throw new DuplicateResourceException("Branch already exists with IFSC: " + request.getIfscCode());
        }
        Branch branch = Branch.builder()
                .bankId(request.getBankId())
                .branchName(request.getBranchName())
                .ifscCode(request.getIfscCode())
                .city(request.getCity())
                .state(request.getState())
                .pincode(request.getPincode())
                .address(request.getAddress())
                .contactNumber(request.getContactNumber())
                .email(request.getEmail())
                .build();
        Branch saved = branchRepository.save(branch);
        auditLogService.logAction("CREATE_BRANCH", null, null, "Created branch: " + saved.getBranchName(), null);
        return saved;
    }

    @Override
    @Transactional
    public Branch updateBranch(Long id, BranchRequest request) {
        Branch existing = getBranchById(id);
        bankRepository.findById(request.getBankId())
                .orElseThrow(() -> new ResourceNotFoundException("Bank not found with id: " + request.getBankId()));
        if (!existing.getIfscCode().equals(request.getIfscCode()) && branchRepository.existsByIfscCode(request.getIfscCode())) {
            throw new DuplicateResourceException("Branch already exists with IFSC: " + request.getIfscCode());
        }
        existing.setBankId(request.getBankId());
        existing.setBranchName(request.getBranchName());
        existing.setIfscCode(request.getIfscCode());
        existing.setCity(request.getCity());
        existing.setState(request.getState());
        existing.setPincode(request.getPincode());
        existing.setAddress(request.getAddress());
        existing.setContactNumber(request.getContactNumber());
        existing.setEmail(request.getEmail());
        branchRepository.update(id, existing);
        auditLogService.logAction("UPDATE_BRANCH", null, null, "Updated branch: " + existing.getBranchName(), null);
        return existing;
    }

    @Override
    @Transactional
    public void deleteBranch(Long id) {
        Branch branch = getBranchById(id);
        if (branchRepository.hasReferences(id)) {
            throw new BusinessRuleException("Cannot delete branch with active references");
        }
        branchRepository.delete(id);
        auditLogService.logAction("DELETE_BRANCH", null, null, "Deleted branch: " + branch.getBranchName(), null);
    }

    @Override
    public List<Branch> getBranchesByBank(Long bankId) {
        return branchRepository.findByBankId(bankId);
    }

    @Override
    public List<Branch> getBranchesByCity(String city) {
        return branchRepository.findByCity(city);
    }
}
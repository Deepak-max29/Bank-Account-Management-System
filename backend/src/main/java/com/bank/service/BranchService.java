package com.bank.service;

import com.bank.dto.request.BranchRequest;
import com.bank.model.Branch;
import java.util.List;

public interface BranchService {
    List<Branch> getAllBranches();
    Branch getBranchById(Long id);
    Branch createBranch(BranchRequest request);
    Branch updateBranch(Long id, BranchRequest request);
    void deleteBranch(Long id);
    List<Branch> getBranchesByBank(Long bankId);
    List<Branch> getBranchesByCity(String city);
}

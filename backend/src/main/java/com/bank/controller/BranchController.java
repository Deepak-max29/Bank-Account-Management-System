package com.bank.controller;

import com.bank.dto.request.BranchRequest;
import com.bank.dto.response.ApiResponse;
import com.bank.model.Branch;
import com.bank.service.BranchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/branches")
@RequiredArgsConstructor
public class BranchController {

    private final BranchService branchService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Branch>>> getAllBranches() {
        return ResponseEntity.ok(ApiResponse.ok(branchService.getAllBranches()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Branch>> getBranchById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(branchService.getBranchById(id)));
    }

    @GetMapping("/bank/{bankId}")
    public ResponseEntity<ApiResponse<List<Branch>>> getBranchesByBank(@PathVariable Long bankId) {
        return ResponseEntity.ok(ApiResponse.ok(branchService.getBranchesByBank(bankId)));
    }

    @GetMapping("/city/{city}")
    public ResponseEntity<ApiResponse<List<Branch>>> getBranchesByCity(@PathVariable String city) {
        return ResponseEntity.ok(ApiResponse.ok(branchService.getBranchesByCity(city)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Branch>> createBranch(@Valid @RequestBody BranchRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(branchService.createBranch(request), "Branch created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Branch>> updateBranch(@PathVariable Long id, @Valid @RequestBody BranchRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(branchService.updateBranch(id, request), "Branch updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteBranch(@PathVariable Long id) {
        branchService.deleteBranch(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Branch deleted successfully"));
    }
}
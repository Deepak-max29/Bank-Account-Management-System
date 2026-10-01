package com.bank.service.impl;

import com.bank.dto.request.CustomerRequest;
import com.bank.exception.DuplicateResourceException;
import com.bank.exception.ResourceNotFoundException;
import com.bank.model.Customer;
import com.bank.repository.CustomerRepository;
import com.bank.service.AuditLogService;
import com.bank.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final AuditLogService auditLogService;

    @Override
    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    @Override
    public Customer getCustomerById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
    }

    @Override
    @Transactional
    public Customer createCustomer(CustomerRequest request) {
        if (customerRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Customer already exists with email: " + request.getEmail());
        }
        Customer customer = Customer.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .address(request.getAddress())
                .dob(request.getDateOfBirth())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .kycStatus("PENDING")
                .build();
        Customer saved = customerRepository.save(customer);
        auditLogService.logAction("CREATE_CUSTOMER", null, null, "Created customer: " + saved.getEmail(), null);
        return saved;
    }

    @Override
    @Transactional
    public Customer updateCustomer(Long id, CustomerRequest request) {
        Customer existing = getCustomerById(id);
        if (!existing.getEmail().equals(request.getEmail()) && customerRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Customer already exists with email: " + request.getEmail());
        }
        existing.setFirstName(request.getFirstName());
        existing.setLastName(request.getLastName());
        existing.setEmail(request.getEmail());
        existing.setPhone(request.getPhone());
        existing.setAddress(request.getAddress());
        existing.setDob(request.getDateOfBirth());
        existing.setDateOfBirth(request.getDateOfBirth());
        existing.setGender(request.getGender());
        customerRepository.update(id, existing);
        auditLogService.logAction("UPDATE_CUSTOMER", null, null, "Updated customer details for id: " + id, null);
        return existing;
    }

    @Override
    public List<Customer> searchCustomers(String query) {
        return customerRepository.search(query);
    }

    @Override
    @Transactional
    public void updateKycStatus(Long customerId, String status) {
        Customer customer = getCustomerById(customerId);
        customer.setKycStatus(status);
        customerRepository.update(customerId, customer);
        auditLogService.logAction("UPDATE_KYC", null, null, "KYC status updated to " + status + " for customer " + customerId, null);
    }
}
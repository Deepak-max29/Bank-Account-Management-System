package com.bank.service;

import com.bank.dto.request.CustomerRequest;
import com.bank.model.Customer;
import java.util.List;

public interface CustomerService {
    List<Customer> getAllCustomers();
    Customer getCustomerById(Long id);
    Customer createCustomer(CustomerRequest request);
    Customer updateCustomer(Long id, CustomerRequest request);
    List<Customer> searchCustomers(String query);
    void updateKycStatus(Long customerId, String status);
}

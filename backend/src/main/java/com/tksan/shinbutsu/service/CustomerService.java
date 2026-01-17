package com.tksan.shinbutsu.service;

import com.tksan.shinbutsu.dto.CustomerRequest;
import com.tksan.shinbutsu.dto.CustomerUpdateRequest;
import com.tksan.shinbutsu.entity.Customer;
import com.tksan.shinbutsu.mapper.CustomerMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CustomerService {

    private final CustomerMapper customerMapper;

    public CustomerService(CustomerMapper customerMapper) {
        this.customerMapper = customerMapper;
    }

    public List<Customer> getAllCustomers() {
        return customerMapper.findAll();
    }

    public Customer getCustomerById(String id) {
        Customer customer = customerMapper.findById(id);
        if (customer == null) {
            throw new RuntimeException("Customer not found: " + id);
        }
        return customer;
    }

    @Transactional
    public Customer createCustomer(CustomerRequest request) {
        // IDの重複チェック
        Customer existing = customerMapper.findById(request.getId());
        if (existing != null) {
            throw new RuntimeException("Customer already exists: " + request.getId());
        }

        Customer customer = new Customer(
            request.getId(),
            request.getUsername(),
            request.getEmail(),
            request.getPhoneNumber(),
            request.getPostCode()
        );

        customerMapper.insert(customer);
        return customer;
    }

    @Transactional
    public Customer updateCustomer(String id, CustomerRequest request) {
        // 存在チェック
        Customer existing = customerMapper.findById(id);
        if (existing == null) {
            throw new RuntimeException("Customer not found: " + id);
        }

        Customer customer = new Customer(
            id,
            request.getUsername(),
            request.getEmail(),
            request.getPhoneNumber(),
            request.getPostCode()
        );

        customerMapper.update(customer);
        return customer;
    }

    @Transactional
    public Customer updateCustomer(String id, CustomerUpdateRequest request) {
        // 存在チェック
        Customer existing = customerMapper.findById(id);
        if (existing == null) {
            throw new RuntimeException("Customer not found: " + id);
        }

        Customer customer = new Customer(
            id,
            request.getUsername(),
            request.getEmail(),
            request.getPhoneNumber(),
            request.getPostCode()
        );

        customerMapper.update(customer);
        return customer;
    }

    @Transactional
    public void deleteCustomer(String id) {
        Customer existing = customerMapper.findById(id);
        if (existing == null) {
            throw new RuntimeException("Customer not found: " + id);
        }

        customerMapper.delete(id);
    }
}

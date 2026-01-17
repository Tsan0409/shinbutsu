package com.tksan.shinbutsu.dto;

import com.tksan.shinbutsu.entity.Customer;

public class CustomerResponse {
    private String id;
    private String username;
    private String email;
    private String phoneNumber;
    private String postCode;

    public CustomerResponse() {
    }

    public CustomerResponse(Customer customer) {
        this.id = customer.getId();
        this.username = customer.getUsername();
        this.email = customer.getEmail();
        this.phoneNumber = customer.getPhoneNumber();
        this.postCode = customer.getPostCode();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getPostCode() {
        return postCode;
    }

    public void setPostCode(String postCode) {
        this.postCode = postCode;
    }
}

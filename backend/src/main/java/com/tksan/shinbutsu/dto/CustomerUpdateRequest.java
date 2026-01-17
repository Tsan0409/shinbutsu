package com.tksan.shinbutsu.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CustomerUpdateRequest {

    @NotBlank(message = "ユーザー名は必須です")
    @Size(max = 50, message = "ユーザー名は50文字以内で入力してください")
    private String username;

    @NotBlank(message = "メールアドレスは必須です")
    @Email(message = "正しいメールアドレスを入力してください")
    @Size(max = 50, message = "メールアドレスは50文字以内で入力してください")
    private String email;

    @NotBlank(message = "電話番号は必須です")
    @Pattern(regexp = "^[0-9]{10,11}$", message = "電話番号は10桁または11桁の数字で入力してください")
    private String phoneNumber;

    @NotBlank(message = "郵便番号は必須です")
    @Pattern(regexp = "^[0-9]{7}$", message = "郵便番号は7桁の数字で入力してください")
    private String postCode;

    public CustomerUpdateRequest() {
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

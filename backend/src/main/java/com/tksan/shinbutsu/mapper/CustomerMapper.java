package com.tksan.shinbutsu.mapper;

import com.tksan.shinbutsu.entity.Customer;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface CustomerMapper {

    @Select("SELECT * FROM customer ORDER BY id")
    List<Customer> findAll();

    @Select("SELECT * FROM customer WHERE id = #{id}")
    Customer findById(String id);

    @Insert("INSERT INTO customer (id, username, email, phone_number, post_code) " +
            "VALUES (#{id}, #{username}, #{email}, #{phoneNumber}, #{postCode})")
    void insert(Customer customer);

    @Update("UPDATE customer SET username = #{username}, email = #{email}, " +
            "phone_number = #{phoneNumber}, post_code = #{postCode} WHERE id = #{id}")
    int update(Customer customer);

    @Delete("DELETE FROM customer WHERE id = #{id}")
    int delete(String id);
}

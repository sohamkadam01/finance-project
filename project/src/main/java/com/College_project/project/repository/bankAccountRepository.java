package com.College_project.project.repository;



import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.College_project.project.models.BankAccount;
import com.College_project.project.models.User;

import java.util.List;

@Repository
public interface bankAccountRepository extends JpaRepository<BankAccount, Long> {
    List<BankAccount> findByUser(User user);
    List<BankAccount> findByUserAndIsActive(User user, boolean isActive);
}
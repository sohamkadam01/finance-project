package com.College_project.project.repository;



import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.College_project.project.models.Alert;
import com.College_project.project.models.User;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByUser(User user);
    List<Alert> findByUserAndIsRead(User user, boolean isRead);
    List<Alert> findByUserOrderByCreatedAtDesc(User user);

    List<Alert> findByUser_UserIdAndIsRead(Long userId, boolean isRead);
    List<Alert> findByUser_UserIdOrderByCreatedAtDesc(Long userId);

       // Add this method for checking duplicate reminders
    boolean existsByUserAndMessageContainingAndCreatedAtAfter(User user, String message, LocalDateTime dateTime);
}
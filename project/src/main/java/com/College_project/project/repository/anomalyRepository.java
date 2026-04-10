package com.College_project.project.repository;

import com.College_project.project.models.Anomaly;
import com.College_project.project.models.User;
import com.College_project.project.enums.AnomalySeverity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface anomalyRepository extends JpaRepository<Anomaly, Long> {
    
    // Existing methods
    List<Anomaly> findByUser(User user);
    List<Anomaly> findByUserAndSeverity(User user, AnomalySeverity severity);
    List<Anomaly> findByIsFraud(boolean isFraud);
    
    // NEW METHODS FOR ANOMALY DETECTION
    
    // Find anomalies for a user ordered by reported date (most recent first)
    List<Anomaly> findByUser_UserIdOrderByReportedAtDesc(Long userId);
    
    // Find anomalies for a user with specific severity ordered by reported date
    List<Anomaly> findByUser_UserIdAndSeverityOrderByReportedAtDesc(Long userId, AnomalySeverity severity);
    
    // Find unresolved anomalies (not marked as fraud or false alarm)
    List<Anomaly> findByUserAndIsFraudFalseAndResolutionNoteIsNull(User user);
    
    // Find anomalies by user and date range
    List<Anomaly> findByUserAndReportedAtBetween(User user, LocalDateTime startDate, LocalDateTime endDate);
    
    // Count anomalies by severity for a user
    @Query("SELECT COUNT(a) FROM Anomaly a WHERE a.user.userId = :userId AND a.severity = :severity")
    long countByUserIdAndSeverity(@Param("userId") Long userId, @Param("severity") AnomalySeverity severity);
    
    // Find anomalies by transaction
    List<Anomaly> findByTransaction_TransactionId(Long transactionId);
    
    // Find high severity anomalies that are not resolved
    List<Anomaly> findByUserAndSeverityAndResolutionNoteIsNull(User user, AnomalySeverity severity);
}
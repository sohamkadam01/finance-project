package com.College_project.project.service;

import com.College_project.project.models.Transaction;
import com.College_project.project.models.User;
import com.College_project.project.models.Anomaly;
import com.College_project.project.enums.AnomalySeverity;
import com.College_project.project.enums.AlertType;
import com.College_project.project.enums.TransactionType;
import com.College_project.project.repository.transactionRepository;
import com.College_project.project.repository.anomalyRepository;
import com.College_project.project.repository.AlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnomalyDetectionService {
    
    @Autowired
    private transactionRepository transactionRepository;
    
    @Autowired
    private anomalyRepository anomalyRepository;
    
    @Autowired
    private AlertRepository alertRepository;
    
    // Detect anomalies when a new transaction is added
    @Transactional
    public List<Anomaly> detectAnomalies(Transaction transaction) {
        List<Anomaly> detectedAnomalies = new ArrayList<>();
        User user = transaction.getUser();
        
        // 1. Check for unusually high amount
        Anomaly highAmountAnomaly = checkUnusualAmount(transaction, user);
        if (highAmountAnomaly != null) detectedAnomalies.add(highAmountAnomaly);
        
        // 2. Check for unusual location
        Anomaly locationAnomaly = checkUnusualLocation(transaction, user);
        if (locationAnomaly != null) detectedAnomalies.add(locationAnomaly);
        
        // 3. Check for unusual time
        Anomaly timeAnomaly = checkUnusualTime(transaction);
        if (timeAnomaly != null) detectedAnomalies.add(timeAnomaly);
        
        // 4. Check for duplicate transactions
        Anomaly duplicateAnomaly = checkDuplicateTransaction(transaction, user);
        if (duplicateAnomaly != null) detectedAnomalies.add(duplicateAnomaly);
        
        // 5. Check for rapid consecutive transactions
        Anomaly rapidAnomaly = checkRapidTransactions(transaction, user);
        if (rapidAnomaly != null) detectedAnomalies.add(rapidAnomaly);
        
        // Save all detected anomalies
        for (Anomaly anomaly : detectedAnomalies) {
            anomalyRepository.save(anomaly);
            createAlertForAnomaly(anomaly);
        }
        
        // Mark transaction as flagged if anomalies found
        if (!detectedAnomalies.isEmpty()) {
            transaction.setFlagged(true);
            transaction.setFlagReason(detectedAnomalies.get(0).getReason());
            transactionRepository.save(transaction);
        }
        
        return detectedAnomalies;
    }
    
    // Check for unusually high transaction amount
    private Anomaly checkUnusualAmount(Transaction transaction, User user) {
        // Get user's average transaction amount for last 30 days
        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        List<Transaction> recentTransactions = transactionRepository
            .findByUserAndTransactionDateBetween(user, thirtyDaysAgo, LocalDate.now());
        
        if (recentTransactions.isEmpty()) return null;
        
        double avgAmount = recentTransactions.stream()
            .filter(t -> t.getType() == TransactionType.EXPENSE)
            .mapToDouble(t -> t.getAmount().doubleValue())
            .average()
            .orElse(0);
        
        double stdDev = calculateStandardDeviation(recentTransactions, avgAmount);
        double currentAmount = transaction.getAmount().doubleValue();
        
        // Require at least 5 transactions for a reliable average
        // and ensure the amount is significantly high (e.g., > ₹5000) or 3x standard deviations
        boolean isSignificantlyHigh = currentAmount > 5000 && currentAmount > (avgAmount * 2);
        
        if (recentTransactions.size() >= 5 && (stdDev > 0 && currentAmount > (avgAmount + (3 * stdDev)) || isSignificantlyHigh)) {
            Anomaly anomaly = new Anomaly();
            anomaly.setUser(user);
            anomaly.setTransaction(transaction);
            anomaly.setReason(String.format("Unusually high amount: ₹%.2f (Your average is ₹%.2f, %.1f times higher)", 
                           currentAmount, avgAmount, currentAmount / avgAmount));
            anomaly.setSeverity(currentAmount > (avgAmount + (5 * stdDev)) ? 
                               AnomalySeverity.HIGH : AnomalySeverity.MEDIUM);
            anomaly.setReportedAt(LocalDateTime.now());
            return anomaly;
        }
        
        return null;
    }
    
    // Check for unusual location (if transaction has location data)
    private Anomaly checkUnusualLocation(Transaction transaction, User user) {
        if (transaction.getLocation() == null || transaction.getLocation().isEmpty()) {
            return null;
        }
        
        // Get user's common locations from last 60 days
        LocalDate sixtyDaysAgo = LocalDate.now().minusDays(60);
        List<Transaction> recentTransactions = transactionRepository
            .findByUserAndTransactionDateBetween(user, sixtyDaysAgo, LocalDate.now());
        
        Set<String> commonLocations = recentTransactions.stream()
            .filter(t -> t.getLocation() != null && !t.getLocation().isEmpty())
            .map(Transaction::getLocation)
            .collect(Collectors.toSet());
        
        // If transaction location is new and not in common locations
        if (!commonLocations.isEmpty() && !commonLocations.contains(transaction.getLocation())) {
            Anomaly anomaly = new Anomaly();
            anomaly.setUser(user);
            anomaly.setTransaction(transaction);
            anomaly.setReason(String.format("Transaction from unusual location: %s", transaction.getLocation()));
            anomaly.setSeverity(AnomalySeverity.MEDIUM);
            anomaly.setReportedAt(LocalDateTime.now());
            return anomaly;
        }
        
        return null;
    }
    
    // Check for unusual time (late night transactions)
    private Anomaly checkUnusualTime(Transaction transaction) {
        // Check if transaction was created at unusual hour
        LocalDateTime now = LocalDateTime.now();
        int currentHour = now.getHour();
        
        if (currentHour >= 23 || currentHour <= 5) { // Between 11 PM and 5 AM
            Anomaly anomaly = new Anomaly();
            anomaly.setUser(transaction.getUser());
            anomaly.setTransaction(transaction);
            anomaly.setReason(String.format("Late night transaction at %d:00", currentHour));
            anomaly.setSeverity(AnomalySeverity.LOW);
            anomaly.setReportedAt(LocalDateTime.now());
            return anomaly;
        }
        
        return null;
    }
    
    // Check for duplicate transactions
    private Anomaly checkDuplicateTransaction(Transaction transaction, User user) {
        LocalDate twoDaysAgo = LocalDate.now().minusDays(2);
        List<Transaction> recentTransactions = transactionRepository
            .findByUserAndTransactionDateBetween(user, twoDaysAgo, LocalDate.now());
        
        for (Transaction t : recentTransactions) {
            if (t.getTransactionId().equals(transaction.getTransactionId())) continue;
            
            boolean sameAmount = t.getAmount().equals(transaction.getAmount());
            boolean similarDescription = t.getDescription() != null && 
                                        transaction.getDescription() != null &&
                                        t.getDescription().toLowerCase().contains(
                                            transaction.getDescription().toLowerCase().substring(0, 
                                            Math.min(5, transaction.getDescription().length()))
                                        );
            
            if (sameAmount && similarDescription) {
                Anomaly anomaly = new Anomaly();
                anomaly.setUser(user);
                anomaly.setTransaction(transaction);
                anomaly.setReason(String.format("Possible duplicate transaction: Similar to transaction on %s for same amount",
                               t.getTransactionDate()));
                anomaly.setSeverity(AnomalySeverity.MEDIUM);
                anomaly.setReportedAt(LocalDateTime.now());
                return anomaly;
            }
        }
        
        return null;
    }
    
    // Check for rapid consecutive transactions
    private Anomaly checkRapidTransactions(Transaction transaction, User user) {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        
        // FIXED: Use findByUserAndCreatedAtAfter
        List<Transaction> recentTransactions = transactionRepository
            .findByUserAndCreatedAtAfter(user, oneHourAgo);
        
        long countInLastHour = recentTransactions.size();
        
        if (countInLastHour >= 5) {
            Anomaly anomaly = new Anomaly();
            anomaly.setUser(user);
            anomaly.setTransaction(transaction);
            anomaly.setReason(String.format("Unusual activity: %d transactions in the last hour", 
                           countInLastHour + 1));
            anomaly.setSeverity(countInLastHour >= 10 ? AnomalySeverity.HIGH : AnomalySeverity.MEDIUM);
            anomaly.setReportedAt(LocalDateTime.now());
            return anomaly;
        }
        
        return null;
    }
    
    // Calculate standard deviation
    private double calculateStandardDeviation(List<Transaction> transactions, double mean) {
        if (transactions.isEmpty()) return 0;
        
        double variance = transactions.stream()
            .filter(t -> t.getType() == TransactionType.EXPENSE)
            .mapToDouble(t -> t.getAmount().doubleValue())
            .map(amount -> Math.pow(amount - mean, 2))
            .average()
            .orElse(0);
        return Math.sqrt(variance);
    }
    
    // Create alert for anomaly
    private void createAlertForAnomaly(Anomaly anomaly) {
        String shortReason = anomaly.getReason().split(":")[0];
        // Don't spam the same anomaly reason within a 1-hour window
        boolean duplicate = alertRepository.existsByUserAndMessageContainingAndCreatedAtAfter(
            anomaly.getUser(), shortReason, LocalDateTime.now().minusHours(1));
            
        if (duplicate) return;

        com.College_project.project.models.Alert alert = new com.College_project.project.models.Alert();
        alert.setUser(anomaly.getUser());
        alert.setType(AlertType.UNUSUAL_SPENDING);
        alert.setMessage(String.format("⚠️ Suspicious Activity Detected: %s\nSeverity: %s\nTransaction: %s for ₹%s",
                       anomaly.getReason(),
                       anomaly.getSeverity(),
                       anomaly.getTransaction().getDescription(),
                       anomaly.getTransaction().getAmount()));
        alert.setCreatedAt(LocalDateTime.now());
        alert.setRead(false);
        alert.setActionUrl("/transactions/" + anomaly.getTransaction().getTransactionId());
        alertRepository.save(alert);
    }
    
    // Scan recent transactions for anomalies
    @Transactional
    public void scanRecentTransactions() {
        LocalDate lastWeek = LocalDate.now().minusDays(7);
        // FIXED: Use findByTransactionDateAfter
        List<Transaction> recentTransactions = transactionRepository
            .findByTransactionDateAfter(lastWeek);
        
        int scanned = 0;
        int anomaliesFound = 0;
        
        for (Transaction transaction : recentTransactions) {
            // Check if already flagged
            if (!transaction.isFlagged()) {
                scanned++;
                List<Anomaly> anomalies = detectAnomalies(transaction);
                anomaliesFound += anomalies.size();
            }
        }
        
        System.out.println("Anomaly scan completed: Scanned " + scanned + " transactions, Found " + anomaliesFound + " anomalies");
    }
    
    // Get all anomalies for a user
    public List<Anomaly> getUserAnomalies(Long userId) {
        // FIXED: Use findByUser_UserIdOrderByReportedAtDesc
        return anomalyRepository.findByUser_UserIdOrderByReportedAtDesc(userId);
    }
    
    // Get unresolved anomalies (HIGH priority)
    public List<Anomaly> getHighPriorityAnomalies(Long userId) {
        // FIXED: Use findByUser_UserIdAndSeverityOrderByReportedAtDesc
        return anomalyRepository.findByUser_UserIdAndSeverityOrderByReportedAtDesc(userId, AnomalySeverity.HIGH);
    }
    
    // Mark anomaly as fraud
  @Transactional
public void markAsFraud(Long anomalyId, Long userId, String notes) {
    Anomaly anomaly = anomalyRepository.findById(anomalyId)
            .orElseThrow(() -> new RuntimeException("Anomaly not found"));
    
    if (!anomaly.getUser().getUserId().equals(userId)) {
        throw new RuntimeException("Unauthorized");
    }
    
    anomaly.setFraud(true);
    anomaly.setResolutionNote(notes);
    anomaly.setResolvedAt(LocalDateTime.now());  // ✅ Set current time
    anomalyRepository.save(anomaly);
    
    // Also flag the transaction
    Transaction transaction = anomaly.getTransaction();
    if (transaction != null) {
        transaction.setFlagged(true);
        transaction.setFlagReason("CONFIRMED FRAUD: " + anomaly.getReason());
        transactionRepository.save(transaction);
    }
}

@Transactional
public void markAsFalseAlarm(Long anomalyId, Long userId, String notes) {
    Anomaly anomaly = anomalyRepository.findById(anomalyId)
            .orElseThrow(() -> new RuntimeException("Anomaly not found"));
    
    if (!anomaly.getUser().getUserId().equals(userId)) {
        throw new RuntimeException("Unauthorized");
    }
    
    anomaly.setFraud(false);
    anomaly.setResolutionNote(notes);
    anomaly.setResolvedAt(LocalDateTime.now());  // ✅ Set current time
    anomalyRepository.save(anomaly);
}
    

}
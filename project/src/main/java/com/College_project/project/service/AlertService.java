package com.College_project.project.service;

import com.College_project.project.models.Alert;
import com.College_project.project.models.Budget;
import com.College_project.project.models.User;
import com.College_project.project.enums.AlertType;
import com.College_project.project.repository.AlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AlertService {
    
    @Autowired
    private AlertRepository alertRepository;
    
    public void createBudgetAlert(User user, String message, Budget budget) {
        Alert alert = new Alert();
        alert.setUser(user);
        alert.setType(AlertType.BUDGET_WARNING);
        alert.setMessage(message);
        alert.setCreatedAt(LocalDateTime.now());
        alert.setRead(false);
        alert.setActionUrl("/budgets?month=" + budget.getMonth());
        alertRepository.save(alert);
    }
    
    public List<Alert> getUserUnreadAlerts(Long userId) {
        return alertRepository.findByUser_UserIdAndIsRead(userId, false);
    }
    
    public List<Alert> getUserAllAlerts(Long userId) {
        return alertRepository.findByUser_UserIdOrderByCreatedAtDesc(userId);
    }
    
    public void markAlertAsRead(Long alertId, Long userId) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found"));
        
        if (!alert.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        
        alert.setRead(true);
        alertRepository.save(alert);
    }
    
    public void markAllAlertsAsRead(Long userId) {
        List<Alert> alerts = alertRepository.findByUser_UserIdAndIsRead(userId, false);
        alerts.forEach(alert -> alert.setRead(true));
        alertRepository.saveAll(alerts);
    }
}
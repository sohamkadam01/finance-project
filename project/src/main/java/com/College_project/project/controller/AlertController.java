package com.College_project.project.controller;

import com.College_project.project.models.Alert;
import com.College_project.project.repository.AlertRepository;
import com.College_project.project.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    @Autowired
    private AlertRepository alertRepository;

    @GetMapping("/unread")
    public ResponseEntity<?> getUnreadAlerts(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<Alert> unreadAlerts = alertRepository.findByUser_UserIdAndIsRead(userDetails.getId(), false);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("count", unreadAlerts.size());
        response.put("alerts", unreadAlerts);
        
        return ResponseEntity.ok(response);
    }

    @PutMapping("/mark-as-read/{alertId}")
    public ResponseEntity<?> markAsRead(@PathVariable Long alertId, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found"));

        if (!alert.getUser().getUserId().equals(userDetails.getId())) {
            return ResponseEntity.status(403).body("Unauthorized");
        }

        alert.setRead(true);
        alertRepository.save(alert);
        return ResponseEntity.ok("Alert marked as read");
    }
    
    @GetMapping("/all")
    public ResponseEntity<?> getAllAlerts(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return ResponseEntity.ok(alertRepository.findByUser_UserIdOrderByCreatedAtDesc(userDetails.getId()));
    }
}
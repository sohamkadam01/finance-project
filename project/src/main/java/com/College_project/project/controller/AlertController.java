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
    
    /**
     * GET /api/alerts/unread
     * Get all unread alerts for the authenticated user
     */
    @GetMapping("/unread")
    public ResponseEntity<?> getUnreadAlerts(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "User not authenticated");
            return ResponseEntity.status(401).body(error);
        }
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<Alert> alerts = alertRepository.findByUser_UserIdAndIsReadOrderByCreatedAtDesc(
            userDetails.getId(), false);
        
        return ResponseEntity.ok(alerts);
    }
    
    /**
     * GET /api/alerts/all
     * Get all alerts for the authenticated user (ordered by newest first)
     */
    @GetMapping("/all")
    public ResponseEntity<?> getAllAlerts(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "User not authenticated");
            return ResponseEntity.status(401).body(error);
        }
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<Alert> alerts = alertRepository.findByUser_UserIdOrderByCreatedAtDesc(userDetails.getId());
        
        return ResponseEntity.ok(alerts);
    }
    
    /**
     * PUT /api/alerts/{alertId}/read
     * Mark a specific alert as read
     */
    @PutMapping("/{alertId}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long alertId, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "User not authenticated");
            return ResponseEntity.status(401).body(error);
        }
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        int updated = alertRepository.markAsRead(alertId, userDetails.getId());
        
        if (updated > 0) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Alert marked as read"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Alert not found or already read"));
        }
    }
    
    /**
     * PUT /api/alerts/mark-all-read
     * Mark all alerts as read for the authenticated user
     */
    @PutMapping("/mark-all-read")
    public ResponseEntity<?> markAllAsRead(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "User not authenticated");
            return ResponseEntity.status(401).body(error);
        }
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        int updated = alertRepository.markAllAsRead(userDetails.getId());
        
        return ResponseEntity.ok(Map.of(
            "success", true, 
            "message", "All alerts marked as read",
            "updatedCount", updated
        ));
    }
    
    /**
     * GET /api/alerts/count/unread
     * Get count of unread alerts
     */
    @GetMapping("/count/unread")
    public ResponseEntity<?> getUnreadCount(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "User not authenticated");
            return ResponseEntity.status(401).body(error);
        }
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        long count = alertRepository.countByUser_UserIdAndIsRead(userDetails.getId(), false);
        
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }
}
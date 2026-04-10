package com.College_project.project.controller;

import com.College_project.project.DTOs.AnomalyRequest;
import com.College_project.project.models.Anomaly;
import com.College_project.project.service.AnomalyDetectionService;
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
@RequestMapping("/api/anomalies")
public class AnomalyController {
    
    @Autowired
    private AnomalyDetectionService anomalyDetectionService;
    
    @GetMapping("/my-anomalies")
    public ResponseEntity<?> getUserAnomalies(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<Anomaly> anomalies = anomalyDetectionService.getUserAnomalies(userDetails.getId());
        return ResponseEntity.ok(anomalies);
    }
    
    @GetMapping("/high-priority")
    public ResponseEntity<?> getHighPriorityAnomalies(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<Anomaly> anomalies = anomalyDetectionService.getHighPriorityAnomalies(userDetails.getId());
        return ResponseEntity.ok(anomalies);
    }
    
    @PostMapping("/{anomalyId}/mark-fraud")
    public ResponseEntity<?> markAsFraud(@PathVariable Long anomalyId,
                                        @RequestBody(required = false) Map<String, String> request,
                                        Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String notes = request != null ? request.get("notes") : "Confirmed as fraudulent";
        anomalyDetectionService.markAsFraud(anomalyId, userDetails.getId(), notes);
        return ResponseEntity.ok("Transaction marked as fraud");
    }
    
    @PostMapping("/{anomalyId}/false-alarm")
    public ResponseEntity<?> markAsFalseAlarm(@PathVariable Long anomalyId,
                                             @RequestBody(required = false) Map<String, String> request,
                                             Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String notes = request != null ? request.get("notes") : "False alarm";
        anomalyDetectionService.markAsFalseAlarm(anomalyId, userDetails.getId(), notes);
        return ResponseEntity.ok("Marked as false alarm");
    }
    
    @PostMapping("/scan-recent")
    public ResponseEntity<?> scanRecentTransactions(Authentication authentication) {
        // Only allow if user has admin role, or just run for all
        anomalyDetectionService.scanRecentTransactions();
        return ResponseEntity.ok("Recent transactions scanned for anomalies");
    }
    
    @GetMapping("/stats")
    public ResponseEntity<?> getAnomalyStats(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<Anomaly> anomalies = anomalyDetectionService.getUserAnomalies(userDetails.getId());
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalAnomalies", anomalies.size());
        stats.put("highSeverity", anomalies.stream().filter(a -> a.getSeverity().toString().equals("HIGH")).count());
        stats.put("mediumSeverity", anomalies.stream().filter(a -> a.getSeverity().toString().equals("MEDIUM")).count());
        stats.put("lowSeverity", anomalies.stream().filter(a -> a.getSeverity().toString().equals("LOW")).count());
        stats.put("confirmedFraud", anomalies.stream().filter(Anomaly::isFraud).count());
        
        return ResponseEntity.ok(stats);
    }
}
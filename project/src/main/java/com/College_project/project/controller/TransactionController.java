package com.College_project.project.controller;

import com.College_project.project.DTOs.MonthlySummaryDTO;
import com.College_project.project.DTOs.TransactionFilterRequest;
import com.College_project.project.DTOs.TransactionFilterResponse;
import com.College_project.project.DTOs.TransactionRequest;
import com.College_project.project.enums.TransactionType;
import com.College_project.project.models.Transaction;
import com.College_project.project.service.TransactionService;
import com.College_project.project.security.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
    
    @Autowired
    private TransactionService transactionService;
    
    /**
     * Add a new transaction
     * POST /api/transactions/add/{accountId}
     */
    @PostMapping("/add/{accountId}")
    public ResponseEntity<?> addTransaction(@PathVariable Long accountId,
                                           @Valid @RequestBody TransactionRequest request,
                                           Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Transaction transaction = transactionService.addTransaction(userDetails.getId(), accountId, request);
        return ResponseEntity.ok(transaction);
    }
    
    /**
     * Get user's transactions with basic filters (SINGLE METHOD - NO DUPLICATES)
     * GET /api/transactions/my-transactions
     */
    @GetMapping("/my-transactions")
    public ResponseEntity<?> getMyTransactions(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            Authentication authentication) {
        
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            
            // For backward compatibility: if no pagination params, return simple list
            if (page == 0 && startDate == null && endDate == null && type == null && size == 50) {
                List<Transaction> transactions = transactionService.getUserTransactions(
                    userDetails.getId(), null, null);
                return ResponseEntity.ok(transactions);
            }
            
            // Use filtered response with pagination
            TransactionFilterRequest filterRequest = new TransactionFilterRequest();
            filterRequest.setStartDate(startDate);
            filterRequest.setEndDate(endDate);
            filterRequest.setType(type);
            filterRequest.setPage(page);
            filterRequest.setSize(size);
            filterRequest.setSortBy("transactionDate");
            filterRequest.setSortDirection("DESC");
            
            TransactionFilterResponse response = transactionService.getFilteredTransactions(
                userDetails.getId(), filterRequest);
            
            // For backward compatibility, return just the transactions array if simple request
            if (page == 0 && !response.isHasNext()) {
                return ResponseEntity.ok(response.getTransactions());
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * Get total spending
     * GET /api/transactions/spending
     */
    @GetMapping("/spending")
    public ResponseEntity<?> getTotalSpending(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        java.math.BigDecimal spending = transactionService.getTotalSpending(
                userDetails.getId(), startDate, endDate);
        
        Map<String, Object> response = new HashMap<>();
        response.put("userId", userDetails.getId());
        response.put("totalSpending", spending != null ? spending : 0);
        response.put("currency", "INR");
        
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/transactions/filter
     * Get transactions with advanced filtering and pagination
     * 
     * Query Parameters:
     * - search: Search in description
     * - type: INCOME or EXPENSE
     * - categoryId: Filter by category
     * - startDate: Start date (YYYY-MM-DD)
     * - endDate: End date (YYYY-MM-DD)
     * - accountId: Filter by bank account
     * - minAmount: Minimum amount
     * - maxAmount: Maximum amount
     * - sortBy: Sort field (transactionDate, amount, description)
     * - sortDirection: ASC or DESC
     * - page: Page number (default 0)
     * - size: Page size (default 20)
     */
    @GetMapping("/filter")
    public ResponseEntity<?> getFilteredTransactions(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) Double minAmount,
            @RequestParam(required = false) Double maxAmount,
            @RequestParam(defaultValue = "transactionDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            
            TransactionFilterRequest filterRequest = new TransactionFilterRequest();
            filterRequest.setSearch(search);
            filterRequest.setType(type);
            filterRequest.setCategoryId(categoryId);
            filterRequest.setStartDate(startDate);
            filterRequest.setEndDate(endDate);
            filterRequest.setAccountId(accountId);
            filterRequest.setMinAmount(minAmount);
            filterRequest.setMaxAmount(maxAmount);
            filterRequest.setSortBy(sortBy);
            filterRequest.setSortDirection(sortDirection);
            filterRequest.setPage(page);
            filterRequest.setSize(size);
            
            TransactionFilterResponse response = transactionService.getFilteredTransactions(
                userDetails.getId(), filterRequest);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
 * GET /api/transactions/monthly-summary?year=2026&month=4
 * Get monthly transaction summary
 */
@GetMapping("/monthly-summary")
public ResponseEntity<?> getMonthlySummary(
        @RequestParam int year,
        @RequestParam int month,
        Authentication authentication) {
    
    try {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        MonthlySummaryDTO summary = transactionService.getMonthlySummary(
            userDetails.getId(), year, month);
        
        return ResponseEntity.ok(summary);
        
    } catch (Exception e) {
        Map<String, String> error = new HashMap<>();
        error.put("error", e.getMessage());
        return ResponseEntity.badRequest().body(error);
    }
}


}
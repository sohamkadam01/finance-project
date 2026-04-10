package com.College_project.project.controller;

import com.College_project.project.DTOs.InvestmentAdviceRequest;
import com.College_project.project.DTOs.InvestmentAdviceResponse;
import com.College_project.project.DTOs.InvestmentRequest;
import com.College_project.project.DTOs.InvestmentResponse;
import com.College_project.project.DTOs.PortfolioPerformanceDTO;
import com.College_project.project.service.InvestmentAdviceFacadeService;
import com.College_project.project.service.InvestmentService;
import com.College_project.project.service.PortfolioPerformanceService;
import com.College_project.project.security.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/investments")
public class InvestmentController {

    @Autowired
private PortfolioPerformanceService portfolioPerformanceService;
    
    @Autowired
    private InvestmentService investmentService;
    
    @Autowired
    private InvestmentAdviceFacadeService investmentAdviceFacadeService;
    
    // ===== INVESTMENT CRUD OPERATIONS =====
    
    @PostMapping("/add")
    public ResponseEntity<?> addInvestment(@Valid @RequestBody InvestmentRequest request,
                                          Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            InvestmentResponse response = investmentService.addInvestment(userDetails.getId(), request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/my-investments")
    public ResponseEntity<?> getMyInvestments(Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            List<InvestmentResponse> investments = investmentService.getUserInvestments(userDetails.getId());
            return ResponseEntity.ok(investments);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/summary")
    public ResponseEntity<?> getInvestmentSummary(Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            InvestmentResponse summary = investmentService.getInvestmentSummary(userDetails.getId());
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PutMapping("/{investmentId}/update-value")
    public ResponseEntity<?> updateInvestmentValue(@PathVariable Long investmentId,
                                                   @RequestParam BigDecimal newValue,
                                                   Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            InvestmentResponse response = investmentService.updateInvestmentValue(
                investmentId, userDetails.getId(), newValue);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @DeleteMapping("/{investmentId}")
    public ResponseEntity<?> deleteInvestment(@PathVariable Long investmentId,
                                             Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            investmentService.deleteInvestment(investmentId, userDetails.getId());
            return ResponseEntity.ok("Investment deleted successfully");
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // ===== INVESTMENT ADVICE ENDPOINTS =====
    
    @PostMapping("/advice/ai")
    public ResponseEntity<?> getAIInvestmentAdvice(@RequestBody InvestmentAdviceRequest request,
                                                   Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            InvestmentAdviceResponse response = investmentAdviceFacadeService.getInvestmentAdvice(
                userDetails.getId(), request, "AI");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PostMapping("/advice/rule")
    public ResponseEntity<?> getRuleBasedInvestmentAdvice(@RequestBody InvestmentAdviceRequest request,
                                                          Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            InvestmentAdviceResponse response = investmentAdviceFacadeService.getInvestmentAdvice(
                userDetails.getId(), request, "RULE");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PostMapping("/advice/auto")
    public ResponseEntity<?> getAutoInvestmentAdvice(@RequestBody InvestmentAdviceRequest request,
                                                     Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            InvestmentAdviceResponse response = investmentAdviceFacadeService.getInvestmentAdvice(
                userDetails.getId(), request, "AUTO");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/advice/default")
    public ResponseEntity<?> getDefaultInvestmentAdvice(Authentication authentication) {
        try {
            InvestmentAdviceRequest request = new InvestmentAdviceRequest();
            request.setRiskTolerance(new BigDecimal("5"));
            request.setInvestmentHorizon(new BigDecimal("10"));
            request.setMonthlyInvestmentCapacity(new BigDecimal("5000"));
            request.setGoal("WEALTH_GROWTH");
            
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            InvestmentAdviceResponse response = investmentAdviceFacadeService.getInvestmentAdvice(
                userDetails.getId(), request, "AUTO");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
 * GET /api/investments/performance
 * Get portfolio performance chart data
 * 
 * Query Parameters:
 * - period: 1M, 3M, 6M, 1Y, ALL (default: 6M)
 */
@GetMapping("/performance")
public ResponseEntity<?> getPortfolioPerformance(
        @RequestParam(defaultValue = "6M") String period,
        Authentication authentication) {
    
    try {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        PortfolioPerformanceDTO performance = portfolioPerformanceService.getPortfolioPerformance(
            userDetails.getId(), period);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("performance", performance);
        response.put("period", period);
        
        return ResponseEntity.ok(response);
        
    } catch (Exception e) {
        Map<String, String> error = new HashMap<>();
        error.put("error", e.getMessage());
        return ResponseEntity.badRequest().body(error);
    }
}

/**
 * GET /api/investments/performance/asset-allocation
 * Get asset allocation pie chart data
 */
@GetMapping("/performance/asset-allocation")
public ResponseEntity<?> getAssetAllocation(Authentication authentication) {
    try {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<PortfolioPerformanceDTO.AssetAllocation> allocation = 
            portfolioPerformanceService.getAssetAllocation(userDetails.getId());
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("allocation", allocation);
        
        return ResponseEntity.ok(response);
        
    } catch (Exception e) {
        Map<String, String> error = new HashMap<>();
        error.put("error", e.getMessage());
        return ResponseEntity.badRequest().body(error);
    }
}
}
package com.College_project.project.service;

import com.College_project.project.DTOs.InvestmentAdviceRequest;
import com.College_project.project.DTOs.InvestmentAdviceResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class InvestmentAdviceFacadeService {
    
    @Autowired
    private AIInvestmentAdviceService aiInvestmentAdviceService;
    
    @Autowired
    private InvestmentAdviceService fallbackInvestmentAdviceService;
    
    /**
     * Get investment advice - tries AI first, falls back to rule-based
     */
    public InvestmentAdviceResponse getInvestmentAdvice(Long userId, InvestmentAdviceRequest request, String method) {
        System.out.println("========== Investment Advice Facade ==========");
        System.out.println("Requested method: " + method);
        
        if ("AI".equalsIgnoreCase(method)) {
            System.out.println("Using AI-powered advice with fallback");
            return aiInvestmentAdviceService.getInvestmentAdviceWithAIFallback(userId, request);
        } else if ("RULE".equalsIgnoreCase(method)) {
            System.out.println("Using rule-based advice only");
            return fallbackInvestmentAdviceService.getInvestmentAdvice(userId, request);
        } else {
            // AUTO mode - try AI first, fallback to rule-based
            System.out.println("Using AUTO mode (AI with fallback)");
            return aiInvestmentAdviceService.getInvestmentAdviceWithAIFallback(userId, request);
        }
    }
}
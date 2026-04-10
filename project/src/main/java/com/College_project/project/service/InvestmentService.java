package com.College_project.project.service;

import com.College_project.project.DTOs.InvestmentRequest;
import com.College_project.project.DTOs.InvestmentResponse;
import com.College_project.project.models.Investment;
import com.College_project.project.models.User;
import com.College_project.project.repository.investmentRepository;
import com.College_project.project.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class InvestmentService {
    
    @Autowired
    private investmentRepository investmentRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Transactional
    public InvestmentResponse addInvestment(Long userId, InvestmentRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Investment investment = new Investment();
        investment.setUser(user);
        investment.setName(request.getName());
        investment.setType(request.getType());
        investment.setAmountInvested(request.getAmountInvested());
        investment.setCurrentValue(request.getCurrentValue() != null ? 
                                  request.getCurrentValue() : request.getAmountInvested());
        investment.setPurchaseDate(request.getPurchaseDate());
        investment.setSymbol(request.getSymbol());
        investment.setQuantity(request.getQuantity());
        investment.setCreatedAt(LocalDateTime.now());
        
        // Calculate returns
        if (investment.getCurrentValue().compareTo(investment.getAmountInvested()) > 0) {
            BigDecimal profit = investment.getCurrentValue().subtract(investment.getAmountInvested());
            BigDecimal returns = profit.multiply(new BigDecimal("100"))
                    .divide(investment.getAmountInvested(), 2, java.math.RoundingMode.HALF_UP);
            investment.setReturns(returns);
        } else {
            investment.setReturns(BigDecimal.ZERO);
        }
        
        Investment saved = investmentRepository.save(investment);
        
        return new InvestmentResponse(
            saved.getInvestmentId(),
            saved.getName(),
            saved.getType(),
            saved.getAmountInvested(),
            saved.getCurrentValue(),
            saved.getPurchaseDate(),
            saved.getSymbol(),
            saved.getQuantity(),
            saved.getCreatedAt()
        );
    }
    
    public List<InvestmentResponse> getUserInvestments(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return investmentRepository.findByUser(user).stream()
                .map(inv -> new InvestmentResponse(
                    inv.getInvestmentId(),
                    inv.getName(),
                    inv.getType(),
                    inv.getAmountInvested(),
                    inv.getCurrentValue(),
                    inv.getPurchaseDate(),
                    inv.getSymbol(),
                    inv.getQuantity(),
                    inv.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }
    
    public InvestmentResponse getInvestmentSummary(Long userId) {
        List<Investment> investments = investmentRepository.findByUser(
            userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"))
        );
        
        BigDecimal totalInvested = investments.stream()
                .map(Investment::getAmountInvested)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalCurrentValue = investments.stream()
                .map(Investment::getCurrentValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalProfitLoss = totalCurrentValue.subtract(totalInvested);
        BigDecimal totalReturnsPercentage = BigDecimal.ZERO;
        
        if (totalInvested.compareTo(BigDecimal.ZERO) > 0) {
            totalReturnsPercentage = totalProfitLoss
                    .multiply(new BigDecimal("100"))
                    .divide(totalInvested, 2, java.math.RoundingMode.HALF_UP);
        }
        
        // Create a summary response
        Investment summary = new Investment();
        summary.setName("Portfolio Summary");
        summary.setAmountInvested(totalInvested);
        summary.setCurrentValue(totalCurrentValue);
        summary.setReturns(totalReturnsPercentage);
        
        return new InvestmentResponse(
            null, "Portfolio Summary", null,
            totalInvested, totalCurrentValue,
            null, null, null, null
        );
    }
    
    @Transactional
    public InvestmentResponse updateInvestmentValue(Long investmentId, Long userId, BigDecimal newValue) {
        Investment investment = investmentRepository.findById(investmentId)
                .orElseThrow(() -> new RuntimeException("Investment not found"));
        
        if (!investment.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        
        investment.setCurrentValue(newValue);
        
        // Recalculate returns
        if (newValue.compareTo(investment.getAmountInvested()) > 0) {
            BigDecimal profit = newValue.subtract(investment.getAmountInvested());
            BigDecimal returns = profit.multiply(new BigDecimal("100"))
                    .divide(investment.getAmountInvested(), 2, java.math.RoundingMode.HALF_UP);
            investment.setReturns(returns);
        } else {
            investment.setReturns(BigDecimal.ZERO);
        }
        
        investment.setUpdatedAt(LocalDateTime.now());
        Investment updated = investmentRepository.save(investment);
        
        return new InvestmentResponse(
            updated.getInvestmentId(),
            updated.getName(),
            updated.getType(),
            updated.getAmountInvested(),
            updated.getCurrentValue(),
            updated.getPurchaseDate(),
            updated.getSymbol(),
            updated.getQuantity(),
            updated.getCreatedAt()
        );
    }
    
    @Transactional
    public void deleteInvestment(Long investmentId, Long userId) {
        Investment investment = investmentRepository.findById(investmentId)
                .orElseThrow(() -> new RuntimeException("Investment not found"));
        
        if (!investment.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        
        investmentRepository.delete(investment);
    }
}
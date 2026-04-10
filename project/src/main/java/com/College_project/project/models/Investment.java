package com.College_project.project.models;


import com.College_project.project.enums.InvestmentType;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import com.College_project.project.models.User;
@Entity
@Table(name = "investments")
public class Investment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long investmentId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    private String name;
    
    @Enumerated(EnumType.STRING)
    private InvestmentType type;
    
    private BigDecimal amountInvested;
    
    private BigDecimal currentValue;
    
    private LocalDate purchaseDate;
    
    private BigDecimal returns; // Percentage returns
    
    private String symbol; // For stocks: RELIANCE, TCS, etc.
    
    private Integer quantity;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructors
    public Investment() {
        this.createdAt = LocalDateTime.now();
    }
    
    public Investment(User user, String name, InvestmentType type, BigDecimal amountInvested, LocalDate purchaseDate) {
        this.user = user;
        this.name = name;
        this.type = type;
        this.amountInvested = amountInvested;
        this.currentValue = amountInvested;
        this.purchaseDate = purchaseDate;
        this.createdAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getInvestmentId() { return investmentId; }
    public void setInvestmentId(Long investmentId) { this.investmentId = investmentId; }
    
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public InvestmentType getType() { return type; }
    public void setType(InvestmentType type) { this.type = type; }
    
    public BigDecimal getAmountInvested() { return amountInvested; }
    public void setAmountInvested(BigDecimal amountInvested) { this.amountInvested = amountInvested; }
    
    public BigDecimal getCurrentValue() { return currentValue; }
    public void setCurrentValue(BigDecimal currentValue) { this.currentValue = currentValue; }
    
    public LocalDate getPurchaseDate() { return purchaseDate; }
    public void setPurchaseDate(LocalDate purchaseDate) { this.purchaseDate = purchaseDate; }
    
    public BigDecimal getReturns() { return returns; }
    public void setReturns(BigDecimal returns) { this.returns = returns; }
    
    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }
    
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    // Helper method
    // public BigDecimal getProfitLoss() {
    //     return currentValue.subtract(amountInvested);
    // }
    
    // public BigDecimal getReturnsPercentage() {
    //     if (amountInvested.compareTo(BigDecimal.ZERO) == 0) return BigDecimal.ZERO;
    //     return profitLoss.multiply(new BigDecimal("100")).divide(amountInvested, 2, java.math.RoundingMode.HALF_UP);
    // }
    
    // private BigDecimal getProfitLoss() {
    //     return getProfitLoss();
    // }
}
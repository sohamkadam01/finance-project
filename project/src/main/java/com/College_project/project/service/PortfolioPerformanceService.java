package com.College_project.project.service;

import com.College_project.project.DTOs.PortfolioPerformanceDTO;
import com.College_project.project.models.Investment;
import com.College_project.project.models.User;
import com.College_project.project.repository.investmentRepository;
import com.College_project.project.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PortfolioPerformanceService {
    
    @Autowired
    private investmentRepository investmentRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Get portfolio performance data
     * @param userId User ID
     * @param period Period for analysis (1M, 3M, 6M, 1Y, ALL)
     * @return PortfolioPerformanceDTO with performance data
     */
    public PortfolioPerformanceDTO getPortfolioPerformance(Long userId, String period) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Investment> investments = investmentRepository.findByUser(user);
        
        if (investments.isEmpty()) {
            throw new RuntimeException("No investments found");
        }
        
        PortfolioPerformanceDTO performance = new PortfolioPerformanceDTO();
        
        // Calculate current portfolio summary
        performance.setSummary(calculatePortfolioSummary(investments));
        
        // Generate performance history
        List<PortfolioPerformanceDTO.PerformancePoint> history = generatePerformanceHistory(investments, period);
        performance.setPerformanceHistory(history);
        
        // Generate period-specific performances
        performance.setWeeklyPerformance(generatePerformanceHistory(investments, "1M"));
        performance.setMonthlyPerformance(generatePerformanceHistory(investments, "6M"));
        performance.setYearlyPerformance(generatePerformanceHistory(investments, "1Y"));
        
        // Calculate returns analysis
        performance.setReturnsAnalysis(calculateReturnsAnalysis(history, investments));
        
        // Calculate benchmark comparison
        performance.setBenchmarkComparison(calculateBenchmarkComparison(history));
        
        // Calculate asset allocation
        performance.setAssetAllocation(calculateAssetAllocation(investments));
        
        // Get top and bottom performers
        List<PortfolioPerformanceDTO.InvestmentPerformance> performances = getInvestmentPerformances(investments);
        performance.setTopPerformers(performances.stream()
                .sorted((a, b) -> Double.compare(b.getReturnsPercentage(), a.getReturnsPercentage()))
                .limit(5)
                .collect(Collectors.toList()));
        
        performance.setBottomPerformers(performances.stream()
                .sorted((a, b) -> Double.compare(a.getReturnsPercentage(), b.getReturnsPercentage()))
                .limit(5)
                .collect(Collectors.toList()));
        
        // Generate insights
        generateInsights(performance);
        
        return performance;
    }
    
    /**
     * Calculate portfolio summary
     */
    private PortfolioPerformanceDTO.PortfolioSummary calculatePortfolioSummary(List<Investment> investments) {
        PortfolioPerformanceDTO.PortfolioSummary summary = new PortfolioPerformanceDTO.PortfolioSummary();
        
        BigDecimal totalInvested = investments.stream()
                .map(Investment::getAmountInvested)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal currentValue = investments.stream()
                .map(Investment::getCurrentValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalProfitLoss = currentValue.subtract(totalInvested);
        double totalReturnsPercentage = 0;
        
        if (totalInvested.compareTo(BigDecimal.ZERO) > 0) {
            totalReturnsPercentage = totalProfitLoss.doubleValue() / totalInvested.doubleValue() * 100;
        }
        
        int profitableCount = 0;
        int lossCount = 0;
        
        for (Investment inv : investments) {
            if (inv.getCurrentValue().compareTo(inv.getAmountInvested()) > 0) {
                profitableCount++;
            } else if (inv.getCurrentValue().compareTo(inv.getAmountInvested()) < 0) {
                lossCount++;
            }
        }
        
        summary.setTotalInvested(totalInvested);
        summary.setCurrentValue(currentValue);
        summary.setTotalProfitLoss(totalProfitLoss);
        summary.setTotalReturnsPercentage(Math.round(totalReturnsPercentage * 100.0) / 100.0);
        summary.setNumberOfInvestments(investments.size());
        summary.setNumberOfProfitableInvestments(profitableCount);
        summary.setNumberOfLossMakingInvestments(lossCount);
        summary.setLastUpdated(LocalDate.now());
        
        return summary;
    }
    
    /**
     * Generate performance history based on period
     */
  /**
 * Generate performance history based on period
 */
private List<PortfolioPerformanceDTO.PerformancePoint> generatePerformanceHistory(List<Investment> investments, String period) {
    List<PortfolioPerformanceDTO.PerformancePoint> history = new ArrayList<>();
    
    LocalDate endDate = LocalDate.now();
    LocalDate startDate;
    
    switch (period) {
        case "1M":
            startDate = endDate.minusMonths(1);
            break;
        case "3M":
            startDate = endDate.minusMonths(3);
            break;
        case "6M":
            startDate = endDate.minusMonths(6);
            break;
        case "1Y":
            startDate = endDate.minusYears(1);
            break;
        default:
            // Get earliest purchase date
            startDate = investments.stream()
                    .map(Investment::getPurchaseDate)
                    .min(LocalDate::compareTo)
                    .orElse(endDate.minusYears(1));
    }
    
    // Get all investment purchase dates
    Map<LocalDate, BigDecimal> investmentsByDate = new TreeMap<>();
    for (Investment inv : investments) {
        investmentsByDate.merge(inv.getPurchaseDate(), inv.getAmountInvested(), BigDecimal::add);
    }
    
    BigDecimal runningInvested = BigDecimal.ZERO;
    BigDecimal runningValue = BigDecimal.ZERO;
    
    // FIX: Use a separate variable for iteration that we can modify
    LocalDate iterDate = startDate;
    while (!iterDate.isAfter(endDate)) {
        final LocalDate currentDate = iterDate; // Make effectively final for lambda
        
        // Add investments purchased on this date
        if (investmentsByDate.containsKey(currentDate)) {
            runningInvested = runningInvested.add(investmentsByDate.get(currentDate));
        }
        
        // Calculate current value (simplified - using latest value)
        runningValue = investments.stream()
                .filter(inv -> !inv.getPurchaseDate().isAfter(currentDate))
                .map(inv -> {
                    // Simple growth simulation based on time
                    long daysHeld = ChronoUnit.DAYS.between(inv.getPurchaseDate(), currentDate);
                    double growthRate = inv.getReturns() != null ? inv.getReturns().doubleValue() / 100 : 0;
                    // Annualized growth
                    double dailyGrowth = Math.pow(1 + growthRate, 1.0/365) - 1;
                    double multiplier = Math.pow(1 + dailyGrowth, daysHeld);
                    return inv.getAmountInvested().multiply(BigDecimal.valueOf(multiplier));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        PortfolioPerformanceDTO.PerformancePoint point = new PortfolioPerformanceDTO.PerformancePoint();
        point.setDate(currentDate);
        point.setInvestedAmount(runningInvested);
        point.setValue(runningValue);
        point.setReturns(runningValue.subtract(runningInvested));
        
        if (runningInvested.compareTo(BigDecimal.ZERO) > 0) {
            point.setReturnsPercentage(runningValue.subtract(runningInvested)
                    .divide(runningInvested, 4, RoundingMode.HALF_UP)
                    .doubleValue() * 100);
        }
        
        history.add(point);
        iterDate = iterDate.plusMonths(1);
    }
    
    return history;
}
    
    /**
     * Calculate returns analysis
     */
    private PortfolioPerformanceDTO.ReturnsAnalysis calculateReturnsAnalysis(
            List<PortfolioPerformanceDTO.PerformancePoint> history,
            List<Investment> investments) {
        
        PortfolioPerformanceDTO.ReturnsAnalysis analysis = new PortfolioPerformanceDTO.ReturnsAnalysis();
        
        if (history.isEmpty()) {
            return analysis;
        }
        
        PortfolioPerformanceDTO.PerformancePoint first = history.get(0);
        PortfolioPerformanceDTO.PerformancePoint last = history.get(history.size() - 1);
        
        analysis.setTotalReturns(last.getReturns());
        analysis.setTotalReturnsPercentage(last.getReturnsPercentage());
        
        // Calculate CAGR
        long years = ChronoUnit.DAYS.between(first.getDate(), last.getDate()) / 365;
        if (years > 0 && first.getValue().compareTo(BigDecimal.ZERO) > 0) {
            double cagr = Math.pow(last.getValue().doubleValue() / first.getValue().doubleValue(), 1.0 / years) - 1;
            analysis.setCagr(cagr * 100);
            analysis.setAnnualizedReturns(cagr * 100);
        }
        
        // Find best and worst periods
        BigDecimal bestReturn = history.stream()
                .map(PortfolioPerformanceDTO.PerformancePoint::getReturns)
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
        
        BigDecimal worstReturn = history.stream()
                .map(PortfolioPerformanceDTO.PerformancePoint::getReturns)
                .min(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);
        
        analysis.setBestDayReturn(bestReturn);
        analysis.setWorstDayReturn(worstReturn);
        
        // Calculate volatility (simplified)
        double[] returns = history.stream()
                .mapToDouble(PortfolioPerformanceDTO.PerformancePoint::getReturnsPercentage)
                .toArray();
        
        double mean = Arrays.stream(returns).average().orElse(0);
        double variance = Arrays.stream(returns)
                .map(r -> Math.pow(r - mean, 2))
                .average()
                .orElse(0);
        double volatility = Math.sqrt(variance);
        analysis.setVolatility(Math.round(volatility * 100.0) / 100.0);
        
        // Calculate Sharpe Ratio (assuming 5% risk-free rate)
        double riskFreeRate = 5.0;
        double sharpeRatio = (mean - riskFreeRate) / volatility;
        analysis.setSharpeRatio(Math.round(sharpeRatio * 100.0) / 100.0);
        
        // Calculate max drawdown
        BigDecimal peak = history.get(0).getValue();
        BigDecimal maxDrawdownValue = BigDecimal.ZERO;
        String drawdownPeriod = "";
        
        for (PortfolioPerformanceDTO.PerformancePoint point : history) {
            if (point.getValue().compareTo(peak) > 0) {
                peak = point.getValue();
            }
            BigDecimal drawdown = peak.subtract(point.getValue())
                    .divide(peak, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
            
            if (drawdown.compareTo(maxDrawdownValue) < 0) {
                maxDrawdownValue = drawdown;
                drawdownPeriod = point.getDate().toString();
            }
        }
        
        analysis.setMaxDrawdown(Math.abs(maxDrawdownValue.doubleValue()));
        analysis.setDrawdownPeriod(drawdownPeriod);
        
        return analysis;
    }
    
    /**
     * Calculate benchmark comparison
     */
    private PortfolioPerformanceDTO.BenchmarkComparison calculateBenchmarkComparison(
            List<PortfolioPerformanceDTO.PerformancePoint> history) {
        
        PortfolioPerformanceDTO.BenchmarkComparison comparison = new PortfolioPerformanceDTO.BenchmarkComparison();
        
        if (history.isEmpty()) {
            return comparison;
        }
        
        PortfolioPerformanceDTO.PerformancePoint first = history.get(0);
        PortfolioPerformanceDTO.PerformancePoint last = history.get(history.size() - 1);
        
        comparison.setPortfolioReturn(last.getReturnsPercentage());
        
        // Simulate NIFTY 50 benchmark returns (simplified)
        // In real implementation, you would fetch actual index data
        double benchmarkReturn = last.getReturnsPercentage() * 0.9; // Simulated
        comparison.setBenchmarkReturn(Math.round(benchmarkReturn * 100.0) / 100.0);
        comparison.setOutperformance(Math.round((last.getReturnsPercentage() - benchmarkReturn) * 100.0) / 100.0);
        comparison.setBenchmarkName("NIFTY 50");
        
        // Generate benchmark history (simplified)
        List<PortfolioPerformanceDTO.PerformancePoint> benchmarkHistory = new ArrayList<>();
        for (PortfolioPerformanceDTO.PerformancePoint point : history) {
            PortfolioPerformanceDTO.PerformancePoint benchmarkPoint = new PortfolioPerformanceDTO.PerformancePoint();
            benchmarkPoint.setDate(point.getDate());
            benchmarkPoint.setValue(point.getValue().multiply(BigDecimal.valueOf(0.9)));
            benchmarkPoint.setReturnsPercentage(point.getReturnsPercentage() * 0.9);
            benchmarkHistory.add(benchmarkPoint);
        }
        comparison.setBenchmarkHistory(benchmarkHistory);
        
        return comparison;
    }
    
    /**
     * Calculate asset allocation
     */
    private List<PortfolioPerformanceDTO.AssetAllocation> calculateAssetAllocation(List<Investment> investments) {
        Map<String, BigDecimal> allocationByType = new HashMap<>();
        Map<String, BigDecimal> returnsByType = new HashMap<>();
        Map<String, Integer> countByType = new HashMap<>();
        
        for (Investment inv : investments) {
            String type = inv.getType().toString();
            allocationByType.merge(type, inv.getCurrentValue(), BigDecimal::add);
            
            BigDecimal profitLoss = inv.getCurrentValue().subtract(inv.getAmountInvested());
            returnsByType.merge(type, profitLoss, BigDecimal::add);
            countByType.merge(type, 1, Integer::sum);
        }
        
        BigDecimal totalValue = allocationByType.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        List<PortfolioPerformanceDTO.AssetAllocation> allocation = new ArrayList<>();
        
        Map<String, String> icons = Map.of(
            "STOCK", "📈",
            "MUTUAL_FUND", "📊",
            "FIXED_DEPOSIT", "🏦",
            "BOND", "📜",
            "REAL_ESTATE", "🏠",
            "GOLD", "🥇",
            "CRYPTO", "₿",
            "ETF", "📉"
        );
        
        Map<String, String> colors = Map.of(
            "STOCK", "#3b82f6",
            "MUTUAL_FUND", "#10b981",
            "FIXED_DEPOSIT", "#f59e0b",
            "BOND", "#8b5cf6",
            "REAL_ESTATE", "#ec4899",
            "GOLD", "#fbbf24",
            "CRYPTO", "#ef4444",
            "ETF", "#06b6d4"
        );
        
        for (Map.Entry<String, BigDecimal> entry : allocationByType.entrySet()) {
            String type = entry.getKey();
            BigDecimal amount = entry.getValue();
            double percentage = totalValue.compareTo(BigDecimal.ZERO) > 0 ?
                    amount.doubleValue() / totalValue.doubleValue() * 100 : 0;
            
            BigDecimal returns = returnsByType.getOrDefault(type, BigDecimal.ZERO);
            double avgReturn = countByType.get(type) > 0 ?
                    returns.doubleValue() / countByType.get(type) : 0;
            
            PortfolioPerformanceDTO.AssetAllocation alloc = new PortfolioPerformanceDTO.AssetAllocation();
            alloc.setAssetType(formatAssetType(type));
            alloc.setAmount(amount);
            alloc.setPercentage(Math.round(percentage * 100.0) / 100.0);
            alloc.setReturns(Math.round(avgReturn * 100.0) / 100.0);
            alloc.setIcon(icons.getOrDefault(type, "📊"));
            alloc.setColor(colors.getOrDefault(type, "#6b7280"));
            
            allocation.add(alloc);
        }
        
        // Sort by percentage descending
        allocation.sort((a, b) -> Double.compare(b.getPercentage(), a.getPercentage()));
        
        return allocation;
    }
    
    /**
     * Get investment performances
     */
    private List<PortfolioPerformanceDTO.InvestmentPerformance> getInvestmentPerformances(List<Investment> investments) {
        List<PortfolioPerformanceDTO.InvestmentPerformance> performances = new ArrayList<>();
        
        for (Investment inv : investments) {
            BigDecimal profitLoss = inv.getCurrentValue().subtract(inv.getAmountInvested());
            double returnsPercentage = 0;
            
            if (inv.getAmountInvested().compareTo(BigDecimal.ZERO) > 0) {
                returnsPercentage = profitLoss.doubleValue() / inv.getAmountInvested().doubleValue() * 100;
            }
            
            PortfolioPerformanceDTO.InvestmentPerformance perf = new PortfolioPerformanceDTO.InvestmentPerformance();
            perf.setInvestmentId(inv.getInvestmentId());
            perf.setName(inv.getName());
            perf.setSymbol(inv.getSymbol());
            perf.setType(inv.getType().toString());
            perf.setInvested(inv.getAmountInvested());
            perf.setCurrentValue(inv.getCurrentValue());
            perf.setProfitLoss(profitLoss);
            perf.setReturnsPercentage(Math.round(returnsPercentage * 100.0) / 100.0);
            perf.setTrend(profitLoss.compareTo(BigDecimal.ZERO) > 0 ? "UP" : 
                         profitLoss.compareTo(BigDecimal.ZERO) < 0 ? "DOWN" : "STABLE");
            
            performances.add(perf);
        }
        
        return performances;
    }
    
    /**
     * Generate insights
     */
    private void generateInsights(PortfolioPerformanceDTO performance) {
        StringBuilder insight = new StringBuilder();
        List<String> recommendations = new ArrayList<>();
        
        PortfolioPerformanceDTO.PortfolioSummary summary = performance.getSummary();
        PortfolioPerformanceDTO.ReturnsAnalysis analysis = performance.getReturnsAnalysis();
        
        // Overall performance insight
        if (summary.getTotalReturnsPercentage() > 0) {
            insight.append(String.format("✅ Your portfolio has grown by %.1f%% with a total profit of ₹%s. ",
                summary.getTotalReturnsPercentage(),
                summary.getTotalProfitLoss().toPlainString()));
        } else {
            insight.append(String.format("⚠️ Your portfolio is down by %.1f%% (₹%s loss). ",
                Math.abs(summary.getTotalReturnsPercentage()),
                summary.getTotalProfitLoss().abs().toPlainString()));
        }
        
        // Risk insights
        if (analysis.getVolatility() < 10) {
            insight.append("Low volatility indicates stable performance. ");
            recommendations.add("Consider adding some growth assets for better returns");
        } else if (analysis.getVolatility() > 20) {
            insight.append("High volatility suggests aggressive portfolio. ");
            recommendations.add("Review your asset allocation to balance risk");
        }
        
        // Sharpe ratio insight
        if (analysis.getSharpeRatio() > 1) {
            insight.append("Excellent risk-adjusted returns! ");
        } else if (analysis.getSharpeRatio() < 0.5) {
            insight.append("Risk-adjusted returns need improvement. ");
            recommendations.add("Consider diversifying into better performing assets");
        }
        
        // Max drawdown insight
        if (analysis.getMaxDrawdown() > 20) {
            recommendations.add("Portfolio has high drawdown risk. Consider adding defensive assets");
        }
        
        // Top performer recommendation
        if (!performance.getTopPerformers().isEmpty()) {
            PortfolioPerformanceDTO.InvestmentPerformance top = performance.getTopPerformers().get(0);
            recommendations.add(String.format("📈 Your best performer is %s with %.1f%% returns",
                top.getName(), top.getReturnsPercentage()));
        }
        
        // Asset allocation recommendations
        for (PortfolioPerformanceDTO.AssetAllocation alloc : performance.getAssetAllocation()) {
            if (alloc.getPercentage() > 40) {
                recommendations.add(String.format("⚠️ High concentration in %s (%.0f%%). Consider diversifying",
                    alloc.getAssetType(), alloc.getPercentage()));
            }
        }
        
        // General recommendations
        if (recommendations.isEmpty()) {
            recommendations.add("🎯 Review your portfolio quarterly to stay aligned with goals");
            recommendations.add("💰 Consider increasing SIP amounts in top-performing funds");
            recommendations.add("📊 Rebalance portfolio when allocation drifts >5%");
        }
        
        performance.setOverallInsight(insight.toString());
        performance.setRecommendations(recommendations);
    }
    
    /**
     * Format asset type for display
     */
    private String formatAssetType(String type) {
        switch (type) {
            case "STOCK": return "Stocks";
            case "MUTUAL_FUND": return "Mutual Funds";
            case "FIXED_DEPOSIT": return "Fixed Deposits";
            case "BOND": return "Bonds";
            case "REAL_ESTATE": return "Real Estate";
            case "GOLD": return "Gold";
            case "CRYPTO": return "Cryptocurrency";
            case "ETF": return "ETFs";
            default: return type;
        }
    }
    /**
 * Get asset allocation only (without full performance data)
 * @param userId User ID
 * @return List of asset allocation
 */
public List<PortfolioPerformanceDTO.AssetAllocation> getAssetAllocation(Long userId) {
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
    
    List<Investment> investments = investmentRepository.findByUser(user);
    
    if (investments.isEmpty()) {
        return new ArrayList<>();
    }
    
    return calculateAssetAllocation(investments);
}
}
package com.College_project.project.service;

import com.College_project.project.DTOs.PredictionResponse;
import com.College_project.project.models.Transaction;
import com.College_project.project.models.User;
import com.College_project.project.enums.TransactionType;
import com.College_project.project.repository.transactionRepository;
import com.College_project.project.repository.bankAccountRepository;
import com.College_project.project.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class AIPredictionService {
    private static final Logger logger = LoggerFactory.getLogger(AIPredictionService.class);
    
    @Autowired
    private transactionRepository transactionRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private bankAccountRepository bankAccountRepository;
    
    @Autowired
    private StatisticalPredictionService statisticalPredictionService;
    
    @Value("${openrouter.api.key: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}")
    private String apiKey;
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * Main method - tries AI first, falls back to statistical if AI fails
     */
    public PredictionResponse predictWithAIFallback(Long userId, LocalDate startDate, LocalDate endDate) {
        // Check if API key is configured
        if (apiKey == null || apiKey.isEmpty()) {
            logger.warn("No API key configured. Using statistical prediction.");
            return statisticalPredictionService.predictFutureBalance(userId, startDate, endDate);
        }
        
        try {
            // Try AI prediction first
            logger.info("Attempting AI prediction for user ID: {}", userId);
            return predictWithAI(userId, startDate, endDate);
        } catch (Exception e) {
            // If AI fails, fall back to statistical
            logger.error("AI prediction failed: {}. Falling back to statistical prediction.", e.getMessage());
            return statisticalPredictionService.predictFutureBalance(userId, startDate, endDate);
        }
    }
    
    /**
     * AI-powered prediction using OpenRouter
     */
    private PredictionResponse predictWithAI(Long userId, LocalDate startDate, LocalDate endDate) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Get historical data for AI context
        LocalDate threeMonthsAgo = LocalDate.now().minusMonths(3);
        List<Transaction> historicalTransactions = transactionRepository
                .findByUserAndTransactionDateBetween(user, threeMonthsAgo, LocalDate.now());
        
        if (historicalTransactions.size() < 10) {
            throw new RuntimeException("Insufficient transaction history for AI prediction. Need at least 10 transactions.");
        }
        
        // Prepare financial summary for AI
        String financialSummary = prepareFinancialSummary(historicalTransactions, user);
        
        // Build AI prompt
        String prompt = buildPredictionPrompt(financialSummary, startDate, endDate);
        
        // Call AI API
        String aiResponse = callOpenRouterAPI(prompt);
        
        // Parse and return AI response
        return parseAIResponse(aiResponse, startDate, endDate);
    }
    
    private String prepareFinancialSummary(List<Transaction> transactions, User user) {
        // Calculate totals
        BigDecimal totalIncome = transactions.stream()
            .filter(t -> t.getType() == TransactionType.INCOME)
            .map(Transaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalExpense = transactions.stream()
            .filter(t -> t.getType() == TransactionType.EXPENSE)
            .map(Transaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Get actual current balance from bank accounts
        BigDecimal currentBalance = getCurrentBalance(user);
        
        // Category breakdown
        Map<String, BigDecimal> categorySpending = new LinkedHashMap<>();
        for (Transaction t : transactions) {
            if (t.getType() == TransactionType.EXPENSE) {
                String category = t.getCategory() != null ? t.getCategory().getName() : "Other";
                categorySpending.put(category, 
                    categorySpending.getOrDefault(category, BigDecimal.ZERO).add(t.getAmount()));
            }
        }
        
        // Get top 5 spending categories
        List<Map.Entry<String, BigDecimal>> topCategories = categorySpending.entrySet().stream()
            .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
            .limit(5)
            .collect(Collectors.toList());
        
        // Calculate daily averages - FIXED: Use RoundingMode.HALF_UP
        long daysInPeriod = ChronoUnit.DAYS.between(transactions.get(transactions.size()-1).getTransactionDate(), LocalDate.now());
        if (daysInPeriod <= 0) daysInPeriod = 90; // Fallback
        BigDecimal dailyAvgExpense = totalExpense.divide(BigDecimal.valueOf(daysInPeriod), 2, RoundingMode.HALF_UP);
        BigDecimal dailyAvgIncome = totalIncome.divide(BigDecimal.valueOf(daysInPeriod), 2, RoundingMode.HALF_UP);
        
        StringBuilder summary = new StringBuilder();
        summary.append("=== USER FINANCIAL DATA ===\n");
        summary.append(String.format("Current Balance: ₹%.2f\n", currentBalance));
        summary.append(String.format("Total Income (3 months): ₹%.2f\n", totalIncome));
        summary.append(String.format("Total Expenses (3 months): ₹%.2f\n", totalExpense));
        summary.append(String.format("Daily Average Spending: ₹%.2f\n", dailyAvgExpense));
        summary.append(String.format("Daily Average Income: ₹%.2f\n", dailyAvgIncome));
        
        double savingsRate = 0;
        if (totalIncome.compareTo(BigDecimal.ZERO) > 0) {
            savingsRate = totalIncome.subtract(totalExpense)
                .divide(totalIncome, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100")).doubleValue();
        }
        summary.append(String.format("Savings Rate: %.1f%%\n\n", savingsRate));
        
        summary.append("Top Spending Categories:\n");
        for (Map.Entry<String, BigDecimal> entry : topCategories) {
            summary.append(String.format("  - %s: ₹%.2f\n", entry.getKey(), entry.getValue()));
        }
        
        // Add weekly pattern insights
        summary.append("\nWeekly Spending Pattern:\n");
        Map<Integer, BigDecimal> weeklyExpense = getWeeklyExpensePattern(transactions);
        String[] dayNames = {"", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"};
        for (int i = 1; i <= 7; i++) {
            summary.append(String.format("  - %s: ₹%.2f\n", dayNames[i], weeklyExpense.getOrDefault(i, BigDecimal.ZERO)));
        }
        
        return summary.toString();
    }
    
    private Map<Integer, BigDecimal> getWeeklyExpensePattern(List<Transaction> transactions) {
        Map<Integer, BigDecimal> weeklyExpense = new HashMap<>();
        Map<Integer, Integer> countMap = new HashMap<>();
        
        for (int i = 1; i <= 7; i++) {
            weeklyExpense.put(i, BigDecimal.ZERO);
            countMap.put(i, 0);
        }
        
        for (Transaction t : transactions) {
            if (t.getType() == TransactionType.EXPENSE) {
                int dayOfWeek = t.getTransactionDate().getDayOfWeek().getValue();
                weeklyExpense.put(dayOfWeek, weeklyExpense.get(dayOfWeek).add(t.getAmount()));
                countMap.put(dayOfWeek, countMap.get(dayOfWeek) + 1);
            }
        }
        
        // Calculate averages
        for (int i = 1; i <= 7; i++) {
            if (countMap.get(i) > 0) {
                weeklyExpense.put(i, weeklyExpense.get(i).divide(BigDecimal.valueOf(countMap.get(i)), 2, RoundingMode.HALF_UP));
            }
        }
        
        return weeklyExpense;
    }
    
    private String buildPredictionPrompt(String financialSummary, LocalDate startDate, LocalDate endDate) {
        return String.format("""
            You are a financial expert AI. Based on the user's financial data below, 
            predict their financial future from %s to %s.
            
            %s
            
            Return ONLY valid JSON in this exact format (no other text, no markdown):
            {
                "predictedBalance": 0,
                "confidenceScore": 0,
                "insights": "",
                "riskFactors": [],
                "recommendations": []
            }
            
            Important rules:
            1. predictedBalance must be a realistic number based on their current balance and spending patterns
            2. confidenceScore should be between 0-100 based on data consistency
            3. insights should be 2-3 sentences of personalized financial advice
            4. riskFactors should list 2-3 potential financial risks
            5. recommendations should list 2-3 actionable steps
            
            Be realistic, conservative, and helpful.
            """,
            startDate.format(DateTimeFormatter.ISO_LOCAL_DATE),
            endDate.format(DateTimeFormatter.ISO_LOCAL_DATE),
            financialSummary);
    }
    
    private String callOpenRouterAPI(String prompt) {
        try {
            String url = "https://openrouter.ai/api/v1/chat/completions";
            
            Map<String, Object> requestBody = new LinkedHashMap<>();
            requestBody.put("model", "stepfun/step-3.5-flash");
            
            List<Map<String, String>> messages = new ArrayList<>();
            Map<String, String> systemMessage = new LinkedHashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", "You are a financial expert AI. Always respond with valid JSON only.");
            messages.add(systemMessage);
            
            Map<String, String> userMessage = new LinkedHashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", prompt);
            messages.add(userMessage);
            
            requestBody.put("messages", messages);
            requestBody.put("temperature", 0.3);
            requestBody.put("max_tokens", 1000);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey);
            headers.set("HTTP-Referer", "http://localhost:8080");
            headers.set("X-Title", "Finance AI Platform");
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            logger.info("Calling OpenRouter API...");
            ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.POST, entity, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode json = objectMapper.readTree(response.getBody());
                String content = json.path("choices").get(0).path("message").path("content").asText();
                logger.info("AI Response received successfully");
                return content;
            } else {
                throw new RuntimeException("API returned " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            logger.error("API call failed: {}", e.getMessage());
            throw new RuntimeException("AI API call failed: " + e.getMessage());
        }
    }
    
    private PredictionResponse parseAIResponse(String aiResponse, LocalDate startDate, LocalDate endDate) {
        try {
            // Clean the response (remove markdown if present)
            String cleanJson = aiResponse.replaceAll("```json\\n?", "").replaceAll("```\\n?", "").trim();
            
            // Find JSON object if there's extra text
            int startIdx = cleanJson.indexOf("{");
            int endIdx = cleanJson.lastIndexOf("}");
            if (startIdx >= 0 && endIdx > startIdx) {
                cleanJson = cleanJson.substring(startIdx, endIdx + 1);
            }
            
            JsonNode jsonNode = objectMapper.readTree(cleanJson);
            
            BigDecimal predictedBalance = jsonNode.has("predictedBalance") ? 
                new BigDecimal(jsonNode.get("predictedBalance").asText()) : BigDecimal.ZERO;
            BigDecimal confidenceScore = jsonNode.has("confidenceScore") ? 
                new BigDecimal(jsonNode.get("confidenceScore").asText()) : new BigDecimal("50");
            String insights = jsonNode.has("insights") ? 
                jsonNode.get("insights").asText() : "AI prediction completed successfully.";
            
            PredictionResponse response = new PredictionResponse(
                endDate, predictedBalance, confidenceScore, "AI-POWERED");
            response.setInsights(insights);
            
            return response;
            
        } catch (Exception e) {
            logger.error("Failed to parse AI response: {}. Raw response: {}", e.getMessage(), aiResponse);
            throw new RuntimeException("Failed to parse AI response: " + e.getMessage());
        }
    }
    
    private BigDecimal getCurrentBalance(User user) {
        return bankAccountRepository.findByUser(user).stream()
                .filter(acc -> acc.isActive())
                .map(acc -> acc.getCurrentBalance())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
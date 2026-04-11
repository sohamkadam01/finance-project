package com.College_project.project.service;

import com.College_project.project.DTOs.InvestmentAdviceRequest;
import com.College_project.project.DTOs.InvestmentAdviceResponse;
import com.College_project.project.DTOs.PortfolioAllocation;
import com.College_project.project.models.Investment;
import com.College_project.project.models.Transaction;
import com.College_project.project.models.User;
import com.College_project.project.enums.TransactionType;
import com.College_project.project.repository.investmentRepository;
import com.College_project.project.repository.transactionRepository;
import com.College_project.project.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AIInvestmentAdviceService {
    
    @Autowired
    private investmentRepository investmentRepository;
    
    @Autowired
    private transactionRepository transactionRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private InvestmentAdviceService fallbackAdviceService;
    
    @Value("${openrouter.api.key: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}")
    private String apiKey;
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @PostConstruct
    public void init() {
        System.out.println("========== AI Investment Advice Service Initialized ==========");
        if (apiKey != null && !apiKey.isEmpty()) {
            System.out.println("✅ AI Investment Advice is ENABLED");
        } else {
            System.out.println("⚠️ AI Investment Advice is DISABLED (no API key) - using fallback only");
        }
    }
    
    /**
     * Main method - tries AI first, falls back to rule-based advice if AI fails
     */
    public InvestmentAdviceResponse getInvestmentAdviceWithAIFallback(Long userId, InvestmentAdviceRequest request) {
        System.out.println("========== Investment Advice Request ==========");
        
        // Check if API key is configured
        if (apiKey == null || apiKey.isEmpty()) {
            System.out.println("No API key - using rule-based advice");
            return fallbackAdviceService.getInvestmentAdvice(userId, request);
        }
        
        try {
            System.out.println("Attempting AI-powered investment advice...");
            return getAIInvestmentAdvice(userId, request);
        } catch (Exception e) {
            System.err.println("AI advice failed: " + e.getMessage());
            System.out.println("Falling back to rule-based advice...");
            return fallbackAdviceService.getInvestmentAdvice(userId, request);
        }
    }
    
    /**
     * AI-powered investment advice using OpenRouter
     */

    
    private InvestmentAdviceResponse getAIInvestmentAdvice(Long userId, InvestmentAdviceRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Gather user financial data
        String financialData = gatherFinancialData(user, request);
        
        // Build AI prompt
        String prompt = buildInvestmentPrompt(financialData, request);
        
        // Call AI API
        String aiResponse = callOpenRouterAPI(prompt);
        
        // Parse and return AI response
        return parseAIResponse(aiResponse, request);
    }
    
    private String gatherFinancialData(User user, InvestmentAdviceRequest request) {
        // Get last 6 months of transactions
        LocalDate sixMonthsAgo = LocalDate.now().minusMonths(6);
        List<Transaction> transactions = transactionRepository
                .findByUserAndTransactionDateBetween(user, sixMonthsAgo, LocalDate.now());
        
        // Calculate financial metrics
        BigDecimal totalIncome = transactions.stream()
                .filter(t -> t.getType() == TransactionType.INCOME)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalExpense = transactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal monthlyIncome = totalIncome.divide(BigDecimal.valueOf(6), 2, RoundingMode.HALF_UP);
        BigDecimal monthlyExpense = totalExpense.divide(BigDecimal.valueOf(6), 2, RoundingMode.HALF_UP);
        BigDecimal monthlySavings = monthlyIncome.subtract(monthlyExpense);
        
        // Get existing investments
        List<Investment> investments = investmentRepository.findByUser(user);
        BigDecimal totalInvested = investments.stream()
                .map(Investment::getAmountInvested)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalCurrentValue = investments.stream()
                .map(Investment::getCurrentValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalReturns = BigDecimal.ZERO;
        if (totalInvested.compareTo(BigDecimal.ZERO) > 0) {
            totalReturns = totalCurrentValue.subtract(totalInvested)
                    .multiply(new BigDecimal("100"))
                    .divide(totalInvested, 2, RoundingMode.HALF_UP);
        }
        
        StringBuilder data = new StringBuilder();
        data.append("=== USER FINANCIAL PROFILE ===\n");
        data.append(String.format("Monthly Income: ₹%.2f\n", monthlyIncome));
        data.append(String.format("Monthly Expenses: ₹%.2f\n", monthlyExpense));
        data.append(String.format("Monthly Savings: ₹%.2f\n", monthlySavings));
        data.append(String.format("Existing Investments: ₹%.2f\n", totalInvested));
        data.append(String.format("Investment Returns: %.1f%%\n", totalReturns));
        data.append(String.format("Risk Tolerance (1-10): %.1f\n", request.getRiskTolerance()));
        data.append(String.format("Investment Horizon (years): %.0f\n", request.getInvestmentHorizon()));
        data.append(String.format("Monthly Investment Capacity: ₹%.2f\n", request.getMonthlyInvestmentCapacity()));
        data.append(String.format("Goal: %s\n", request.getGoal()));
        
        return data.toString();
    }
    
    private String buildInvestmentPrompt(String financialData, InvestmentAdviceRequest request) {
        return String.format("""
            You are an expert financial advisor AI. Based on the user's financial profile below, 
            provide personalized investment advice.
            
            %s
            
            Return ONLY valid JSON in this exact format (no other text):
            {
                "riskProfile": "ONE OF: CONSERVATIVE, MODERATELY CONSERVATIVE, MODERATE, MODERATELY AGGRESSIVE, AGGRESSIVE",
                "expectedAnnualReturns": number,
                "portfolioAllocation": [
                    {"assetClass": "Stocks", "percentage": number, "examples": "Large-cap, Index funds"},
                    {"assetClass": "Bonds", "percentage": number, "examples": "Government bonds"},
                    {"assetClass": "Cash", "percentage": number, "examples": "Savings, FD"}
                ],
                "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3", "Recommendation 4", "Recommendation 5"],
                "projectedGrowth": {
                    "totalInvestment": number,
                    "estimatedReturns": number,
                    "futureValue": number
                },
                "summary": "2-3 sentence personalized summary of the advice"
            }
            
            Important rules:
            1. Risk profile must match their risk tolerance and horizon
            2. Portfolio allocation percentages must add to 100
            3. Expected returns should be realistic (5-15%)
            4. Recommendations should be practical and actionable
            5. Be conservative and responsible in advice
            """,
            financialData);
    }
    
    private String callOpenRouterAPI(String prompt) {
        try {
            String url = "https://openrouter.ai/api/v1/chat/completions";
            
            Map<String, Object> requestBody = new LinkedHashMap<>();
            requestBody.put("model", "stepfun/step-3.5-flash");
            
            List<Map<String, String>> messages = new ArrayList<>();
            
            Map<String, String> systemMessage = new LinkedHashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", "You are a professional financial advisor AI. Always respond with valid JSON only.");
            messages.add(systemMessage);
            
            Map<String, String> userMessage = new LinkedHashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", prompt);
            messages.add(userMessage);
            
            requestBody.put("messages", messages);
            requestBody.put("temperature", 0.3);
            requestBody.put("max_tokens", 1500);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey);
            headers.set("HTTP-Referer", "http://localhost:8080");
            headers.set("X-Title", "Finance AI Platform");
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            System.out.println("Calling OpenRouter for investment advice...");
            ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.POST, entity, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode json = objectMapper.readTree(response.getBody());
                String content = json.path("choices").get(0).path("message").path("content").asText();
                System.out.println("AI response received");
                return content;
            } else {
                throw new RuntimeException("API returned " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            throw new RuntimeException("AI API call failed: " + e.getMessage());
        }
    }
    
    private InvestmentAdviceResponse parseAIResponse(String aiResponse, InvestmentAdviceRequest request) {
        try {
            // Clean the response
            String cleanJson = aiResponse.replaceAll("```json\\n?", "").replaceAll("```\\n?", "").trim();
            
            int startIdx = cleanJson.indexOf("{");
            int endIdx = cleanJson.lastIndexOf("}");
            if (startIdx >= 0 && endIdx > startIdx) {
                cleanJson = cleanJson.substring(startIdx, endIdx + 1);
            }
            
            JsonNode jsonNode = objectMapper.readTree(cleanJson);
            
            InvestmentAdviceResponse response = new InvestmentAdviceResponse();
            
            // Set risk profile
            response.setRiskProfile(jsonNode.has("riskProfile") ? 
                jsonNode.get("riskProfile").asText() : "MODERATE");
            
            // Set expected returns
            response.setExpectedAnnualReturns(jsonNode.has("expectedAnnualReturns") ? 
                new BigDecimal(jsonNode.get("expectedAnnualReturns").asText()) : new BigDecimal("10"));
            
            // Set recommended monthly investment
            response.setRecommendedMonthlyInvestment(request.getMonthlyInvestmentCapacity());
            
            // Parse portfolio allocation
            List<PortfolioAllocation> allocations = new ArrayList<>();
            if (jsonNode.has("portfolioAllocation") && jsonNode.get("portfolioAllocation").isArray()) {
                for (JsonNode alloc : jsonNode.get("portfolioAllocation")) {
                    String assetClass = alloc.has("assetClass") ? alloc.get("assetClass").asText() : "Unknown";
                    BigDecimal percentage = alloc.has("percentage") ? 
                        new BigDecimal(alloc.get("percentage").asText()) : BigDecimal.ZERO;
                    String examples = alloc.has("examples") ? alloc.get("examples").asText() : "";
                    allocations.add(new PortfolioAllocation(assetClass, percentage, examples));
                }
            }
            response.setPortfolioAllocation(allocations);
            
            // Parse recommendations
            List<String> recommendations = new ArrayList<>();
            if (jsonNode.has("recommendations") && jsonNode.get("recommendations").isArray()) {
                for (JsonNode rec : jsonNode.get("recommendations")) {
                    recommendations.add(rec.asText());
                }
            }
            response.setRecommendations(recommendations);
            
            // Parse projected growth
            Map<String, BigDecimal> projectedGrowth = new HashMap<>();
            if (jsonNode.has("projectedGrowth")) {
                JsonNode growth = jsonNode.get("projectedGrowth");
                projectedGrowth.put("totalInvestment", growth.has("totalInvestment") ? 
                    new BigDecimal(growth.get("totalInvestment").asText()) : BigDecimal.ZERO);
                projectedGrowth.put("estimatedReturns", growth.has("estimatedReturns") ? 
                    new BigDecimal(growth.get("estimatedReturns").asText()) : BigDecimal.ZERO);
                projectedGrowth.put("futureValue", growth.has("futureValue") ? 
                    new BigDecimal(growth.get("futureValue").asText()) : BigDecimal.ZERO);
            } else {
                // Calculate fallback projection
                projectedGrowth = calculateFallbackProjection(request);
            }
            response.setProjectedGrowth(projectedGrowth);
            
            // Set summary
            response.setSummary(jsonNode.has("summary") ? 
                jsonNode.get("summary").asText() : "AI-generated investment advice based on your profile.");
            
            return response;
            
        } catch (Exception e) {
            System.err.println("Failed to parse AI response: " + e.getMessage());
            throw new RuntimeException("Failed to parse AI response");
        }
    }
    
    private Map<String, BigDecimal> calculateFallbackProjection(InvestmentAdviceRequest request) {
        Map<String, BigDecimal> projection = new HashMap<>();
        
        BigDecimal monthlyInvestment = request.getMonthlyInvestmentCapacity();
        BigDecimal years = request.getInvestmentHorizon();
        BigDecimal annualReturns = new BigDecimal("10");
        
        BigDecimal totalInvestment = monthlyInvestment.multiply(new BigDecimal("12")).multiply(years);
        BigDecimal monthlyRate = annualReturns.divide(new BigDecimal("1200"), 4, RoundingMode.HALF_UP);
        BigDecimal months = years.multiply(new BigDecimal("12"));
        
        BigDecimal onePlusR = BigDecimal.ONE.add(monthlyRate);
        BigDecimal power = BigDecimal.valueOf(Math.pow(onePlusR.doubleValue(), months.doubleValue()));
        BigDecimal futureValue = monthlyInvestment
                .multiply(power.subtract(BigDecimal.ONE))
                .divide(monthlyRate, 2, RoundingMode.HALF_UP)
                .multiply(onePlusR);
        
        projection.put("totalInvestment", totalInvestment);
        projection.put("estimatedReturns", futureValue.subtract(totalInvestment));
        projection.put("futureValue", futureValue);
        
        return projection;
    }
}
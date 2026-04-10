package com.College_project.project.service;

import com.College_project.project.models.OcrDocument;
import com.College_project.project.models.Transaction;
import com.College_project.project.models.User;
import com.College_project.project.enums.TransactionType;
import com.College_project.project.repository.OcrDocumentRepository;
import com.College_project.project.repository.transactionRepository;
import com.College_project.project.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class OcrProcessingService {
    
    @Autowired
    private OcrDocumentRepository ocrDocumentRepository;
    
    @Autowired
    private transactionRepository transactionRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private CategorizationService categorizationService;
    
    /**
     * Process OCR document and create transactions from extracted text
     */
    @Transactional
    public OcrDocument processDocument(Long documentId, Long userId) {
        OcrDocument document = ocrDocumentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        
        if (!document.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        
        String extractedText = document.getExtractedText();
        
        // Extract financial information
        extractAmount(document, extractedText);
        extractDate(document, extractedText);
        extractVendor(document, extractedText);
        
        // Create transaction from extracted data
        if (document.getExtractedAmount() != null && document.getExtractedDate() != null) {
            createTransactionFromDocument(document);
        }
        
        document.setProcessed(true);
        document.setProcessingStatus("PROCESSED");
        
        return ocrDocumentRepository.save(document);
    }
    
    private void extractAmount(OcrDocument document, String text) {
        if (text == null) return;
        
        // Pattern for Indian Rupee amounts
        Pattern amountPattern = Pattern.compile("(?:₹|Rs\\.?|INR)\\s*(\\d+(?:[.,]\\d{2})?)");
        Matcher matcher = amountPattern.matcher(text);
        
        if (matcher.find()) {
            String amountStr = matcher.group(1).replace(",", "");
            document.setExtractedAmount(amountStr);
        }
    }
    
    private void extractDate(OcrDocument document, String text) {
        if (text == null) return;
        
        // Pattern for dates
        Pattern datePattern = Pattern.compile("(\\d{2}[/-]\\d{2}[/-]\\d{4})|(\\d{4}-\\d{2}-\\d{2})");
        Matcher matcher = datePattern.matcher(text);
        
        if (matcher.find()) {
            document.setExtractedDate(matcher.group());
        }
    }
    
    private void extractVendor(OcrDocument document, String text) {
        if (text == null) return;
        
        String[] lines = text.split("\\n");
        for (int i = 0; i < Math.min(5, lines.length); i++) {
            String line = lines[i].trim().toUpperCase();
            if (line.length() > 3 && line.length() < 50) {
                document.setExtractedVendor(line);
                break;
            }
        }
    }
    
    private void createTransactionFromDocument(OcrDocument document) {
        try {
            BigDecimal amount = new BigDecimal(document.getExtractedAmount());
            LocalDate transactionDate = parseDate(document.getExtractedDate());
            String description = document.getExtractedVendor() != null ? 
                document.getExtractedVendor() : document.getFilename();
            
            // Determine if it's expense or income
            TransactionType type = TransactionType.EXPENSE;
            String text = document.getExtractedText() != null ? document.getExtractedText().toUpperCase() : "";
            if (text.contains("SALARY") || text.contains("CREDIT") || text.contains("DEPOSIT")) {
                type = TransactionType.INCOME;
            }
            
            // Create transaction
            Transaction transaction = new Transaction();
            transaction.setUser(document.getUser());
            transaction.setAmount(amount);
            transaction.setType(type);
            transaction.setDescription(description);
            transaction.setTransactionDate(transactionDate);
            transaction.setCreatedAt(LocalDateTime.now());
            transaction.setStatus("COMPLETED");
            
            // Auto-categorize
            transaction.setCategory(categorizationService.categorizeTransaction(description));
            
            transactionRepository.save(transaction);
            
            System.out.println("✅ Transaction created from OCR: " + description + " - ₹" + amount);
            
        } catch (Exception e) {
            System.err.println("Failed to create transaction: " + e.getMessage());
        }
    }
    
    private LocalDate parseDate(String dateStr) {
        if (dateStr == null) return LocalDate.now();
        
        try {
            if (dateStr.contains("/")) {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                return LocalDate.parse(dateStr, formatter);
            } else if (dateStr.contains("-")) {
                return LocalDate.parse(dateStr);
            }
        } catch (Exception e) {
            // Fallback
        }
        return LocalDate.now();
    }
}
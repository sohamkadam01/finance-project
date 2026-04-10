package com.College_project.project.controller;

import com.College_project.project.models.OcrDocument;
import com.College_project.project.models.User;
import com.College_project.project.repository.OcrDocumentRepository;
import com.College_project.project.repository.UserRepository;
import com.College_project.project.service.OcrServiceClient;
import com.College_project.project.service.OcrTextParserService;
import com.College_project.project.service.OcrProcessingService;
import com.College_project.project.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/ocr")
public class OcrController {
    
    @Autowired
    private OcrServiceClient ocrServiceClient;
    
    @Autowired
    private OcrDocumentRepository ocrDocumentRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private OcrProcessingService ocrProcessingService;

    @Autowired
private OcrTextParserService ocrTextParserService;
    
    @Value("${spring.servlet.multipart.max-file-size:10MB}")
    private String maxFileSize;
    
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "OCR Controller");
        response.put("maxFileSize", maxFileSize);
        response.put("timestamp", LocalDateTime.now());
        
        // Check Python service
        try {
            Map pythonHealth = ocrServiceClient.healthCheck().block();
            response.put("pythonService", pythonHealth);
        } catch (Exception e) {
            response.put("pythonService", "Not available: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }


    @PostMapping("/process/{documentId}")
public ResponseEntity<?> processDocument(
        @PathVariable Long documentId,
        Authentication authentication) {
    
    if (authentication == null || !authentication.isAuthenticated()) {
        return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    }
    
    UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
    
    try {
        OcrTextParserService.ProcessingResult result = ocrTextParserService.processOcrDocument(documentId, userDetails.getId());
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Document processed successfully!");
        response.put("summary", result.toSummary());
        response.put("extractedItems", result.getExtractedTransactions());
        response.put("transactionsCreated", result.getCreatedTransactions().size());
        
        return ResponseEntity.ok(response);
        
    } catch (Exception e) {
        Map<String, String> error = new HashMap<>();
        error.put("error", e.getMessage());
        return ResponseEntity.badRequest().body(error);
    }
}

@PostMapping("/process-all")
public ResponseEntity<?> processAllDocuments(Authentication authentication) {
    
    if (authentication == null || !authentication.isAuthenticated()) {
        return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    }
    
    try {
        ocrTextParserService.batchProcessDocuments();
        
        Map<String, String> response = new HashMap<>();
        response.put("success", "true");
        response.put("message", "All pending documents processed successfully!");
        
        return ResponseEntity.ok(response);
        
    } catch (Exception e) {
        Map<String, String> error = new HashMap<>();
        error.put("error", e.getMessage());
        return ResponseEntity.badRequest().body(error);
    }
}

@GetMapping("/document/{documentId}/analysis")
public ResponseEntity<?> getDocumentAnalysis(
        @PathVariable Long documentId,
        Authentication authentication) {
    
    if (authentication == null || !authentication.isAuthenticated()) {
        return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
    }
    
    UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
    OcrDocument document = ocrDocumentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Document not found"));
    
    if (!document.getUser().getUserId().equals(userDetails.getId())) {
        return ResponseEntity.status(403).body(Map.of("error", "Unauthorized"));
    }
    
    Map<String, Object> analysis = new HashMap<>();
    analysis.put("documentId", document.getDocumentId());
    analysis.put("filename", document.getFilename());
    analysis.put("uploadedAt", document.getUploadedAt());
    analysis.put("processed", document.isProcessed());
    analysis.put("extractedAmount", document.getExtractedAmount());
    analysis.put("extractedDate", document.getExtractedDate());
    analysis.put("extractedVendor", document.getExtractedVendor());
    analysis.put("fullText", document.getExtractedText());
    
    return ResponseEntity.ok(analysis);
}

    
    @PostMapping("/extract")
    public ResponseEntity<?> extractTextFromImage(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        
        // Check authentication
        if (authentication == null || !authentication.isAuthenticated()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "User not authenticated");
            error.put("message", "Please login first");
            return ResponseEntity.status(401).body(error);
        }
        
        try {
            // Get user
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            User user = userRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Validate file
            if (file == null || file.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "File is empty");
                error.put("message", "Please select a file to upload");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Validate file type
            String filename = file.getOriginalFilename();
            if (filename == null || (!filename.toLowerCase().endsWith(".jpg") && 
                !filename.toLowerCase().endsWith(".jpeg") && 
                !filename.toLowerCase().endsWith(".png") &&
                !filename.toLowerCase().endsWith(".pdf"))) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Unsupported file type");
                error.put("message", "Only JPG, JPEG, PNG, and PDF files are supported");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Validate file size (max 5MB for OCR)
            if (file.getSize() > 5 * 1024 * 1024) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "File too large");
                error.put("message", "Maximum file size is 5MB. Your file: " + (file.getSize() / 1024 / 1024) + "MB");
                error.put("maxSize", "5MB");
                return ResponseEntity.badRequest().body(error);
            }
            
            System.out.println("📄 Processing file: " + filename);
            System.out.println("📊 File size: " + file.getSize() + " bytes");
            System.out.println("👤 User: " + user.getEmail());
            
            // Save file temporarily
            File tempFile = File.createTempFile("ocr_", "_" + filename);
            try (FileOutputStream fos = new FileOutputStream(tempFile)) {
                fos.write(file.getBytes());
            }
            
            try {
                // Call Python OCR service
                System.out.println("📤 Sending to Python OCR service...");
                OcrServiceClient.OcrResponse ocrResult = ocrServiceClient.extractText(tempFile).block();
                
                if (ocrResult == null || !ocrResult.isSuccess()) {
                    Map<String, String> error = new HashMap<>();
                    error.put("error", "OCR processing failed");
                    error.put("message", "Could not extract text from image");
                    return ResponseEntity.status(500).body(error);
                }
                
                // Store in database
                OcrDocument ocrDocument = new OcrDocument();
                ocrDocument.setUser(user);
                ocrDocument.setFilename(filename);
                ocrDocument.setExtractedText(ocrResult.getExtracted_text());
                ocrDocument.setDocumentType("RECEIPT");
                ocrDocument.setUploadedAt(LocalDateTime.now());
                ocrDocument.setProcessed(false);
                ocrDocument.setProcessingStatus("PENDING");
                
                OcrDocument saved = ocrDocumentRepository.save(ocrDocument);
                
                // Return response
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("documentId", saved.getDocumentId());
                response.put("filename", ocrResult.getFilename());
                response.put("extractedText", ocrResult.getExtracted_text());
                response.put("textLength", ocrResult.getText_length());
                response.put("wordCount", ocrResult.getWord_count());
                response.put("message", "OCR completed successfully!");
                
                System.out.println("✅ OCR completed! Extracted " + ocrResult.getText_length() + " characters");
                
                return ResponseEntity.ok(response);
                
            } catch (Exception e) {
                System.err.println("❌ OCR failed: " + e.getMessage());
                Map<String, String> error = new HashMap<>();
                error.put("error", "OCR processing failed");
                error.put("message", e.getMessage());
                return ResponseEntity.status(500).body(error);
            } finally {
                if (tempFile.exists()) {
                    tempFile.delete();
                }
            }
            
        } catch (Exception e) {
            System.err.println("❌ Error: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "Internal server error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}
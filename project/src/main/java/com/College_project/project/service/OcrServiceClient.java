package com.College_project.project.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.io.File;
import java.util.Map;

@Service
public class OcrServiceClient {
    
    private final WebClient webClient;
    
    public OcrServiceClient(
            WebClient.Builder webClientBuilder,
            @Value("${ocr.service.url:http://localhost:8000}") String ocrServiceUrl) {
        this.webClient = webClientBuilder
                .baseUrl(ocrServiceUrl)
                .build();
    }
    
    /**
     * Send image to Python OCR service and get extracted text
     */
    public Mono<OcrResponse> extractText(File imageFile) {
        MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();
        bodyBuilder.part("file", new FileSystemResource(imageFile));
        
        return webClient.post()
                .uri("/ocr/extract")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
                .retrieve()
                .bodyToMono(OcrResponse.class);
    }
    
    /**
     * Check if Python OCR service is healthy
     */
    public Mono<Map> healthCheck() {
        return webClient.get()
                .uri("/health")
                .retrieve()
                .bodyToMono(Map.class);
    }
    
    // Response DTO
    public static class OcrResponse {
        private boolean success;
        private String filename;
        private String extracted_text;
        private int text_length;
        private int word_count;
        
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        
        public String getFilename() { return filename; }
        public void setFilename(String filename) { this.filename = filename; }
        
        public String getExtracted_text() { return extracted_text; }
        public void setExtracted_text(String extracted_text) { this.extracted_text = extracted_text; }
        
        public int getText_length() { return text_length; }
        public void setText_length(int text_length) { this.text_length = text_length; }
        
        public int getWord_count() { return word_count; }
        public void setWord_count(int word_count) { this.word_count = word_count; }
    }
}
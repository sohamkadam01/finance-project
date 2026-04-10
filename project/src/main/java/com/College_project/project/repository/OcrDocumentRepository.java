package com.College_project.project.repository;

import com.College_project.project.models.OcrDocument;
import com.College_project.project.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OcrDocumentRepository extends JpaRepository<OcrDocument, Long> {
    List<OcrDocument> findByUser(User user);
    List<OcrDocument> findByUserAndProcessedFalse(User user);
    List<OcrDocument> findByUserOrderByUploadedAtDesc(User user);
       // Add this method
    List<OcrDocument> findByProcessedFalse();
}
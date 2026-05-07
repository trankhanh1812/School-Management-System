package com.school.school_management.service.score;

import com.school.school_management.dto.score.ScoreImportPreviewResponse;
import org.springframework.web.multipart.MultipartFile;

public interface ScoreImportService {

    ScoreImportPreviewResponse previewImport(MultipartFile file);

    ScoreImportPreviewResponse processImport(MultipartFile file);
}
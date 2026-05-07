package com.school.school_management.service.classroom;

import com.school.school_management.dto.classroom.PromotionImportPreviewResponse;
import org.springframework.web.multipart.MultipartFile;

public interface PromotionImportService {

    PromotionImportPreviewResponse previewImport(MultipartFile file);

    PromotionImportPreviewResponse processImport(MultipartFile file);
}
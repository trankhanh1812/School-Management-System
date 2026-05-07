package com.school.school_management.service.teaching;

import com.school.school_management.dto.teaching.TimetableImportPreviewResponse;
import org.springframework.web.multipart.MultipartFile;

public interface TimetableImportService {

    TimetableImportPreviewResponse previewImport(MultipartFile file);

    TimetableImportPreviewResponse processImport(MultipartFile file);
}

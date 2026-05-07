package com.school.school_management.service.student;

import com.school.school_management.dto.student.BulkImportRequest;
import com.school.school_management.dto.student.BulkImportResponse;
import com.school.school_management.dto.student.StudentImportPreviewResponse;
import org.springframework.web.multipart.MultipartFile;

/**
 * Service interface for bulk student import
 */
public interface ImportService {
    /**
     * Get preview of bulk import from Excel file
     * Parses and validates data without committing to database
     *
     * @param file Excel file containing student and parent data
     * @return Preview response with parsed data and validation errors
     */
    StudentImportPreviewResponse getImportPreview(MultipartFile file);

    /**
     * Process bulk import from Excel file
     *
     * @param file Excel file containing student and parent data
     * @return Import response with success/error details
     */
    BulkImportResponse processBulkImport(MultipartFile file);

    /**
     * Get previously generated error report by import ID
     *
     * @param importId UUID of the import operation
     * @return Error report file content
     */
    byte[] getErrorReport(String importId);
}

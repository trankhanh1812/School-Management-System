package com.school.school_management.dto.student;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO for bulk import operation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkImportResponse {
    private UUID importId;
    private Integer totalRecords;
    private Integer successfulRecords;
    private Integer failedRecords;
    private List<ImportErrorRecord> errors = new ArrayList<>();
    private String message;
}

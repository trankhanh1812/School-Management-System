package com.school.school_management.dto.student;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Request DTO for bulk import of students and parents
 * Used for file upload processing
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkImportRequest {
    private List<StudentImportRequest> students = new ArrayList<>();
    private List<ParentImportRequest> parents = new ArrayList<>();
}

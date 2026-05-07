package com.school.school_management.dto.teaching;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.Data;

@Data
public class TeachingConflictCheckRequest {

    @NotBlank
    private String semesterCode;

    @NotBlank
    private String academicYearCode;

    @NotBlank
    private String subjectCode;

    @NotEmpty
    @Valid
    private List<AssignmentCandidate> assignments;

    @Data
    public static class AssignmentCandidate {
        @NotBlank
        private String classCode;

        @NotBlank
        private String teacherCode;
    }
}

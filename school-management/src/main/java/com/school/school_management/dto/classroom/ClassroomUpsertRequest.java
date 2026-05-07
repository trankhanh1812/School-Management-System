package com.school.school_management.dto.classroom;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassroomUpsertRequest {

    @NotBlank(message = "Class code is required")
    private String classCode;

    @NotBlank(message = "Class name is required")
    private String className;

    @NotBlank(message = "Academic year code is required")
    private String academicYearCode;

    @NotNull(message = "Grade level is required")
    private Short gradeLevel;

    private String homeroomTeacherCode;

    @NotNull(message = "Capacity is required")
    @Positive(message = "Capacity must be greater than 0")
    private Integer capacity;
}

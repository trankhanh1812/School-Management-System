package com.school.school_management.dto.teaching;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

@Data
public class TimetableGridUpsertRequest {

    @NotBlank
    private String semesterCode;

    @NotBlank
    private String academicYearCode;

    @NotBlank
    private String versionName;

    @NotNull
    private LocalDate effectiveFrom;

    @NotNull
    private LocalDate effectiveTo;

    private String status;

    @NotEmpty
    @Valid
    private List<TimetableEntry> entries;

    @Data
    public static class TimetableEntry {

        @NotBlank
        private String classCode;

        @NotBlank
        private String subjectCode;

        @NotNull
        @Min(1)
        @Max(6)
        private Short dayOfWeek;

        @NotNull
        @Min(1)
        @Max(10)
        private Short periodStart;

        @NotNull
        @Min(1)
        @Max(10)
        private Short periodEnd;
    }
}

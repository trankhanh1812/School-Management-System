package com.school.school_management.dto.teaching;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TeachingConflictCheckResponse {
    private List<String> missingTimetableClasses;
    private List<ConflictItem> conflicts;

    @Data
    @Builder
    public static class ConflictItem {
        private String teacherCode;
        private String teacherName;
        private String subjectCode;
        private Short dayOfWeek;
        private Short periodStart;
        private Short periodEnd;
        private List<String> affectedClasses;
    }
}

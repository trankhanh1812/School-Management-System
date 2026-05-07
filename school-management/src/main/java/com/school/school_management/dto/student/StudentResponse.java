package com.school.school_management.dto.student;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentResponse {

    private String studentCode;
    private String fullName;
    private String className;
    private String academicYear;
    private String conduct;
    private String scoreAverage;
    private String status;
    private String homeroomTeacher;
    private String dateOfBirth;
    private String gender;
    private String phone;
    private String email;
    private String address;
    private String avatarLabel;
    private List<ParentSummary> parents;
    private List<AcademicHistoryItem> academicHistory;
    private List<TranscriptItem> transcript;
    private List<TranscriptOverviewItem> transcriptOverview;
    private List<SubjectResultItem> subjectResults;
    private List<String> alerts;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ParentSummary {
        private String role;
        private String fullName;
        private String phone;
        private String email;
        private String accountStatus;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AcademicHistoryItem {
        private String academicYear;
        private String className;
        private String result;
        private String note;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TranscriptItem {
        private String subject;
        private String semester1;
        private String semester2;
        private String yearAverage;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TranscriptOverviewItem {
        private String academicYear;
        private String className;
        private String semesterAverage;
        private String yearAverage;
        private String academicRank;
        private String conduct;
        private String absences;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SubjectResultItem {
        private String academicYear;
        private String subject;
        private String teacher;
        private String semester;
        private String officialAverage;
        private String surveyAverage;
        private String rank;
        private List<AssessmentItem> assessments;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssessmentItem {
        private String assessmentName;
        private String category;
        private String weight;
        private String score;
        private String recordedBy;
        private String recordedAt;
        private String status;
    }
}

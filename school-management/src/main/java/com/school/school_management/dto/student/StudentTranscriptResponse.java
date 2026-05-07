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
public class StudentTranscriptResponse {

    private List<StudentResponse.TranscriptItem> transcript;
    private List<StudentResponse.TranscriptOverviewItem> transcriptOverview;
}

package com.school.school_management.service.exam;

import com.school.school_management.dto.exam.ExamResponse;
import com.school.school_management.dto.exam.ExamUpsertRequest;
import java.util.List;

public interface ExamService {

    List<ExamResponse> listExams();

    ExamResponse getExam(String examId);

    ExamResponse createExam(ExamUpsertRequest request);

    ExamResponse updateExam(String examId, ExamUpsertRequest request);

    void deleteExam(String examId);
}

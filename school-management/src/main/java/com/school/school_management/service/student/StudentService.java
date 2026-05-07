package com.school.school_management.service.student;

import com.school.school_management.dto.student.StudentResponse;
import com.school.school_management.dto.student.PromotionHistoryResponse;
import com.school.school_management.dto.student.ScoreHistoryResponse;
import com.school.school_management.dto.student.StudentTranscriptResponse;
import com.school.school_management.dto.student.StudentUpsertRequest;
import java.util.List;

public interface StudentService {

    List<StudentResponse> getStudents(String academicYearCode, String classQuery, String status, String search, Integer limit, String scope);

    StudentResponse getStudentByCode(String studentCode);

    List<StudentResponse.SubjectResultItem> getStudentScores(String studentCode);

    StudentTranscriptResponse getStudentTranscript(String studentCode);

    StudentResponse getMyProfile();

    List<StudentResponse.SubjectResultItem> getMyScores();

    StudentTranscriptResponse getMyTranscript();

    PromotionHistoryResponse getPromotionHistory(String studentCode);

    ScoreHistoryResponse getScoreHistory(String studentCode);


    StudentResponse createStudent(StudentUpsertRequest request);

    StudentResponse updateStudent(String studentCode, StudentUpsertRequest request);

    void deleteStudent(String studentCode);
}

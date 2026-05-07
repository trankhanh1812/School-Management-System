package com.school.school_management.service.subject;

import com.school.school_management.dto.subject.SubjectMetricResponse;
import com.school.school_management.dto.subject.SubjectResponse;
import com.school.school_management.dto.subject.SubjectUpsertRequest;
import java.util.List;

public interface SubjectService {

    List<SubjectResponse> getSubjects();

    SubjectResponse getSubjectByCode(String subjectCode);

    SubjectResponse createSubject(SubjectUpsertRequest request);

    SubjectResponse updateSubject(String subjectCode, SubjectUpsertRequest request);

    void deleteSubject(String subjectCode);

    List<SubjectMetricResponse> getMetrics();
}

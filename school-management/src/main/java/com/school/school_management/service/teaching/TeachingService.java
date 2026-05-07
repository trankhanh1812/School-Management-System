package com.school.school_management.service.teaching;

import com.school.school_management.dto.teaching.TeachingAssignmentResponse;
import com.school.school_management.dto.teaching.TeachingConflictCheckRequest;
import com.school.school_management.dto.teaching.TeachingConflictCheckResponse;
import com.school.school_management.dto.teaching.TeachingAssignmentUpsertRequest;
import com.school.school_management.dto.teaching.TeachingMetricResponse;
import com.school.school_management.dto.teaching.TimetableEntryResponse;
import com.school.school_management.dto.teaching.TimetableGridUpsertRequest;
import com.school.school_management.dto.teaching.TimetableVersionResponse;
import java.util.List;

public interface TeachingService {

    List<TeachingAssignmentResponse> getTeachingAssignments();

    TeachingAssignmentResponse getTeachingAssignment(String assignmentId);

    List<TeachingAssignmentResponse> getTeachingAssignmentsByDepartment(String departmentCode);

    List<TeachingAssignmentResponse> getTeachingAssignmentsBySubject(String subjectCode, String semesterCode, String academicYearCode, String gradeLevel);

    List<TeachingAssignmentResponse> getTeachingAssignmentsByCurrentUser(String academicYearId);

    TeachingAssignmentResponse createTeachingAssignment(TeachingAssignmentUpsertRequest request);

    TeachingAssignmentResponse updateTeachingAssignment(String assignmentId, TeachingAssignmentUpsertRequest request);

    void deleteTeachingAssignment(String assignmentId);

    List<TeachingMetricResponse> getMetrics();

    List<TimetableEntryResponse> getTimetableGrid(String semesterCode, String academicYearCode, String versionId);

    List<TimetableVersionResponse> getTimetableVersions(String semesterCode, String academicYearCode);

    void upsertTimetableGrid(TimetableGridUpsertRequest request);

    TeachingConflictCheckResponse checkConflicts(TeachingConflictCheckRequest request);
}

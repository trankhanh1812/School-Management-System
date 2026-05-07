package com.school.school_management.service.teacher;

import com.school.school_management.dto.teacher.AvailableHomeroomTeacherResponse;
import com.school.school_management.dto.teacher.TeacherDepartmentResponse;
import com.school.school_management.dto.teacher.TeacherMetricResponse;
import com.school.school_management.dto.teacher.TeacherResponse;
import com.school.school_management.dto.teacher.TeacherUpsertRequest;
import java.util.List;

public interface TeacherService {

    List<TeacherResponse> getTeachers(String departmentQuery, String search, Integer limit);

    TeacherResponse getTeacherByCode(String teacherCode);

    TeacherResponse createTeacher(TeacherUpsertRequest request);

    TeacherResponse updateTeacher(String teacherCode, TeacherUpsertRequest request);

    void deleteTeacher(String teacherCode);

    List<TeacherDepartmentResponse> getDepartments();

    List<TeacherMetricResponse> getMetrics();

    List<AvailableHomeroomTeacherResponse> getAvailableHomeroomTeachers();
}

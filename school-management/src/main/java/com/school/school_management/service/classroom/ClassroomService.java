package com.school.school_management.service.classroom;

import com.school.school_management.dto.classroom.ClassStudentResponse;
import com.school.school_management.dto.classroom.ClassroomMetricResponse;
import com.school.school_management.dto.classroom.ClassroomResponse;
import com.school.school_management.dto.classroom.ClassroomUpsertRequest;
import com.school.school_management.dto.classroom.PromotionPlanResponse;
import java.util.List;

public interface ClassroomService {

    List<ClassroomResponse> getClassrooms(String academicYearCode, String search, Integer limit, String scope);

    ClassroomResponse getClassroomByCode(String classCode);

    ClassroomResponse createClassroom(ClassroomUpsertRequest request);

    ClassroomResponse updateClassroom(String classCode, ClassroomUpsertRequest request);

    void deleteClassroom(String classCode);

    List<ClassroomMetricResponse> getMetrics();

    List<ClassStudentResponse> getStudentsByClassCode(String classCode);

    List<PromotionPlanResponse> getPromotionPlansByClassCode(String classCode);
}

package com.school.school_management.repository;

import com.school.school_management.entity.Teacher;
import com.school.school_management.entity.TeachingAssignment;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface TeachingAssignmentRepository extends BaseRepository<TeachingAssignment, UUID> {

    List<TeachingAssignment> findByTeacherOrderBySemester_AcademicYear_CodeDescSemester_CodeAsc(Teacher teacher);

    List<TeachingAssignment> findByTeacherAndSemester_AcademicYear_IdOrderBySemester_AcademicYear_CodeDescSemester_CodeAsc(Teacher teacher, UUID academicYearId);

    List<TeachingAssignment> findAllByOrderBySemester_AcademicYear_CodeDescSemester_CodeAsc();

    Optional<TeachingAssignment> findByTeacher_TeacherCodeIgnoreCaseAndSchoolClass_ClassCodeIgnoreCaseAndSubject_CodeIgnoreCaseAndSemester_CodeIgnoreCaseAndSemester_AcademicYear_CodeIgnoreCase(
        String teacherCode,
        String classCode,
        String subjectCode,
        String semesterCode,
        String academicYearCode);

    long countByTeacher_DeletedAtIsNull();

    List<TeachingAssignment> findByTeacher_Department_CodeIgnoreCase(String departmentCode);

    List<TeachingAssignment> findBySubject_CodeIgnoreCase(String subjectCode);

    List<TeachingAssignment> findBySubject_CodeIgnoreCaseAndSemester_CodeIgnoreCaseAndSemester_AcademicYear_CodeIgnoreCase(
        String subjectCode,
        String semesterCode,
        String academicYearCode);

    List<TeachingAssignment> findBySubject_CodeIgnoreCaseAndSemester_CodeIgnoreCaseAndSemester_AcademicYear_CodeIgnoreCaseAndSchoolClass_GradeLevel(
        String subjectCode,
        String semesterCode,
        String academicYearCode,
        Integer gradeLevel);

    List<TeachingAssignment> findBySemester_CodeIgnoreCaseAndSemester_AcademicYear_CodeIgnoreCase(
        String semesterCode,
        String academicYearCode);

    java.util.Optional<TeachingAssignment> findFirstBySchoolClass_ClassCodeIgnoreCaseAndSubject_CodeIgnoreCaseAndSemester_CodeIgnoreCaseAndSemester_AcademicYear_CodeIgnoreCase(
        String classCode,
        String subjectCode,
        String semesterCode,
        String academicYearCode);

    boolean existsByTeacher_IdAndSchoolClass_IdAndSubject_Id(
        UUID teacherId,
        UUID classId,
        UUID subjectId);
}

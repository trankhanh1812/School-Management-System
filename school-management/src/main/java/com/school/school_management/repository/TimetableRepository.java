package com.school.school_management.repository;

import com.school.school_management.entity.Timetable;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface TimetableRepository extends BaseRepository<Timetable, UUID> {

    List<Timetable> findByVersion_Id(UUID versionId);

    long countByVersion_Id(UUID versionId);

    void deleteByVersion_Id(UUID versionId);

    List<Timetable> findByVersion_Semester_CodeIgnoreCaseAndVersion_Semester_AcademicYear_CodeIgnoreCase(
        String semesterCode,
        String academicYearCode);

    List<Timetable> findByVersion_Semester_CodeIgnoreCaseAndVersion_Semester_AcademicYear_CodeIgnoreCaseAndSchoolClass_ClassCodeIgnoreCaseAndSubject_CodeIgnoreCase(
        String semesterCode,
        String academicYearCode,
        String classCode,
        String subjectCode);
}

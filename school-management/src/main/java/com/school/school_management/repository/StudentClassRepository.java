package com.school.school_management.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Repository;

import com.school.school_management.entity.AcademicYear;
import com.school.school_management.entity.SchoolClass;
import com.school.school_management.entity.Student;
import com.school.school_management.entity.StudentClass;

@Repository
public interface StudentClassRepository extends BaseRepository<StudentClass, UUID> {

    List<StudentClass> findByStudentOrderByStartDateDesc(Student student);

    List<StudentClass> findBySchoolClassAndEndDateIsNull(SchoolClass schoolClass);

    Optional<StudentClass> findFirstByStudentAndEndDateIsNullOrderByStartDateDesc(Student student);

    Optional<StudentClass> findByStudentAndAcademicYear(Student student, AcademicYear academicYear);
}

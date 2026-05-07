package com.school.school_management.repository;

import com.school.school_management.entity.Semester;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface SemesterRepository extends BaseRepository<Semester, UUID> {

    Optional<Semester> findByCodeAndAcademicYear_Code(String code, String academicYearCode);

    List<Semester> findAllByOrderByStartDateDesc();

    List<Semester> findByAcademicYear_CodeOrderByStartDateDesc(String academicYearCode);
}

package com.school.school_management.repository;

import com.school.school_management.entity.TimetableVersion;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface TimetableVersionRepository extends BaseRepository<TimetableVersion, UUID> {

    Optional<TimetableVersion> findFirstBySemester_CodeIgnoreCaseAndSemester_AcademicYear_CodeIgnoreCaseAndIsActiveTrueOrderByVersionNoDesc(
        String semesterCode,
        String academicYearCode);

    java.util.List<TimetableVersion> findBySemester_CodeIgnoreCaseAndSemester_AcademicYear_CodeIgnoreCaseOrderByVersionNoDesc(
        String semesterCode,
        String academicYearCode);
}

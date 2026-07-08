package com.school.school_management.service.academic;

import com.school.school_management.dto.academic.AcademicYearUpsertRequest;
import com.school.school_management.dto.academic.SemesterUpsertRequest;
import java.util.List;
import java.util.Map;

/**
 * Admin management of the academic calendar (school years and semesters).
 * These were previously read-only (seeded directly in the DB); this service lets an
 * ADMIN create/update them and mark which year/semester is currently active.
 */
public interface AcademicCalendarService {

    List<Map<String, Object>> listYears();

    Map<String, Object> upsertYear(AcademicYearUpsertRequest request);

    Map<String, Object> activateYear(String code);

    List<Map<String, Object>> listSemesters(String academicYearCode);

    Map<String, Object> upsertSemester(SemesterUpsertRequest request);

    Map<String, Object> activateSemester(String academicYearCode, String code);
}

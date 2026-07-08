package com.school.school_management.service.academic;

import com.school.school_management.dto.academic.AcademicYearUpsertRequest;
import com.school.school_management.dto.academic.SemesterUpsertRequest;
import com.school.school_management.entity.AcademicYear;
import com.school.school_management.entity.Semester;
import com.school.school_management.exception.CustomException;
import com.school.school_management.repository.AcademicYearRepository;
import com.school.school_management.repository.SemesterRepository;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AcademicCalendarServiceImpl implements AcademicCalendarService {

    private static final String ACTIVE = "ACTIVE";
    private static final String INACTIVE = "INACTIVE";

    private final AcademicYearRepository academicYearRepository;
    private final SemesterRepository semesterRepository;

    public AcademicCalendarServiceImpl(
            AcademicYearRepository academicYearRepository,
            SemesterRepository semesterRepository) {
        this.academicYearRepository = academicYearRepository;
        this.semesterRepository = semesterRepository;
    }

    // ── Academic years ───────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listYears() {
        return academicYearRepository.findAll(Sort.by(Sort.Direction.DESC, "startDate"))
            .stream().map(this::toYearMap).toList();
    }

    @Override
    public Map<String, Object> upsertYear(AcademicYearUpsertRequest request) {
        String code = normalizeCode(request.getCode());
        LocalDate startDate = parseDate(request.getStartDate());
        LocalDate endDate = parseDate(request.getEndDate());
        assertRange(startDate, endDate);

        AcademicYear year = academicYearRepository.findByCode(code)
            .orElseGet(() -> AcademicYear.builder().code(code).build());
        year.setCode(code);
        year.setStartDate(startDate);
        year.setEndDate(endDate);
        year.setStatus(normalizeStatus(request.getStatus()));

        AcademicYear saved = academicYearRepository.save(year);
        // Keep a single active year: if this one is set ACTIVE, deactivate the others.
        if (ACTIVE.equalsIgnoreCase(saved.getStatus())) {
            for (AcademicYear other : academicYearRepository.findAll()) {
                if (other.getId() != null && !other.getId().equals(saved.getId())
                        && ACTIVE.equalsIgnoreCase(other.getStatus())) {
                    other.setStatus(INACTIVE);
                    academicYearRepository.save(other);
                }
            }
        }
        return toYearMap(saved);
    }

    @Override
    public Map<String, Object> activateYear(String code) {
        String normalized = normalizeCode(code);
        AcademicYear target = academicYearRepository.findByCode(normalized)
            .orElseThrow(() -> new CustomException("Academic year not found", 404));

        // Only one active year at a time.
        for (AcademicYear year : academicYearRepository.findAll()) {
            String desired = year.getId() != null && year.getId().equals(target.getId()) ? ACTIVE : INACTIVE;
            if (!desired.equalsIgnoreCase(year.getStatus())) {
                year.setStatus(desired);
                academicYearRepository.save(year);
            }
        }
        return toYearMap(target);
    }

    // ── Semesters ────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listSemesters(String academicYearCode) {
        List<Semester> semesters = (academicYearCode == null || academicYearCode.isBlank())
            ? semesterRepository.findAllByOrderByStartDateDesc()
            : semesterRepository.findByAcademicYear_CodeOrderByStartDateDesc(normalizeCode(academicYearCode));
        return semesters.stream().map(this::toSemesterMap).toList();
    }

    @Override
    public Map<String, Object> upsertSemester(SemesterUpsertRequest request) {
        String yearCode = normalizeCode(request.getAcademicYearCode());
        String code = normalizeCode(request.getCode());
        AcademicYear year = academicYearRepository.findByCode(yearCode)
            .orElseThrow(() -> new CustomException("Academic year not found: " + yearCode, 404));

        LocalDate startDate = parseDate(request.getStartDate());
        LocalDate endDate = parseDate(request.getEndDate());
        assertRange(startDate, endDate);

        Semester semester = semesterRepository.findByCodeAndAcademicYear_Code(code, yearCode)
            .orElseGet(() -> Semester.builder().code(code).academicYear(year).build());
        semester.setAcademicYear(year);
        semester.setCode(code);
        semester.setStartDate(startDate);
        semester.setEndDate(endDate);
        semester.setStatus(normalizeStatus(request.getStatus()));
        semester.setIsLocked(Boolean.TRUE.equals(request.getIsLocked()));

        Semester saved = semesterRepository.save(semester);
        // Keep a single active semester per year: if this one is ACTIVE, deactivate siblings.
        if (ACTIVE.equalsIgnoreCase(saved.getStatus())) {
            for (Semester other : semesterRepository.findByAcademicYear_CodeOrderByStartDateDesc(yearCode)) {
                if (other.getId() != null && !other.getId().equals(saved.getId())
                        && ACTIVE.equalsIgnoreCase(other.getStatus())) {
                    other.setStatus(INACTIVE);
                    semesterRepository.save(other);
                }
            }
        }
        return toSemesterMap(saved);
    }

    @Override
    public Map<String, Object> activateSemester(String academicYearCode, String code) {
        String yearCode = normalizeCode(academicYearCode);
        String normalizedCode = normalizeCode(code);
        Semester target = semesterRepository.findByCodeAndAcademicYear_Code(normalizedCode, yearCode)
            .orElseThrow(() -> new CustomException("Semester not found", 404));

        // Only one active semester per academic year.
        for (Semester semester : semesterRepository.findByAcademicYear_CodeOrderByStartDateDesc(yearCode)) {
            String desired = semester.getId() != null && semester.getId().equals(target.getId()) ? ACTIVE : INACTIVE;
            if (!desired.equalsIgnoreCase(semester.getStatus())) {
                semester.setStatus(desired);
                semesterRepository.save(semester);
            }
        }
        return toSemesterMap(target);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Map<String, Object> toYearMap(AcademicYear year) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", year.getId() != null ? year.getId().toString() : "");
        map.put("code", year.getCode() != null ? year.getCode() : "");
        map.put("startDate", year.getStartDate() != null ? year.getStartDate().toString() : "");
        map.put("endDate", year.getEndDate() != null ? year.getEndDate().toString() : "");
        map.put("status", year.getStatus() != null ? year.getStatus() : "");
        return map;
    }

    private Map<String, Object> toSemesterMap(Semester semester) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", semester.getId() != null ? semester.getId().toString() : "");
        map.put("code", semester.getCode() != null ? semester.getCode() : "");
        map.put("academicYearCode", semester.getAcademicYear() != null && semester.getAcademicYear().getCode() != null
            ? semester.getAcademicYear().getCode() : "");
        map.put("startDate", semester.getStartDate() != null ? semester.getStartDate().toString() : "");
        map.put("endDate", semester.getEndDate() != null ? semester.getEndDate().toString() : "");
        map.put("status", semester.getStatus() != null ? semester.getStatus() : "");
        map.put("locked", semester.getIsLocked() != null ? semester.getIsLocked() : Boolean.FALSE);
        return map;
    }

    private String normalizeCode(String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            throw new CustomException("Code is required", 400);
        }
        return raw.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return INACTIVE;
        }
        String normalized = status.trim().toUpperCase(Locale.ROOT);
        if (!ACTIVE.equals(normalized) && !INACTIVE.equals(normalized)) {
            throw new CustomException("Status must be ACTIVE or INACTIVE", 400);
        }
        return normalized;
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(value.trim());
        } catch (DateTimeParseException ex) {
            throw new CustomException("Invalid date (expected YYYY-MM-DD): " + value, 400);
        }
    }

    private void assertRange(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new CustomException("End date must not be before start date", 400);
        }
    }
}

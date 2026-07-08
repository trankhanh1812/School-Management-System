package com.school.school_management.service.teaching;

import com.school.school_management.dto.teaching.TeachingAssignmentResponse;
import com.school.school_management.dto.teaching.TeachingAssignmentUpsertRequest;
import com.school.school_management.dto.teaching.TeachingConflictCheckRequest;
import com.school.school_management.dto.teaching.TeachingConflictCheckResponse;
import com.school.school_management.dto.teaching.TeachingMetricResponse;
import com.school.school_management.dto.teaching.TimetableEntryResponse;
import com.school.school_management.dto.teaching.TimetableGridUpsertRequest;
import com.school.school_management.dto.teaching.TimetableVersionResponse;
import com.school.school_management.entity.SchoolClass;
import com.school.school_management.entity.Semester;
import com.school.school_management.entity.Student;
import com.school.school_management.entity.StudentClass;
import com.school.school_management.entity.Subject;
import com.school.school_management.entity.Teacher;
import com.school.school_management.entity.TeachingAssignment;
import com.school.school_management.entity.Timetable;
import com.school.school_management.entity.TimetableVersion;
import com.school.school_management.entity.User;
import com.school.school_management.exception.CustomException;
import com.school.school_management.enums.TimetableVersionStatus;
import com.school.school_management.repository.SchoolClassRepository;
import com.school.school_management.repository.SemesterRepository;
import com.school.school_management.repository.StudentClassRepository;
import com.school.school_management.repository.SubjectRepository;
import com.school.school_management.repository.TeacherRepository;
import com.school.school_management.repository.TeachingAssignmentRepository;
import com.school.school_management.repository.TimetableRepository;
import com.school.school_management.repository.TimetableVersionRepository;
import com.school.school_management.repository.UserRepository;
import com.school.school_management.service.notification.NotificationAutomationService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class TeachingServiceImpl implements TeachingService {

    private final TeachingAssignmentRepository teachingAssignmentRepository;
    private final TeacherRepository teacherRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SubjectRepository subjectRepository;
    private final SemesterRepository semesterRepository;
    private final UserRepository userRepository;
    private final StudentClassRepository studentClassRepository;
    private final TimetableRepository timetableRepository;
    private final TimetableVersionRepository timetableVersionRepository;
    private final ObjectMapper objectMapper;
    private final NotificationAutomationService notificationAutomationService;

    public TeachingServiceImpl(
            TeachingAssignmentRepository teachingAssignmentRepository,
            TeacherRepository teacherRepository,
            SchoolClassRepository schoolClassRepository,
            SubjectRepository subjectRepository,
            SemesterRepository semesterRepository,
            UserRepository userRepository,
            StudentClassRepository studentClassRepository,
            TimetableRepository timetableRepository,
            TimetableVersionRepository timetableVersionRepository,
            ObjectMapper objectMapper,
            NotificationAutomationService notificationAutomationService) {
        this.teachingAssignmentRepository = teachingAssignmentRepository;
        this.teacherRepository = teacherRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.subjectRepository = subjectRepository;
        this.semesterRepository = semesterRepository;
        this.userRepository = userRepository;
        this.studentClassRepository = studentClassRepository;
        this.timetableRepository = timetableRepository;
        this.timetableVersionRepository = timetableVersionRepository;
        this.objectMapper = objectMapper;
        this.notificationAutomationService = notificationAutomationService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeachingAssignmentResponse> getTeachingAssignments() {
        return getVisibleAssignments().stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TeachingAssignmentResponse getTeachingAssignment(String assignmentId) {
        TeachingAssignment assignment = getTeachingEntity(assignmentId);
        assertCanAccessAssignment(assignment);
        return toResponse(assignment);
    }

    @Override
    public TeachingAssignmentResponse createTeachingAssignment(TeachingAssignmentUpsertRequest request) {
        assertCanManageAssignments(request.getSubjectCode(), List.of(request.getTeacherCode()));
        validateDuplicate(request, null);
        validateTimetableAndConflicts(request, null);

        TeachingAssignment assignment = TeachingAssignment.builder()
            .teacher(resolveTeacher(request.getTeacherCode()))
            .schoolClass(resolveClassroom(request.getClassCode(), request.getAcademicYearCode()))
            .subject(resolveSubject(request.getSubjectCode()))
            .semester(resolveSemester(request.getSemesterCode(), request.getAcademicYearCode()))
            .isHomeroom(Boolean.TRUE.equals(request.getIsHomeroom()))
            .note(normalizeNote(request.getNote()))
            .scheduleData(serializeScheduleData(request.getScheduleData()))
            .build();

        TeachingAssignment saved = teachingAssignmentRepository.save(assignment);
        syncTimetableTeacher(request, saved);
        syncHomeroomTeacher(saved);

        notificationAutomationService.notifyUsers(
            List.of(saved.getTeacher().getUser()),
            "Phân công giảng dạy mới",
            String.format(
                "Bạn được phân công dạy môn %s cho lớp %s (%s - %s).",
                saved.getSubject() != null ? safe(saved.getSubject().getName(), "N/A") : "N/A",
                saved.getSchoolClass() != null ? safe(saved.getSchoolClass().getClassCode(), "N/A") : "N/A",
                saved.getSemester() != null ? safe(saved.getSemester().getCode(), "N/A") : "N/A",
                saved.getSemester() != null && saved.getSemester().getAcademicYear() != null
                    ? safe(saved.getSemester().getAcademicYear().getCode(), "N/A")
                    : "N/A"
            ),
            "ANNOUNCEMENT"
        );

        return toResponse(saved);
    }

    @Override
    public TeachingAssignmentResponse updateTeachingAssignment(String assignmentId, TeachingAssignmentUpsertRequest request) {
        TeachingAssignment current = getTeachingEntity(assignmentId);
        assertCanManageAssignments(request.getSubjectCode(), List.of(request.getTeacherCode()));
        validateDuplicate(request, current.getId());
        validateTimetableAndConflicts(request, current.getId());

        current.setTeacher(resolveTeacher(request.getTeacherCode()));
        current.setSchoolClass(resolveClassroom(request.getClassCode(), request.getAcademicYearCode()));
        current.setSubject(resolveSubject(request.getSubjectCode()));
        current.setSemester(resolveSemester(request.getSemesterCode(), request.getAcademicYearCode()));
        current.setIsHomeroom(Boolean.TRUE.equals(request.getIsHomeroom()));
        current.setNote(normalizeNote(request.getNote()));
        current.setScheduleData(serializeScheduleData(request.getScheduleData()));

        TeachingAssignment saved = teachingAssignmentRepository.save(current);
        syncTimetableTeacher(request, saved);
        syncHomeroomTeacher(saved);

        notificationAutomationService.notifyUsers(
            List.of(saved.getTeacher().getUser()),
            "Cập nhật phân công giảng dạy",
            String.format(
                "Phân công dạy môn %s cho lớp %s đã được cập nhật.",
                saved.getSubject() != null ? safe(saved.getSubject().getName(), "N/A") : "N/A",
                saved.getSchoolClass() != null ? safe(saved.getSchoolClass().getClassCode(), "N/A") : "N/A"
            ),
            "ANNOUNCEMENT"
        );

        return toResponse(saved);
    }

    @Override
    public void deleteTeachingAssignment(String assignmentId) {
        TeachingAssignment assignment = getTeachingEntity(assignmentId);
        if (assignment.getTeacher() != null && assignment.getTeacher().getUser() != null) {
            notificationAutomationService.notifyUsers(
                List.of(assignment.getTeacher().getUser()),
                "Phân công giảng dạy đã bị hủy",
                String.format(
                    "Phân công môn %s cho lớp %s đã bị hủy.",
                    assignment.getSubject() != null ? safe(assignment.getSubject().getName(), "N/A") : "N/A",
                    assignment.getSchoolClass() != null ? safe(assignment.getSchoolClass().getClassCode(), "N/A") : "N/A"
                ),
                "ANNOUNCEMENT"
            );
        }
        // Gỡ giáo viên khỏi các tiết TKB tương ứng (đảo ngược syncTimetableTeacher),
        // tránh để TKB hiển thị giáo viên đã bị hủy phân công.
        clearTimetableTeacher(assignment);
        teachingAssignmentRepository.delete(assignment);
    }

    /**
     * Step 2 of the timetable flow: after assigning a teacher to a subject/class/semester,
     * write that teacher onto the matching timetable slots (which were created with
     * teacher_id = NULL in step 1). Without this the timetable grid never shows the
     * assigned teacher. Applies to all versions of the semester (draft + locked).
     */
    private void syncTimetableTeacher(TeachingAssignmentUpsertRequest request, TeachingAssignment saved) {
        if (saved.getTeacher() == null) {
            return;
        }
        List<Timetable> slots = timetableRepository
            .findByVersion_Semester_CodeIgnoreCaseAndVersion_Semester_AcademicYear_CodeIgnoreCaseAndSchoolClass_ClassCodeIgnoreCaseAndSubject_CodeIgnoreCase(
                request.getSemesterCode(),
                request.getAcademicYearCode(),
                request.getClassCode(),
                request.getSubjectCode());
        if (slots.isEmpty()) {
            return;
        }
        slots.forEach(slot -> slot.setTeacher(saved.getTeacher()));
        timetableRepository.saveAll(slots);
    }

    /**
     * Đồng bộ cờ chủ nhiệm sang lớp: khi một phân công được đánh dấu isHomeroom=true,
     * cập nhật SchoolClass.homeroomTeacher cho khớp (trước đây 2 nguồn dữ liệu tách rời).
     */
    private void syncHomeroomTeacher(TeachingAssignment saved) {
        if (!Boolean.TRUE.equals(saved.getIsHomeroom())
                || saved.getSchoolClass() == null
                || saved.getTeacher() == null || saved.getTeacher().getId() == null) {
            return;
        }
        SchoolClass cls = saved.getSchoolClass();
        boolean already = cls.getHomeroomTeacher() != null
            && saved.getTeacher().getId().equals(cls.getHomeroomTeacher().getId());
        if (!already) {
            cls.setHomeroomTeacher(saved.getTeacher());
            schoolClassRepository.save(cls);
        }
    }

    /**
     * Khi hủy phân công: gỡ giáo viên đó khỏi các tiết TKB cùng lớp/môn/học kỳ
     * (đảo ngược syncTimetableTeacher). Chỉ gỡ đúng giáo viên của phân công bị xóa.
     */
    private void clearTimetableTeacher(TeachingAssignment assignment) {
        if (assignment.getTeacher() == null || assignment.getTeacher().getId() == null
                || assignment.getSchoolClass() == null
                || assignment.getSubject() == null
                || assignment.getSemester() == null
                || assignment.getSemester().getAcademicYear() == null) {
            return;
        }
        List<Timetable> slots = timetableRepository
            .findByVersion_Semester_CodeIgnoreCaseAndVersion_Semester_AcademicYear_CodeIgnoreCaseAndSchoolClass_ClassCodeIgnoreCaseAndSubject_CodeIgnoreCase(
                assignment.getSemester().getCode(),
                assignment.getSemester().getAcademicYear().getCode(),
                assignment.getSchoolClass().getClassCode(),
                assignment.getSubject().getCode());
        List<Timetable> affected = slots.stream()
            .filter(s -> s.getTeacher() != null && assignment.getTeacher().getId().equals(s.getTeacher().getId()))
            .toList();
        if (affected.isEmpty()) {
            return;
        }
        affected.forEach(s -> s.setTeacher(null));
        timetableRepository.saveAll(affected);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeachingMetricResponse> getMetrics() {
        List<TeachingAssignment> assignments = getVisibleAssignments();
        long homeroom = assignments.stream().filter(item -> Boolean.TRUE.equals(item.getIsHomeroom())).count();
        long teacherCount = assignments.stream()
            .map(item -> item.getTeacher() != null ? item.getTeacher().getTeacherCode() : null)
            .filter(code -> code != null && !code.isBlank())
            .distinct()
            .count();
        long classCount = assignments.stream()
            .map(item -> item.getSchoolClass() != null ? item.getSchoolClass().getClassCode() : null)
            .filter(code -> code != null && !code.isBlank())
            .distinct()
            .count();

        return List.of(
            TeachingMetricResponse.builder()
                .label("Phân công giảng dạy")
                .value(String.valueOf(assignments.size()))
                .trend("Realtime")
                .note("Tổng số phân công teacher-class-subject-semester.")
                .build(),
            TeachingMetricResponse.builder()
                .label("Giáo viên được phân công")
                .value(String.valueOf(teacherCount))
                .trend("Realtime")
                .note("Số giáo viên đang có assignment hiệu lực.")
                .build(),
            TeachingMetricResponse.builder()
                .label("Lớp được phủ môn")
                .value(String.valueOf(classCount))
                .trend("Realtime")
                .note("Số lớp đã có phân công giảng dạy.")
                .build(),
            TeachingMetricResponse.builder()
                .label("Phân công chủ nhiệm")
                .value(String.valueOf(homeroom))
                .trend("Ổn định")
                .note("Số assignment đang đánh dấu chủ nhiệm.")
                .build()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeachingAssignmentResponse> getTeachingAssignmentsByDepartment(String departmentCode) {
        assertCanViewDepartmentAssignments(departmentCode);
        String normalizedDepartment = normalizeCode(departmentCode);
        return teachingAssignmentRepository
            .findByTeacher_Department_CodeIgnoreCase(normalizedDepartment)
            .stream()
            .filter(assignment -> isAssignmentInDepartmentSubjectScope(assignment, normalizedDepartment))
            .filter(assignment -> isAssignmentInDepartmentTeacherScope(assignment, normalizedDepartment))
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeachingAssignmentResponse> getTeachingAssignmentsBySubject(
            String subjectCode,
            String semesterCode,
            String academicYearCode,
            String gradeLevel) {
        assertCanAccessSubjectScope(subjectCode);
        String normalizedSubjectCode = normalizeCode(subjectCode);

        if (semesterCode != null && !semesterCode.isBlank() && academicYearCode != null && !academicYearCode.isBlank()) {
            String normalizedSemesterCode = normalizeCode(semesterCode);
            String normalizedAcademicYearCode = normalizeCode(academicYearCode);

            if (gradeLevel != null && !gradeLevel.isBlank()) {
                try {
                    List<TeachingAssignment> scopedAssignments = teachingAssignmentRepository
                        .findBySubject_CodeIgnoreCaseAndSemester_CodeIgnoreCaseAndSemester_AcademicYear_CodeIgnoreCaseAndSchoolClass_GradeLevel(
                            normalizedSubjectCode,
                            normalizedSemesterCode,
                            normalizedAcademicYearCode,
                            Integer.valueOf(gradeLevel.trim()))
                        .stream()
                        .toList();

                    return applyDepartmentScopeForSubjectAssignments(scopedAssignments)
                        .stream()
                        .map(this::toResponse)
                        .toList();
                } catch (NumberFormatException e) {
                    throw new CustomException("Invalid grade level format", 400);
                }
            }

            List<TeachingAssignment> scopedAssignments = teachingAssignmentRepository
                .findBySubject_CodeIgnoreCaseAndSemester_CodeIgnoreCaseAndSemester_AcademicYear_CodeIgnoreCase(
                    normalizedSubjectCode,
                    normalizedSemesterCode,
                    normalizedAcademicYearCode)
                .stream()
                .toList();

            return applyDepartmentScopeForSubjectAssignments(scopedAssignments)
                .stream()
                .map(this::toResponse)
                .toList();
        }

        List<TeachingAssignment> scopedAssignments = teachingAssignmentRepository
            .findBySubject_CodeIgnoreCase(normalizedSubjectCode)
            .stream()
            .toList();

        return applyDepartmentScopeForSubjectAssignments(scopedAssignments)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimetableEntryResponse> getTimetableGrid(String semesterCode, String academicYearCode, String versionId) {
        String normalizedSemesterCode = normalizeCode(semesterCode);
        String normalizedAcademicYearCode = normalizeCode(academicYearCode);

        TimetableVersion currentVersion;
        if (versionId != null && !versionId.isBlank()) {
            currentVersion = resolveTimetableVersionById(versionId, normalizedSemesterCode, normalizedAcademicYearCode);
        } else {
            currentVersion = resolveCurrentTimetableVersion(normalizedSemesterCode, normalizedAcademicYearCode);
        }

        if (currentVersion == null) {
            return List.of();
        }

        return timetableRepository.findByVersion_Id(currentVersion.getId())
            .stream()
            .map(item -> TimetableEntryResponse.builder()
                .classCode(item.getSchoolClass() != null ? safe(item.getSchoolClass().getClassCode(), "") : "")
                .subjectCode(item.getSubject() != null ? safe(item.getSubject().getCode(), "") : "")
                .dayOfWeek(item.getDayOfWeek())
                .periodStart(item.getPeriodStart())
                .periodEnd(item.getPeriodEnd())
                .build())
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimetableEntryResponse> getMyTimetable(String semesterCode) {
        Student student = getCurrentStudent();

        StudentClass currentClass = studentClassRepository
            .findFirstByStudentAndEndDateIsNullOrderByStartDateDesc(student)
            .orElseThrow(() -> new CustomException("Chưa xác định được lớp hiện tại của học sinh", 404));

        SchoolClass schoolClass = currentClass.getSchoolClass();
        if (schoolClass == null || schoolClass.getClassCode() == null || schoolClass.getClassCode().isBlank()) {
            throw new CustomException("Chưa xác định được lớp hiện tại của học sinh", 404);
        }
        if (currentClass.getAcademicYear() == null || currentClass.getAcademicYear().getCode() == null
                || currentClass.getAcademicYear().getCode().isBlank()) {
            throw new CustomException("Chưa xác định được năm học hiện tại của học sinh", 404);
        }

        String classCode = normalizeCode(schoolClass.getClassCode());
        String academicYearCode = normalizeCode(currentClass.getAcademicYear().getCode());
        String resolvedSemesterCode = (semesterCode != null && !semesterCode.isBlank())
            ? semesterCode
            : resolveActiveSemesterCode(academicYearCode);

        // Reuse the existing grid builder for the resolved semester/year (active locked
        // version), then keep only the current student's class so a student cannot see
        // other classes' timetables.
        return getTimetableGrid(resolvedSemesterCode, academicYearCode, null).stream()
            .filter(entry -> classCode.equalsIgnoreCase(entry.getClassCode() != null ? entry.getClassCode().trim() : ""))
            .toList();
    }

    private String resolveActiveSemesterCode(String academicYearCode) {
        List<Semester> semesters = semesterRepository.findByAcademicYear_CodeOrderByStartDateDesc(academicYearCode);
        if (semesters.isEmpty()) {
            return "HK1";
        }
        LocalDate today = LocalDate.now();
        return semesters.stream()
            .filter(semester -> semester.getStartDate() != null && semester.getEndDate() != null
                && !today.isBefore(semester.getStartDate()) && !today.isAfter(semester.getEndDate()))
            .map(Semester::getCode)
            .findFirst()
            .orElse(semesters.get(0).getCode());
    }

    private Student getCurrentStudent() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new CustomException("Unauthenticated", 401);
        }

        User user = userRepository.findByEmail(authentication.getName().trim().toLowerCase(Locale.ROOT))
            .orElseThrow(() -> new CustomException("Current user not found", 404));

        Student student = user.getStudent();
        if (student == null) {
            throw new CustomException("Student profile not found", 403);
        }
        return student;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TimetableVersionResponse> getTimetableVersions(String semesterCode, String academicYearCode) {
        String normalizedSemesterCode = normalizeCode(semesterCode);
        String normalizedAcademicYearCode = normalizeCode(academicYearCode);

        return timetableVersionRepository
            .findBySemester_CodeIgnoreCaseAndSemester_AcademicYear_CodeIgnoreCaseOrderByVersionNoDesc(normalizedSemesterCode, normalizedAcademicYearCode)
            .stream()
            .map(version -> TimetableVersionResponse.builder()
                .versionId(version.getId() != null ? version.getId().toString() : "")
                .versionName(safe(version.getName(), "Phiên bản " + safeVersionNo(version.getVersionNo())))
                .versionNo(version.getVersionNo())
                .status(resolveTimetableVersionStatus(version).toApiValue())
                .active(Boolean.TRUE.equals(version.getIsActive()) && resolveTimetableVersionStatus(version).isLocked())
                .semesterCode(version.getSemester() != null ? safe(version.getSemester().getCode(), "") : "")
                .academicYearCode(version.getSemester() != null && version.getSemester().getAcademicYear() != null
                    ? safe(version.getSemester().getAcademicYear().getCode(), "")
                    : "")
                .effectiveFrom(version.getEffectiveFrom())
                .effectiveTo(version.getEffectiveTo())
                .entryCount(version.getId() != null ? timetableRepository.countByVersion_Id(version.getId()) : 0)
                .build())
            .toList();
    }

    @Override
    public void upsertTimetableGrid(TimetableGridUpsertRequest request) {
        String semesterCode = normalizeCode(request.getSemesterCode());
        String academicYearCode = normalizeCode(request.getAcademicYearCode());
        Semester semester = resolveSemester(semesterCode, academicYearCode);
        LocalDate effectiveFrom = request.getEffectiveFrom();
        LocalDate effectiveTo = request.getEffectiveTo();

        if (effectiveFrom == null || effectiveTo == null) {
            throw new CustomException("Effective date range is required", 400);
        }
        if (effectiveFrom.isAfter(effectiveTo)) {
            throw new CustomException("Effective from must be before or equal effective to", 400);
        }

        TimetableVersionStatus status = resolveTimetableVersionStatus(request.getStatus(), effectiveTo);

        List<TimetableVersion> versions = timetableVersionRepository
            .findBySemester_CodeIgnoreCaseAndSemester_AcademicYear_CodeIgnoreCaseOrderByVersionNoDesc(semesterCode, academicYearCode);

        if (status.isLocked()) {
            boolean overlapsLocked = versions.stream()
                .filter(version -> resolveTimetableVersionStatus(version).isLocked())
                .anyMatch(version -> isDateRangeOverlapping(effectiveFrom, effectiveTo, version.getEffectiveFrom(), version.getEffectiveTo()));

            if (overlapsLocked) {
                throw new CustomException("Khoảng thời gian hiệu lực đang trùng với một thời khóa biểu đã khóa", 409);
            }

            versions.forEach(version -> version.setIsActive(false));
            if (!versions.isEmpty()) {
                timetableVersionRepository.saveAll(versions);
            }
        }

        // Lưu NHÁP mà bản mới nhất cũng đang là nháp → cập nhật đè lên chính bản đó,
        // KHÔNG sinh version_no mới mỗi lần lưu (tránh phình version khi đang soạn).
        // Bản đã KHÓA là lịch sử bất biến → luôn tạo version mới.
        TimetableVersion latest = versions.isEmpty() ? null : versions.get(0);
        boolean reuseDraft = !status.isLocked()
            && latest != null
            && !resolveTimetableVersionStatus(latest).isLocked();

        TimetableVersion activeVersion;
        if (reuseDraft) {
            latest.setName(safe(request.getVersionName(), latest.getName()));
            latest.setStatus(status.toApiValue());
            latest.setEffectiveFrom(effectiveFrom);
            latest.setEffectiveTo(effectiveTo);
            latest.setIsActive(false);
            activeVersion = timetableVersionRepository.save(latest);
            // Xoá tiết cũ rồi flush ngay để tránh đụng unique (version_id, class, day, period_start)
            // khi chèn tiết mới trong cùng phiên bản.
            timetableRepository.deleteByVersion_Id(activeVersion.getId());
            timetableRepository.flush();
        } else {
            int nextVersionNo = versions.isEmpty() ? 1 : safeVersionNo(versions.get(0).getVersionNo()) + 1;
            activeVersion = timetableVersionRepository.save(TimetableVersion.builder()
                .semester(semester)
                .versionNo(nextVersionNo)
                .name(safe(request.getVersionName(), "Phiên bản " + nextVersionNo))
                .status(status.toApiValue())
                .effectiveFrom(effectiveFrom)
                .effectiveTo(effectiveTo)
                .isActive(status.isLocked())
                .build());
        }

        List<Timetable> entries = request.getEntries().stream()
            .map(item -> Timetable.builder()
                .version(activeVersion)
                .schoolClass(resolveClassroom(item.getClassCode(), request.getAcademicYearCode()))
                .subject(resolveSubject(item.getSubjectCode()))
                .teacher(null)
                .dayOfWeek(item.getDayOfWeek())
                .periodStart(item.getPeriodStart())
                .periodEnd(item.getPeriodEnd())
                .build())
            .toList();

        timetableRepository.saveAll(entries);

        List<String> affectedClasses = request.getEntries().stream()
            .map(TimetableGridUpsertRequest.TimetableEntry::getClassCode)
            .filter(value -> value != null && !value.trim().isEmpty())
            .map(value -> value.trim().toUpperCase(Locale.ROOT))
            .distinct()
            .toList();

        // Only a LOCKED (official) timetable notifies students/teachers. A DRAFT is a
        // work-in-progress and must not spam every class and teacher.
        if (status.isLocked()) {
            notificationAutomationService.notifyClassCodes(
                affectedClasses,
                "Thời khóa biểu mới đã được khóa",
                String.format(
                    "Thời khóa biểu %s cho %s - %s đã được cập nhật (hiệu lực từ %s đến %s).",
                    safe(request.getVersionName(), "mới"),
                    semesterCode,
                    academicYearCode,
                    effectiveFrom,
                    effectiveTo
                ),
                "SCHEDULE_CHANGE"
            );

            notificationAutomationService.notifyRole(
                "TEACHER",
                "Cập nhật thời khóa biểu",
                String.format("Đã có cập nhật thời khóa biểu %s - %s.", semesterCode, academicYearCode),
                "SCHEDULE_CHANGE"
            );
        }
    }

    @Override
    @Transactional(readOnly = true)
    public TeachingConflictCheckResponse checkConflicts(TeachingConflictCheckRequest request) {
        assertCanManageAssignments(
            request.getSubjectCode(),
            request.getAssignments().stream().map(TeachingConflictCheckRequest.AssignmentCandidate::getTeacherCode).toList()
        );

        String semesterCode = normalizeCode(request.getSemesterCode());
        String academicYearCode = normalizeCode(request.getAcademicYearCode());
        String subjectCode = normalizeCode(request.getSubjectCode());

        TimetableVersion activeVersion = resolveCurrentTimetableVersion(semesterCode, academicYearCode);
        if (activeVersion == null) {
            return TeachingConflictCheckResponse.builder()
                .missingTimetableClasses(request.getAssignments().stream()
                    .map(candidate -> normalizeCode(candidate.getClassCode()))
                    .distinct()
                    .sorted()
                    .toList())
                .conflicts(List.of())
                .build();
        }

        Map<String, List<Timetable>> activeSlotsByKey = timetableRepository.findByVersion_Id(activeVersion.getId()).stream()
            .collect(Collectors.groupingBy(item -> timetableKey(
                item.getSchoolClass() != null ? safe(item.getSchoolClass().getClassCode(), "") : "",
                item.getSubject() != null ? safe(item.getSubject().getCode(), "") : "")));

        Set<String> missingTimetableClasses = new HashSet<>();
        Map<String, List<Timetable>> candidateSlotsByClass = new HashMap<>();
        Map<String, List<String>> classesByTeacher = new HashMap<>();
        Set<String> requestedTeacherCodes = new HashSet<>();

        request.getAssignments().forEach(candidate -> {
            String classCode = normalizeCode(candidate.getClassCode());
            String teacherCode = normalizeCode(candidate.getTeacherCode());
            requestedTeacherCodes.add(teacherCode);
            classesByTeacher.computeIfAbsent(teacherCode, ignored -> new ArrayList<>()).add(classCode);

            List<Timetable> slots = activeSlotsByKey.getOrDefault(timetableKey(classCode, subjectCode), List.of());

            if (slots.isEmpty()) {
                missingTimetableClasses.add(classCode);
            } else {
                candidateSlotsByClass.put(classCode, slots);
            }
        });

        List<TeachingConflictCheckResponse.ConflictItem> conflicts = new ArrayList<>();
        Set<String> conflictKeys = new HashSet<>();

        List<TeachingAssignment> existingAssignments = teachingAssignmentRepository
            .findBySemester_CodeIgnoreCaseAndSemester_AcademicYear_CodeIgnoreCase(semesterCode, academicYearCode)
            .stream()
            .filter(item -> item.getTeacher() != null && requestedTeacherCodes.contains(normalizeCode(item.getTeacher().getTeacherCode())))
            .toList();

        Map<String, List<TeachingAssignment>> assignmentsByTeacher = existingAssignments.stream()
            .collect(Collectors.groupingBy(item -> normalizeCode(item.getTeacher().getTeacherCode())));

        for (TeachingConflictCheckRequest.AssignmentCandidate candidate : request.getAssignments()) {
            String classCode = normalizeCode(candidate.getClassCode());
            String teacherCode = normalizeCode(candidate.getTeacherCode());

            if (missingTimetableClasses.contains(classCode)) {
                continue;
            }

            List<Timetable> candidateSlots = candidateSlotsByClass.getOrDefault(classCode, List.of());

            for (TeachingAssignment existing : assignmentsByTeacher.getOrDefault(teacherCode, List.of())) {
                String existingClassCode = existing.getSchoolClass() != null ? safe(existing.getSchoolClass().getClassCode(), "") : "";
                String existingSubjectCode = existing.getSubject() != null ? safe(existing.getSubject().getCode(), "") : "";

                // Skip the candidate's OWN assignment (same class + same subject). On a
                // re-check/edit its timetable slots equal the candidate's, which would
                // otherwise register as a bogus self-conflict and wrongly block saving.
                if (existingClassCode.equalsIgnoreCase(classCode)
                        && existingSubjectCode.equalsIgnoreCase(subjectCode)) {
                    continue;
                }

                List<Timetable> existingSlots = activeSlotsByKey.getOrDefault(timetableKey(existingClassCode, existingSubjectCode), List.of());

                if (existingSlots.isEmpty()) {
                    continue;
                }

                addOverlapConflicts(conflicts, conflictKeys, teacherCode, classCode, existingClassCode, candidateSlots, existingSlots, subjectCode);
            }
        }

        for (Map.Entry<String, List<String>> entry : classesByTeacher.entrySet()) {
            List<String> classCodes = entry.getValue().stream().distinct().toList();

            for (int i = 0; i < classCodes.size(); i++) {
                String leftClass = classCodes.get(i);
                if (missingTimetableClasses.contains(leftClass)) {
                    continue;
                }

                for (int j = i + 1; j < classCodes.size(); j++) {
                    String rightClass = classCodes.get(j);
                    if (missingTimetableClasses.contains(rightClass)) {
                        continue;
                    }

                    addOverlapConflicts(
                        conflicts,
                        conflictKeys,
                        entry.getKey(),
                        leftClass,
                        rightClass,
                        candidateSlotsByClass.getOrDefault(leftClass, List.of()),
                        candidateSlotsByClass.getOrDefault(rightClass, List.of()),
                        subjectCode
                    );
                }
            }
        }

        return TeachingConflictCheckResponse.builder()
            .missingTimetableClasses(missingTimetableClasses.stream().sorted().toList())
            .conflicts(conflicts)
            .build();
    }

    private void validateDuplicate(TeachingAssignmentUpsertRequest request, UUID currentId) {
        teachingAssignmentRepository
            .findByTeacher_TeacherCodeIgnoreCaseAndSchoolClass_ClassCodeIgnoreCaseAndSubject_CodeIgnoreCaseAndSemester_CodeIgnoreCaseAndSemester_AcademicYear_CodeIgnoreCase(
                normalizeCode(request.getTeacherCode()),
                normalizeCode(request.getClassCode()),
                normalizeCode(request.getSubjectCode()),
                normalizeCode(request.getSemesterCode()),
                normalizeCode(request.getAcademicYearCode()))
            .ifPresent(existing -> {
                if (currentId == null || !existing.getId().equals(currentId)) {
                    throw new CustomException("Teaching assignment already exists", 409);
                }
            });
    }

    private void validateTimetableAndConflicts(TeachingAssignmentUpsertRequest request, UUID currentId) {
        String teacherCode = normalizeCode(request.getTeacherCode());
        String classCode = normalizeCode(request.getClassCode());
        String subjectCode = normalizeCode(request.getSubjectCode());
        String semesterCode = normalizeCode(request.getSemesterCode());
        String academicYearCode = normalizeCode(request.getAcademicYearCode());

        TimetableVersion activeVersion = resolveCurrentTimetableVersion(semesterCode, academicYearCode);
        if (activeVersion == null) {
            throw new CustomException("Chưa có thời khóa biểu cho lớp và môn này. Vui lòng tạo thời khóa biểu trước.", 409);
        }

        Map<String, List<Timetable>> activeSlotsByKey = timetableRepository.findByVersion_Id(activeVersion.getId()).stream()
            .collect(Collectors.groupingBy(item -> timetableKey(
                item.getSchoolClass() != null ? safe(item.getSchoolClass().getClassCode(), "") : "",
                item.getSubject() != null ? safe(item.getSubject().getCode(), "") : "")));

        List<Timetable> candidateSlots = activeSlotsByKey.getOrDefault(timetableKey(classCode, subjectCode), List.of());

        if (candidateSlots.isEmpty()) {
            throw new CustomException("Chưa có thời khóa biểu cho lớp và môn này. Vui lòng tạo thời khóa biểu trước.", 409);
        }

        List<TeachingAssignment> sameTeacherAssignments = teachingAssignmentRepository
            .findBySemester_CodeIgnoreCaseAndSemester_AcademicYear_CodeIgnoreCase(semesterCode, academicYearCode)
            .stream()
            .filter(item -> item.getTeacher() != null && teacherCode.equalsIgnoreCase(normalizeCode(item.getTeacher().getTeacherCode())))
            .toList();

        for (TeachingAssignment existing : sameTeacherAssignments) {
            if (currentId != null && currentId.equals(existing.getId())) {
                continue;
            }

            String existingClassCode = existing.getSchoolClass() != null
                ? safe(existing.getSchoolClass().getClassCode(), "")
                : "";
            String existingSubjectCode = existing.getSubject() != null ? safe(existing.getSubject().getCode(), "") : "";

            List<Timetable> existingSlots = activeSlotsByKey.getOrDefault(timetableKey(existingClassCode, existingSubjectCode), List.of());

            if (existingSlots.isEmpty()) {
                continue;
            }

            for (Timetable left : candidateSlots) {
                for (Timetable right : existingSlots) {
                    if (isOverlapping(left, right)) {
                        throw new CustomException(String.format(
                            "Trùng lịch: giáo viên %s đang dạy môn %s trùng Thứ %d Tiết %d-%d ở lớp %s và %s",
                            teacherCode,
                            subjectCode,
                            left.getDayOfWeek(),
                            left.getPeriodStart(),
                            left.getPeriodEnd(),
                            classCode,
                            existingClassCode
                        ), 409);
                    }
                }
            }
        }
    }

    private void addOverlapConflicts(
        List<TeachingConflictCheckResponse.ConflictItem> conflicts,
        Set<String> conflictKeys,
        String teacherCode,
        String classCode,
        String otherClassCode,
        List<Timetable> leftSlots,
        List<Timetable> rightSlots,
        String subjectCode) {
        for (Timetable left : leftSlots) {
            for (Timetable right : rightSlots) {
                if (!isOverlapping(left, right)) {
                    continue;
                }

                List<String> affectedClasses = List.of(classCode, otherClassCode).stream()
                    .filter(value -> value != null && !value.isBlank())
                    .distinct()
                    .sorted()
                    .toList();

                String conflictKey = teacherCode + "|" + left.getDayOfWeek() + "|" + left.getPeriodStart() + "|" + left.getPeriodEnd() + "|" + String.join("|", affectedClasses);
                if (!conflictKeys.add(conflictKey)) {
                    continue;
                }

                String teacherName = teacherRepository.findByTeacherCodeAndDeletedAtIsNull(teacherCode)
                    .map(item -> item.getUser() != null ? safe(item.getUser().getFullName(), teacherCode) : teacherCode)
                    .orElse(teacherCode);

                conflicts.add(TeachingConflictCheckResponse.ConflictItem.builder()
                    .teacherCode(teacherCode)
                    .teacherName(teacherName)
                    .subjectCode(subjectCode)
                    .dayOfWeek(left.getDayOfWeek())
                    .periodStart(left.getPeriodStart())
                    .periodEnd(left.getPeriodEnd())
                    .affectedClasses(affectedClasses)
                    .build());
            }
        }
    }

    private TimetableVersion resolveCurrentTimetableVersion(String semesterCode, String academicYearCode) {
        List<TimetableVersion> versions = timetableVersionRepository
            .findBySemester_CodeIgnoreCaseAndSemester_AcademicYear_CodeIgnoreCaseOrderByVersionNoDesc(semesterCode, academicYearCode);

        return versions.stream()
            .filter(version -> Boolean.TRUE.equals(version.getIsActive()))
            .filter(version -> resolveTimetableVersionStatus(version).isLocked())
            .findFirst()
            .or(() -> versions.stream()
                .filter(version -> resolveTimetableVersionStatus(version).isLocked())
                .findFirst())
            .orElse(null);
    }

    private TimetableVersion resolveTimetableVersionById(String versionId, String semesterCode, String academicYearCode) {
        UUID parsedVersionId;
        try {
            parsedVersionId = UUID.fromString(versionId);
        } catch (IllegalArgumentException exception) {
            throw new CustomException("Invalid timetable version id", 400);
        }

        TimetableVersion version = timetableVersionRepository.findById(parsedVersionId)
            .orElseThrow(() -> new CustomException("Timetable version not found", 404));

        String versionSemesterCode = version.getSemester() != null ? safe(version.getSemester().getCode(), "") : "";
        String versionAcademicYearCode = version.getSemester() != null && version.getSemester().getAcademicYear() != null
            ? safe(version.getSemester().getAcademicYear().getCode(), "")
            : "";

        if (!semesterCode.equalsIgnoreCase(normalizeCode(versionSemesterCode))
            || !academicYearCode.equalsIgnoreCase(normalizeCode(versionAcademicYearCode))) {
            throw new CustomException("Timetable version does not belong to requested semester/year", 400);
        }

        return version;
    }

    private TimetableVersionStatus resolveTimetableVersionStatus(TimetableVersion version) {
        try {
            return TimetableVersionStatus.resolve(version.getStatus(), version.getEffectiveTo());
        } catch (IllegalArgumentException exception) {
            throw new CustomException(exception.getMessage(), 400);
        }
    }

    private TimetableVersionStatus resolveTimetableVersionStatus(String status, LocalDate effectiveTo) {
        try {
            return TimetableVersionStatus.resolve(status, effectiveTo);
        } catch (IllegalArgumentException exception) {
            throw new CustomException(exception.getMessage(), 400);
        }
    }

    private boolean isDateRangeOverlapping(LocalDate leftFrom, LocalDate leftTo, LocalDate rightFrom, LocalDate rightTo) {
        if (leftFrom == null || leftTo == null || rightFrom == null || rightTo == null) {
            return false;
        }

        return !leftTo.isBefore(rightFrom) && !rightTo.isBefore(leftFrom);
    }

    private String timetableKey(String classCode, String subjectCode) {
        return normalizeCode(classCode) + "::" + normalizeCode(subjectCode);
    }

    private int safeVersionNo(Integer versionNo) {
        return versionNo == null || versionNo < 1 ? 0 : versionNo;
    }

    private boolean isOverlapping(Timetable left, Timetable right) {
        if (left.getDayOfWeek() == null || right.getDayOfWeek() == null) {
            return false;
        }
        if (!left.getDayOfWeek().equals(right.getDayOfWeek())) {
            return false;
        }

        int leftStart = safePeriod(left.getPeriodStart(), 0);
        int leftEnd = safePeriod(left.getPeriodEnd(), leftStart);
        int rightStart = safePeriod(right.getPeriodStart(), 0);
        int rightEnd = safePeriod(right.getPeriodEnd(), rightStart);

        return leftStart <= rightEnd && rightStart <= leftEnd;
    }

    private int safePeriod(Short value, int fallback) {
        if (value == null) {
            return fallback;
        }
        return value.intValue();
    }

    private TeachingAssignment getTeachingEntity(String assignmentId) {
        UUID id;
        try {
            id = UUID.fromString(assignmentId);
        } catch (IllegalArgumentException exception) {
            throw new CustomException("Invalid assignment id", 400);
        }

        return teachingAssignmentRepository.findById(id)
            .orElseThrow(() -> new CustomException("Teaching assignment not found", 404));
    }

    private Teacher resolveTeacher(String teacherCode) {
        return teacherRepository.findByTeacherCodeAndDeletedAtIsNull(normalizeCode(teacherCode))
            .orElseThrow(() -> new CustomException("Teacher not found", 404));
    }

    private SchoolClass resolveClassroom(String classCode, String academicYearCode) {
        return schoolClassRepository
            .findByClassCodeAndAcademicYear_CodeAndDeletedAtIsNull(normalizeCode(classCode), normalizeCode(academicYearCode))
            .orElseThrow(() -> new CustomException("Class not found in academic year", 404));
    }

    private Subject resolveSubject(String subjectCode) {
        return subjectRepository.findByCodeAndDeletedAtIsNull(normalizeCode(subjectCode))
            .orElseThrow(() -> new CustomException("Subject not found", 404));
    }

    private Semester resolveSemester(String semesterCode, String academicYearCode) {
        return semesterRepository.findByCodeAndAcademicYear_Code(normalizeCode(semesterCode), normalizeCode(academicYearCode))
            .orElseThrow(() -> new CustomException("Semester not found", 404));
    }

    private String normalizeCode(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new CustomException("Required code is missing", 400);
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private String serializeScheduleData(List<TeachingAssignmentUpsertRequest.TeachingScheduleDetail> scheduleList) {
        if (scheduleList == null || scheduleList.isEmpty()) {
            return null;
        }

        try {
            return objectMapper.writeValueAsString(scheduleList);
        } catch (JsonProcessingException e) {
            throw new CustomException("Failed to serialize schedule data", 400);
        }
    }

    private List<TeachingAssignmentResponse.TeachingScheduleDetail> deserializeScheduleData(String scheduleJson) {
        if (scheduleJson == null || scheduleJson.trim().isEmpty()) {
            return null;
        }

        try {
            return objectMapper.readValue(scheduleJson, 
                objectMapper.getTypeFactory().constructCollectionType(
                    List.class, 
                    TeachingAssignmentResponse.TeachingScheduleDetail.class
                )
            );
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private TeachingAssignmentResponse toResponse(TeachingAssignment assignment) {
        String teacherName = assignment.getTeacher() != null && assignment.getTeacher().getUser() != null
            ? safe(assignment.getTeacher().getUser().getFullName(), "Chưa cập nhật")
            : "Chưa cập nhật";

        return TeachingAssignmentResponse.builder()
            .assignmentId(assignment.getId() != null ? assignment.getId().toString() : "")
            .teacherCode(assignment.getTeacher() != null ? safe(assignment.getTeacher().getTeacherCode(), "") : "")
            .teacherName(teacherName)
            .classCode(assignment.getSchoolClass() != null ? safe(assignment.getSchoolClass().getClassCode(), "") : "")
            .className(assignment.getSchoolClass() != null ? safe(assignment.getSchoolClass().getClassName(), "Chưa cập nhật") : "Chưa cập nhật")
            .subjectCode(assignment.getSubject() != null ? safe(assignment.getSubject().getCode(), "") : "")
            .subjectName(assignment.getSubject() != null ? safe(assignment.getSubject().getName(), "Chưa cập nhật") : "Chưa cập nhật")
            .semesterCode(assignment.getSemester() != null ? safe(assignment.getSemester().getCode(), "") : "")
            .academicYearCode(assignment.getSemester() != null && assignment.getSemester().getAcademicYear() != null
                ? safe(assignment.getSemester().getAcademicYear().getCode(), "")
                : "")
            .homeroom(Boolean.TRUE.equals(assignment.getIsHomeroom()))
            .note(assignment.getNote())
            .scheduleData(deserializeScheduleData(assignment.getScheduleData()))
            .build();
    }

    private String normalizeNote(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return null;
        }

        if (trimmed.length() <= 500) {
            return trimmed;
        }

        return trimmed.substring(0, 500);
    }

    private String safe(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeachingAssignmentResponse> getTeachingAssignmentsByCurrentUser(String academicYearId) {
        Teacher currentTeacher = getCurrentTeacher();
        
        if (academicYearId != null && !academicYearId.isBlank()) {
            try {
                UUID yearId = UUID.fromString(academicYearId);
                return teachingAssignmentRepository
                    .findByTeacherAndSemester_AcademicYear_IdOrderBySemester_AcademicYear_CodeDescSemester_CodeAsc(currentTeacher, yearId)
                    .stream()
                    .map(this::toResponse)
                    .toList();
            } catch (IllegalArgumentException e) {
                throw new CustomException("Invalid academic year ID format", 400);
            }
        }
        
        return getVisibleAssignments().stream()
            .map(this::toResponse)
            .toList();
    }

    private List<TeachingAssignment> getVisibleAssignments() {
        if (isCurrentUserAdmin()) {
            return teachingAssignmentRepository.findAllByOrderBySemester_AcademicYear_CodeDescSemester_CodeAsc();
        }

        Teacher teacher = getCurrentTeacher();

        // Department head/vice head can view assignments scoped to their own department.
        Integer departmentLevel = teacher.getDepartmentLevel();
        boolean isDepartmentLeader = departmentLevel != null && (departmentLevel == 1 || departmentLevel == 2);
        if (isDepartmentLeader && teacher.getDepartment() != null && teacher.getDepartment().getCode() != null) {
            String normalizedDepartment = normalizeCode(teacher.getDepartment().getCode());
            return teachingAssignmentRepository
                .findByTeacher_Department_CodeIgnoreCase(teacher.getDepartment().getCode())
                .stream()
                .filter(assignment -> isAssignmentInDepartmentSubjectScope(assignment, normalizedDepartment))
                .filter(assignment -> isAssignmentInDepartmentTeacherScope(assignment, normalizedDepartment))
                .toList();
        }

        return teachingAssignmentRepository.findByTeacherOrderBySemester_AcademicYear_CodeDescSemester_CodeAsc(teacher);
    }

    private void assertCanAccessAssignment(TeachingAssignment assignment) {
        if (isCurrentUserAdmin()) {
            return;
        }

        Teacher currentTeacher = getCurrentTeacher();
        if (isDepartmentLeader(currentTeacher)) {
            String actorDepartment = normalizeDepartmentCode(currentTeacher);
            if (isAssignmentInDepartmentSubjectScope(assignment, actorDepartment)
                && isAssignmentInDepartmentTeacherScope(assignment, actorDepartment)) {
                return;
            }
        }

        if (assignment.getTeacher() == null || assignment.getTeacher().getId() == null
                || !assignment.getTeacher().getId().equals(currentTeacher.getId())) {
            throw new CustomException("Forbidden", 403);
        }
    }

    private boolean isCurrentUserAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new CustomException("Unauthenticated", 401);
        }

        return authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .anyMatch("ROLE_ADMIN"::equals);
    }

    private void assertCanViewDepartmentAssignments(String departmentCode) {
        if (isCurrentUserAdmin()) {
            return;
        }

        Teacher currentTeacher = getCurrentTeacher();
        if (!isDepartmentLeader(currentTeacher)) {
            throw new CustomException("Forbidden", 403);
        }

        String actorDepartment = normalizeDepartmentCode(currentTeacher);
        String requestedDepartment = normalizeCode(departmentCode);
        if (!actorDepartment.equalsIgnoreCase(requestedDepartment)) {
            throw new CustomException("Bạn chỉ được xem phân công trong bộ môn của mình", 403);
        }
    }

    private void assertCanAccessSubjectScope(String subjectCode) {
        if (isCurrentUserAdmin()) {
            return;
        }

        Teacher currentTeacher = getCurrentTeacher();
        if (!isDepartmentLeader(currentTeacher)) {
            throw new CustomException("Forbidden", 403);
        }

        String actorDepartment = normalizeDepartmentCode(currentTeacher);
        Subject subject = resolveSubject(subjectCode);
        String subjectDepartment = subject.getDepartment() != null ? safe(subject.getDepartment().getCode(), "") : "";
        if (subjectDepartment.isBlank() || !actorDepartment.equalsIgnoreCase(subjectDepartment)) {
            throw new CustomException("Bạn chỉ được thao tác với môn thuộc bộ môn của mình", 403);
        }
    }

    private void assertCanManageAssignments(String subjectCode, List<String> teacherCodes) {
        if (isCurrentUserAdmin()) {
            return;
        }

        Teacher currentTeacher = getCurrentTeacher();
        if (!isDepartmentLeader(currentTeacher)) {
            throw new CustomException("Chỉ trưởng/phó bộ môn mới được phân công giáo viên", 403);
        }

        String actorDepartment = normalizeDepartmentCode(currentTeacher);
        Subject subject = resolveSubject(subjectCode);
        String subjectDepartment = subject.getDepartment() != null ? safe(subject.getDepartment().getCode(), "") : "";

        if (subjectDepartment.isBlank() || !actorDepartment.equalsIgnoreCase(subjectDepartment)) {
            throw new CustomException("Bạn chỉ được thao tác với môn thuộc bộ môn của mình", 403);
        }

        for (String teacherCode : teacherCodes.stream().map(this::normalizeCode).collect(Collectors.toSet())) {
            Teacher teacher = resolveTeacher(teacherCode);
            String teacherDepartment = teacher.getDepartment() != null ? safe(teacher.getDepartment().getCode(), "") : "";
            if (teacherDepartment.isBlank() || !actorDepartment.equalsIgnoreCase(teacherDepartment)) {
                throw new CustomException("Bạn chỉ được phân công giáo viên thuộc bộ môn của mình", 403);
            }
        }
    }

    private boolean isDepartmentLeader(Teacher teacher) {
        Integer level = teacher.getDepartmentLevel();
        return level != null && (level == 1 || level == 2);
    }

    private String normalizeDepartmentCode(Teacher teacher) {
        String code = teacher.getDepartment() != null ? safe(teacher.getDepartment().getCode(), "") : "";
        if (code.isBlank()) {
            throw new CustomException("Teacher department not found", 403);
        }
        return code.toUpperCase(Locale.ROOT);
    }

    private List<TeachingAssignment> applyDepartmentScopeForSubjectAssignments(List<TeachingAssignment> assignments) {
        if (isCurrentUserAdmin()) {
            return assignments;
        }

        Teacher currentTeacher = getCurrentTeacher();
        if (!isDepartmentLeader(currentTeacher)) {
            return assignments;
        }

        String actorDepartment = normalizeDepartmentCode(currentTeacher);
        return assignments.stream()
            .filter(assignment -> isAssignmentInDepartmentSubjectScope(assignment, actorDepartment))
            .filter(assignment -> isAssignmentInDepartmentTeacherScope(assignment, actorDepartment))
            .toList();
    }

    private boolean isAssignmentInDepartmentSubjectScope(TeachingAssignment assignment, String departmentCode) {
        if (assignment == null || assignment.getSubject() == null || assignment.getSubject().getDepartment() == null) {
            return false;
        }

        String subjectDepartment = safe(assignment.getSubject().getDepartment().getCode(), "");
        return !subjectDepartment.isBlank() && subjectDepartment.equalsIgnoreCase(departmentCode);
    }

    private boolean isAssignmentInDepartmentTeacherScope(TeachingAssignment assignment, String departmentCode) {
        if (assignment == null || assignment.getTeacher() == null || assignment.getTeacher().getDepartment() == null) {
            return false;
        }

        String teacherDepartment = safe(assignment.getTeacher().getDepartment().getCode(), "");
        return !teacherDepartment.isBlank() && teacherDepartment.equalsIgnoreCase(departmentCode);
    }

    private Teacher getCurrentTeacher() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new CustomException("Unauthenticated", 401);
        }

        User user = userRepository.findByEmail(authentication.getName().trim().toLowerCase(Locale.ROOT))
            .orElseThrow(() -> new CustomException("Current user not found", 404));

        return teacherRepository.findByUserAndDeletedAtIsNull(user)
            .orElseThrow(() -> new CustomException("Teacher profile not found", 403));
    }
}

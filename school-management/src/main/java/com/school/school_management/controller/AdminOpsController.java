package com.school.school_management.controller;

import com.school.school_management.dto.ApiResponse;
import com.school.school_management.repository.AcademicRankRuleRepository;
import com.school.school_management.repository.AuditLogRepository;
import com.school.school_management.repository.ConductRepository;
import com.school.school_management.repository.DepartmentRepository;
import com.school.school_management.repository.ExamPermissionRepository;
import com.school.school_management.repository.ImportLogRepository;
import com.school.school_management.repository.ParentRepository;
import com.school.school_management.repository.RoleRepository;
import com.school.school_management.repository.RoomRepository;
import com.school.school_management.repository.SemesterRepository;
import com.school.school_management.repository.UserRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOpsController {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final SemesterRepository semesterRepository;
    private final RoomRepository roomRepository;
    private final ConductRepository conductRepository;
    private final AcademicRankRuleRepository academicRankRuleRepository;
    private final ExamPermissionRepository examPermissionRepository;
    private final ParentRepository parentRepository;
    private final AuditLogRepository auditLogRepository;
    private final ImportLogRepository importLogRepository;

    public AdminOpsController(
        RoleRepository roleRepository,
        UserRepository userRepository,
        DepartmentRepository departmentRepository,
        SemesterRepository semesterRepository,
        RoomRepository roomRepository,
        ConductRepository conductRepository,
        AcademicRankRuleRepository academicRankRuleRepository,
        ExamPermissionRepository examPermissionRepository,
        ParentRepository parentRepository,
        AuditLogRepository auditLogRepository,
        ImportLogRepository importLogRepository
    ) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.semesterRepository = semesterRepository;
        this.roomRepository = roomRepository;
        this.conductRepository = conductRepository;
        this.academicRankRuleRepository = academicRankRuleRepository;
        this.examPermissionRepository = examPermissionRepository;
        this.parentRepository = parentRepository;
        this.auditLogRepository = auditLogRepository;
        this.importLogRepository = importLogRepository;
    }

    @GetMapping("/roles")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRoles() {
        List<Map<String, Object>> rows = roleRepository.findAll(Sort.by(Sort.Direction.ASC, "code")).stream()
            .filter(role -> role.getDeletedAt() == null)
            .map(role -> Map.<String, Object>of(
                "id", role.getId() != null ? role.getId().toString() : "",
                "code", role.getCode(),
                "name", role.getName(),
                "description", role.getDescription() != null ? role.getDescription() : ""
            ))
            .toList();

        return ResponseEntity.ok(ApiResponse.of(rows, "Roles fetched successfully", 200));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getUsers(
        @RequestParam(required = false) String roleCode,
        @RequestParam(required = false, defaultValue = "100") Integer limit
    ) {
        int safeLimit = Math.max(1, Math.min(limit == null ? 100 : limit, 500));

        List<Map<String, Object>> rows = (roleCode == null || roleCode.isBlank()
                ? userRepository.findAllActiveUsers()
                : userRepository.findAllActiveByRoleCode(roleCode.trim()))
            .stream()
            .sorted(Comparator.comparing(user -> user.getEmail() == null ? "" : user.getEmail()))
            .limit(safeLimit)
            .map(user -> Map.<String, Object>of(
                "id", user.getId() != null ? user.getId().toString() : "",
                "email", user.getEmail() != null ? user.getEmail() : "",
                "username", user.getUsername() != null ? user.getUsername() : "",
                "fullName", user.getFullName() != null ? user.getFullName() : "",
                "status", user.getStatus() != null ? user.getStatus() : "",
                "roles", user.getUserRoles().stream()
                    .map(item -> item.getRole() != null ? item.getRole().getCode() : null)
                    .filter(code -> code != null && !code.isBlank())
                    .sorted()
                    .toList()
            ))
            .toList();

        return ResponseEntity.ok(ApiResponse.of(rows, "Users fetched successfully", 200));
    }

    @GetMapping("/departments")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDepartments() {
        List<Map<String, Object>> rows = departmentRepository.findAllByOrderByNameAsc().stream()
            .map(item -> Map.<String, Object>of(
                "id", item.getId() != null ? item.getId().toString() : "",
                "code", item.getCode() != null ? item.getCode() : "",
                "name", item.getName() != null ? item.getName() : ""
            ))
            .toList();

        return ResponseEntity.ok(ApiResponse.of(rows, "Departments fetched successfully", 200));
    }

    @GetMapping("/semesters")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSemesters(
        @RequestParam(required = false) String academicYearCode
    ) {
        List<Map<String, Object>> rows = (academicYearCode == null || academicYearCode.isBlank()
                ? semesterRepository.findAllByOrderByStartDateDesc()
                : semesterRepository.findByAcademicYear_CodeOrderByStartDateDesc(academicYearCode.trim()))
            .stream()
            .map(item -> Map.<String, Object>of(
                "id", item.getId() != null ? item.getId().toString() : "",
                "code", item.getCode() != null ? item.getCode() : "",
                "academicYearCode", item.getAcademicYear() != null && item.getAcademicYear().getCode() != null
                    ? item.getAcademicYear().getCode()
                    : "",
                "startDate", item.getStartDate() != null ? item.getStartDate().toString() : "",
                "endDate", item.getEndDate() != null ? item.getEndDate().toString() : "",
                "status", item.getStatus() != null ? item.getStatus() : "",
                "locked", item.getIsLocked() != null ? item.getIsLocked() : Boolean.FALSE
            ))
            .toList();

        return ResponseEntity.ok(ApiResponse.of(rows, "Semesters fetched successfully", 200));
    }

    @GetMapping("/rooms")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRooms() {
        List<Map<String, Object>> rows = roomRepository.findAllByOrderByNameAsc().stream()
            .map(item -> Map.<String, Object>of(
                "id", item.getId() != null ? item.getId().toString() : "",
                "name", item.getName() != null ? item.getName() : "",
                "capacity", item.getCapacity() != null ? item.getCapacity() : 0
            ))
            .toList();

        return ResponseEntity.ok(ApiResponse.of(rows, "Rooms fetched successfully", 200));
    }

    @GetMapping("/conduct")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getConducts(
        @RequestParam(required = false, defaultValue = "300") Integer limit
    ) {
        int safeLimit = Math.max(1, Math.min(limit == null ? 300 : limit, 1500));

        List<Map<String, Object>> rows = conductRepository.findAllByOrderByIdDesc().stream()
            .limit(safeLimit)
            .map(item -> Map.<String, Object>of(
                "id", item.getId() != null ? item.getId().toString() : "",
                "studentCode", item.getStudent() != null && item.getStudent().getStudentCode() != null
                    ? item.getStudent().getStudentCode()
                    : "",
                "semesterCode", item.getSemester() != null && item.getSemester().getCode() != null
                    ? item.getSemester().getCode()
                    : "",
                "className", item.getSchoolClass() != null && item.getSchoolClass().getClassName() != null
                    ? item.getSchoolClass().getClassName()
                    : "",
                "conductLevel", item.getConductLevel() != null ? item.getConductLevel() : "",
                "remarks", item.getRemarks() != null ? item.getRemarks() : "",
                "assessedBy", item.getAssessedBy() != null
                    && item.getAssessedBy().getUser() != null
                    && item.getAssessedBy().getUser().getEmail() != null
                    ? item.getAssessedBy().getUser().getEmail()
                    : ""
            ))
            .toList();

        return ResponseEntity.ok(ApiResponse.of(rows, "Conduct records fetched successfully", 200));
    }

    @GetMapping("/academic-rank-rules")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAcademicRankRules() {
        List<Map<String, Object>> rows = academicRankRuleRepository.findAllByOrderByCodeAsc().stream()
            .map(item -> Map.<String, Object>of(
                "id", item.getId() != null ? item.getId().toString() : "",
                "code", item.getCode() != null ? item.getCode() : "",
                "name", item.getName() != null ? item.getName() : "",
                "minAverage", item.getMinAverage() != null ? item.getMinAverage() : 0,
                "maxFailedSubjects", item.getMaxFailedSubjects() != null ? item.getMaxFailedSubjects() : 0,
                "minConductLevel", item.getMinConductLevel() != null ? item.getMinConductLevel() : "",
                "appliesToGrade", item.getAppliesToGrade() != null ? item.getAppliesToGrade() : 0
            ))
            .toList();

        return ResponseEntity.ok(ApiResponse.of(rows, "Academic rank rules fetched successfully", 200));
    }

    @GetMapping("/exam-permissions")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getExamPermissions(
        @RequestParam(required = false, defaultValue = "300") Integer limit
    ) {
        int safeLimit = Math.max(1, Math.min(limit == null ? 300 : limit, 1500));

        List<Map<String, Object>> rows = examPermissionRepository.findAllByOrderByIdDesc().stream()
            .limit(safeLimit)
            .map(item -> Map.<String, Object>of(
                "id", item.getId() != null ? item.getId().toString() : "",
                "examId", item.getExam() != null && item.getExam().getId() != null ? item.getExam().getId().toString() : "",
                "studentCode", item.getStudent() != null && item.getStudent().getStudentCode() != null
                    ? item.getStudent().getStudentCode()
                    : "",
                "isAllowed", item.getIsAllowed() != null ? item.getIsAllowed() : Boolean.FALSE,
                "reason", item.getReason() != null ? item.getReason() : "",
                "approvedBy", item.getApprovedBy() != null && item.getApprovedBy().getEmail() != null
                    ? item.getApprovedBy().getEmail()
                    : ""
            ))
            .toList();

        return ResponseEntity.ok(ApiResponse.of(rows, "Exam permissions fetched successfully", 200));
    }

    @GetMapping("/parents")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getParents(
        @RequestParam(required = false, defaultValue = "200") Integer limit
    ) {
        int safeLimit = Math.max(1, Math.min(limit == null ? 200 : limit, 1000));

        List<Map<String, Object>> rows = parentRepository.findAll().stream()
            .limit(safeLimit)
            .map(item -> Map.<String, Object>of(
                "id", item.getId() != null ? item.getId().toString() : "",
                "parentCode", item.getParentCode() != null ? item.getParentCode() : "",
                "fullName", item.getFullName() != null ? item.getFullName() : "",
                "phone", item.getPhone() != null ? item.getPhone() : "",
                "userId", item.getUser() != null && item.getUser().getId() != null ? item.getUser().getId().toString() : ""
            ))
            .toList();

        return ResponseEntity.ok(ApiResponse.of(rows, "Parents fetched successfully", 200));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAuditLogs(
        @RequestParam(required = false, defaultValue = "200") Integer limit
    ) {
        int safeLimit = Math.max(1, Math.min(limit == null ? 200 : limit, 1000));

        List<Map<String, Object>> rows = auditLogRepository.findAllByOrderByCreatedAtDesc().stream()
            .limit(safeLimit)
            .map(item -> Map.<String, Object>of(
                "id", item.getId() != null ? item.getId().toString() : "",
                "action", item.getAction() != null ? item.getAction() : "",
                "entityName", item.getEntityName() != null ? item.getEntityName() : "",
                "entityId", item.getEntityId() != null ? item.getEntityId().toString() : "",
                "actor", item.getActorUser() != null && item.getActorUser().getEmail() != null ? item.getActorUser().getEmail() : "",
                "createdAt", item.getCreatedAt() != null ? item.getCreatedAt().toString() : "",
                "ipAddress", item.getIpAddress() != null ? item.getIpAddress() : ""
            ))
            .toList();

        return ResponseEntity.ok(ApiResponse.of(rows, "Audit logs fetched successfully", 200));
    }

    @GetMapping("/import-logs")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getImportLogs(
        @RequestParam(required = false, defaultValue = "200") Integer limit
    ) {
        int safeLimit = Math.max(1, Math.min(limit == null ? 200 : limit, 1000));

        List<Map<String, Object>> rows = importLogRepository.findAllByOrderByImportedAtDesc().stream()
            .limit(safeLimit)
            .map(item -> Map.<String, Object>of(
                "id", item.getId() != null ? item.getId().toString() : "",
                "importType", item.getImportType() != null ? item.getImportType() : "",
                "fileName", item.getFileName() != null ? item.getFileName() : "",
                "totalRows", item.getTotalRows() != null ? item.getTotalRows() : 0,
                "successRows", item.getSuccessRows() != null ? item.getSuccessRows() : 0,
                "failedRows", item.getFailedRows() != null ? item.getFailedRows() : 0,
                "importedBy", item.getImportedBy() != null && item.getImportedBy().getEmail() != null ? item.getImportedBy().getEmail() : "",
                "importedAt", item.getImportedAt() != null ? item.getImportedAt().toString() : ""
            ))
            .toList();

        return ResponseEntity.ok(ApiResponse.of(rows, "Import logs fetched successfully", 200));
    }
}

package com.school.school_management.controller;

import com.school.school_management.dto.ApiResponse;
import com.school.school_management.dto.conduct.ConductResponse;
import com.school.school_management.dto.exam.ExamResponse;
import com.school.school_management.dto.parent.ParentProfileResponse;
import com.school.school_management.dto.student.StudentResponse;
import com.school.school_management.dto.student.StudentTranscriptResponse;
import com.school.school_management.entity.Conduct;
import com.school.school_management.entity.Exam;
import com.school.school_management.entity.ExamClass;
import com.school.school_management.entity.Parent;
import com.school.school_management.entity.ParentStudent;
import com.school.school_management.entity.Student;
import com.school.school_management.entity.StudentClass;
import com.school.school_management.entity.User;
import com.school.school_management.exception.CustomException;
import com.school.school_management.repository.ConductRepository;
import com.school.school_management.repository.ExamClassRepository;
import com.school.school_management.repository.ExamRepository;
import com.school.school_management.repository.ParentRepository;
import com.school.school_management.repository.StudentClassRepository;
import com.school.school_management.repository.StudentRepository;
import com.school.school_management.repository.UserRepository;
import com.school.school_management.service.student.StudentService;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/parents")
public class ParentController {

    private final UserRepository userRepository;
    private final ParentRepository parentRepository;
    private final StudentRepository studentRepository;
    private final StudentClassRepository studentClassRepository;
    private final ConductRepository conductRepository;
    private final ExamRepository examRepository;
    private final ExamClassRepository examClassRepository;
    private final StudentService studentService;

    public ParentController(
            UserRepository userRepository,
            ParentRepository parentRepository,
            StudentRepository studentRepository,
            StudentClassRepository studentClassRepository,
            ConductRepository conductRepository,
            ExamRepository examRepository,
            ExamClassRepository examClassRepository,
            StudentService studentService) {
        this.userRepository = userRepository;
        this.parentRepository = parentRepository;
        this.studentRepository = studentRepository;
        this.studentClassRepository = studentClassRepository;
        this.conductRepository = conductRepository;
        this.examRepository = examRepository;
        this.examClassRepository = examClassRepository;
        this.studentService = studentService;
    }

    // ── Profile ───────────────────────────────────────────────────────────────

    @GetMapping("/me/profile")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<ApiResponse<ParentProfileResponse>> getMyProfile() {
        User currentUser = getCurrentUser();
        Parent parent = resolveParent(currentUser);

        List<ParentProfileResponse.LinkedChild> children = parent.getParentStudents().stream()
            .filter(link -> link.getStudent() != null && link.getStudent().getDeletedAt() == null)
            .map(link -> {
                Student student = link.getStudent();
                StudentClass currentClass = studentClassRepository
                    .findFirstByStudentAndEndDateIsNullOrderByStartDateDesc(student)
                    .orElse(null);

                String fullName = resolveFullName(student);
                return ParentProfileResponse.LinkedChild.builder()
                    .studentCode(student.getStudentCode())
                    .fullName(fullName)
                    .className(currentClass != null && currentClass.getSchoolClass() != null
                        ? currentClass.getSchoolClass().getClassName() : null)
                    .academicYear(currentClass != null && currentClass.getAcademicYear() != null
                        ? currentClass.getAcademicYear().getCode() : null)
                    .status(student.getStatus())
                    .avatarLabel(buildAvatarLabel(fullName))
                    .isPrimaryContact(Boolean.TRUE.equals(link.getIsPrimaryContact()))
                    .canViewScore(Boolean.TRUE.equals(link.getCanViewScore()))
                    .build();
            })
            .sorted(Comparator.comparing(ParentProfileResponse.LinkedChild::getStudentCode))
            .toList();

        ParentProfileResponse response = ParentProfileResponse.builder()
            .parentCode(parent.getParentCode())
            .fullName(parent.getFullName())
            .phone(parent.getPhone())
            .email(currentUser.getEmail())
            .children(children)
            .build();

        return ResponseEntity.ok(ApiResponse.success(response, "Parent profile retrieved"));
    }

    // ── Child endpoints ───────────────────────────────────────────────────────

    @GetMapping("/me/children/{studentCode}/profile")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<ApiResponse<StudentResponse>> getChildProfile(
            @PathVariable String studentCode) {
        assertLinked(studentCode);
        return ResponseEntity.ok(ApiResponse.success(
            studentService.getStudentByCode(studentCode), "Child profile retrieved"));
    }

    @GetMapping("/me/children/{studentCode}/scores")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<ApiResponse<List<StudentResponse.SubjectResultItem>>> getChildScores(
            @PathVariable String studentCode) {
        assertLinkedAndCanViewScore(studentCode);
        return ResponseEntity.ok(ApiResponse.success(
            studentService.getStudentScores(studentCode), "Child scores retrieved"));
    }

    @GetMapping("/me/children/{studentCode}/transcript")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<ApiResponse<StudentTranscriptResponse>> getChildTranscript(
            @PathVariable String studentCode) {
        assertLinked(studentCode);
        return ResponseEntity.ok(ApiResponse.success(
            studentService.getStudentTranscript(studentCode), "Child transcript retrieved"));
    }

    @GetMapping("/me/children/{studentCode}/conduct")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<ApiResponse<List<ConductResponse>>> getChildConduct(
            @PathVariable String studentCode) {
        assertLinked(studentCode);
        Student student = resolveStudent(studentCode);

        List<ConductResponse> result = conductRepository.findByStudentOrderByIdDesc(student)
            .stream()
            .map(this::toConductResponse)
            .toList();

        return ResponseEntity.ok(ApiResponse.success(result, "Child conduct retrieved"));
    }

    @GetMapping("/me/children/{studentCode}/exams")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<ApiResponse<List<ExamResponse>>> getChildExams(
            @PathVariable String studentCode,
            @RequestParam(required = false) String semesterCode) {
        assertLinked(studentCode);
        Student student = resolveStudent(studentCode);

        // Get student's current class code
        StudentClass currentClass = studentClassRepository
            .findFirstByStudentAndEndDateIsNullOrderByStartDateDesc(student)
            .orElse(null);

        if (currentClass == null || currentClass.getSchoolClass() == null) {
            return ResponseEntity.ok(ApiResponse.success(List.of(), "No class found"));
        }

        String classCode = currentClass.getSchoolClass().getClassCode();

        // Find exams for this class
        List<ExamResponse> exams = examClassRepository
            .findBySchoolClass_ClassCode(classCode)
            .stream()
            .map(ExamClass::getExam)
            .filter(exam -> exam != null && exam.getDeletedAt() == null)
            .filter(exam -> semesterCode == null || semesterCode.isBlank()
                || (exam.getSemester() != null
                    && semesterCode.equalsIgnoreCase(exam.getSemester().getCode())))
            .map(this::toExamResponse)
            .sorted(Comparator.comparing(ExamResponse::getExamDate,
                Comparator.nullsLast(Comparator.naturalOrder())))
            .toList();

        return ResponseEntity.ok(ApiResponse.success(exams, "Child exams retrieved"));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new CustomException("User not found", 404));
    }

    private Parent resolveParent(User user) {
        return parentRepository.findByUser(user)
            .orElseThrow(() -> new CustomException("Parent profile not found", 404));
    }

    private Student resolveStudent(String studentCode) {
        return studentRepository.findByStudentCodeAndDeletedAtIsNull(
                studentCode.trim().toUpperCase(Locale.ROOT))
            .orElseThrow(() -> new CustomException("Student not found", 404));
    }

    private void assertLinked(String studentCode) {
        User currentUser = getCurrentUser();
        Parent parent = resolveParent(currentUser);
        boolean linked = parent.getParentStudents().stream()
            .anyMatch(link -> link.getStudent() != null
                && studentCode.equalsIgnoreCase(link.getStudent().getStudentCode()));
        if (!linked) throw new CustomException("Forbidden: student not linked to this parent", 403);
    }

    private void assertLinkedAndCanViewScore(String studentCode) {
        User currentUser = getCurrentUser();
        Parent parent = resolveParent(currentUser);
        ParentStudent link = parent.getParentStudents().stream()
            .filter(l -> l.getStudent() != null
                && studentCode.equalsIgnoreCase(l.getStudent().getStudentCode()))
            .findFirst()
            .orElseThrow(() -> new CustomException("Forbidden: student not linked", 403));
        if (!Boolean.TRUE.equals(link.getCanViewScore()))
            throw new CustomException("Forbidden: no score view permission", 403);
    }

    private String resolveFullName(Student student) {
        if (student.getUser() != null && student.getUser().getFullName() != null
                && !student.getUser().getFullName().isBlank()) {
            return student.getUser().getFullName().trim();
        }
        return (nullSafe(student.getLastName()) + " " + nullSafe(student.getFirstName())).trim();
    }

    private String buildAvatarLabel(String fullName) {
        if (fullName == null || fullName.isBlank()) return "HS";
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length == 1) return parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase(Locale.ROOT);
        return (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)).toUpperCase(Locale.ROOT);
    }

    private String nullSafe(String v) {
        return v == null ? "" : v;
    }

    private ConductResponse toConductResponse(Conduct conduct) {
        return ConductResponse.builder()
            .id(conduct.getId() != null ? conduct.getId().toString() : null)
            .studentCode(conduct.getStudent() != null ? conduct.getStudent().getStudentCode() : null)
            .studentName(conduct.getStudent() != null ? resolveFullName(conduct.getStudent()) : null)
            .semesterCode(conduct.getSemester() != null ? conduct.getSemester().getCode() : null)
            .academicYearCode(conduct.getSemester() != null && conduct.getSemester().getAcademicYear() != null
                ? conduct.getSemester().getAcademicYear().getCode() : null)
            .classCode(conduct.getSchoolClass() != null ? conduct.getSchoolClass().getClassCode() : null)
            .className(conduct.getSchoolClass() != null ? conduct.getSchoolClass().getClassName() : null)
            .conductLevel(conduct.getConductLevel())
            .remarks(conduct.getRemarks())
            .assessedByTeacherCode(conduct.getAssessedBy() != null
                ? conduct.getAssessedBy().getTeacherCode() : null)
            .assessedByName(conduct.getAssessedBy() != null && conduct.getAssessedBy().getUser() != null
                ? conduct.getAssessedBy().getUser().getFullName() : null)
            .build();
    }

    private ExamResponse toExamResponse(Exam exam) {
        List<String> classCodes = exam.getExamClasses() == null ? List.of()
            : exam.getExamClasses().stream()
                .filter(ec -> ec.getSchoolClass() != null)
                .map(ec -> ec.getSchoolClass().getClassCode())
                .toList();

        return ExamResponse.builder()
            .examId(exam.getId() != null ? exam.getId().toString() : null)
            .semesterCode(exam.getSemester() != null ? exam.getSemester().getCode() : null)
            .academicYearCode(exam.getSemester() != null && exam.getSemester().getAcademicYear() != null
                ? exam.getSemester().getAcademicYear().getCode() : null)
            .subjectCode(exam.getSubject() != null ? exam.getSubject().getCode() : null)
            .subjectName(exam.getSubject() != null ? exam.getSubject().getName() : null)
            .examType(exam.getExamType())
            .title(exam.getTitle())
            .examDate(exam.getExamDate())
            .weight(exam.getWeight())
            .status(exam.getStatus())
            .classCodes(classCodes)
            .build();
    }
}

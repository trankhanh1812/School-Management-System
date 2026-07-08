package com.school.school_management.service.conduct;

import com.school.school_management.dto.conduct.ConductResponse;
import com.school.school_management.dto.conduct.ConductUpsertRequest;
import com.school.school_management.entity.Conduct;
import com.school.school_management.entity.Role;
import com.school.school_management.entity.SchoolClass;
import com.school.school_management.entity.Semester;
import com.school.school_management.entity.Student;
import com.school.school_management.entity.Teacher;
import com.school.school_management.entity.User;
import com.school.school_management.entity.UserRole;
import com.school.school_management.exception.CustomException;
import com.school.school_management.repository.ConductRepository;
import com.school.school_management.repository.SchoolClassRepository;
import com.school.school_management.repository.SemesterRepository;
import com.school.school_management.repository.StudentRepository;
import com.school.school_management.repository.TeacherRepository;
import com.school.school_management.repository.UserRepository;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

@Transactional
@Service
public class ConductServiceImpl implements ConductService {

    private final ConductRepository conductRepository;
    private final StudentRepository studentRepository;
    private final SemesterRepository semesterRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;

    public ConductServiceImpl(
            ConductRepository conductRepository,
            StudentRepository studentRepository,
            SemesterRepository semesterRepository,
            SchoolClassRepository schoolClassRepository,
            TeacherRepository teacherRepository,
            UserRepository userRepository) {
        this.conductRepository = conductRepository;
        this.studentRepository = studentRepository;
        this.semesterRepository = semesterRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.teacherRepository = teacherRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConductResponse> getConducts() {
        return conductRepository.findAllByOrderByIdDesc().stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ConductResponse getConduct(String id) {
        return toResponse(getConductEntity(id));
    }

    @Override
    public ConductResponse createConduct(ConductUpsertRequest request) {
        Student student = resolveStudent(request.getStudentCode());
        Semester semester = resolveSemester(request.getSemesterCode());
        SchoolClass schoolClass = resolveSchoolClass(request.getClassCode());
        assertCanAssessConduct(schoolClass);
        ensureConductDoesNotExist(student, semester, null);

        Conduct conduct = Conduct.builder()
            .student(student)
            .semester(semester)
            .schoolClass(schoolClass)
            .conductLevel(normalizeText(request.getConductLevel(), "Conduct level is required"))
            .remarks(normalizeOptionalText(request.getRemarks()))
            .assessedBy(resolveTeacher(request.getAssessedByTeacherCode()))
            .build();

        return toResponse(conductRepository.save(conduct));
    }

    @Override
    public ConductResponse updateConduct(String id, ConductUpsertRequest request) {
        Conduct conduct = getConductEntity(id);
        Student student = resolveStudent(request.getStudentCode());
        Semester semester = resolveSemester(request.getSemesterCode());
        SchoolClass schoolClass = resolveSchoolClass(request.getClassCode());
        assertCanAssessConduct(schoolClass);
        ensureConductDoesNotExist(student, semester, conduct.getId());

        conduct.setStudent(student);
        conduct.setSemester(semester);
        conduct.setSchoolClass(schoolClass);
        conduct.setConductLevel(normalizeText(request.getConductLevel(), "Conduct level is required"));
        conduct.setRemarks(normalizeOptionalText(request.getRemarks()));
        conduct.setAssessedBy(resolveTeacher(request.getAssessedByTeacherCode()));

        return toResponse(conductRepository.save(conduct));
    }

    @Override
    public void deleteConduct(String id) {
        Conduct conduct = getConductEntity(id);
        assertCanAssessConduct(conduct.getSchoolClass());
        conductRepository.delete(conduct);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConductResponse> getMyConducts() {
        User currentUser = getCurrentUser();
        Student student = currentUser.getStudent();
        if (student == null) {
            throw new CustomException("Current account is not linked to a student profile", 403);
        }
        return conductRepository.findByStudentOrderByIdDesc(student).stream()
            .map(this::toResponse)
            .toList();
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new CustomException("Unauthenticated", 401);
        }
        String email = authentication.getName().trim().toLowerCase(Locale.ROOT);
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new CustomException("Current user not found", 404));
    }

    /**
     * Chỉ ADMIN hoặc giáo viên CHỦ NHIỆM của lớp mới được tạo/sửa/xoá hạnh kiểm lớp đó.
     * (Trước đây controller giới hạn cứng ADMIN; nay mở cho GVCN đúng nghiệp vụ.)
     */
    private void assertCanAssessConduct(SchoolClass schoolClass) {
        User currentUser = getCurrentUser();
        boolean isAdmin = currentUser.getUserRoles().stream()
            .map(UserRole::getRole)
            .filter(role -> role != null)
            .map(Role::getCode)
            .filter(code -> code != null)
            .anyMatch(code -> code.equalsIgnoreCase("ADMIN"));
        if (isAdmin) {
            return;
        }
        Teacher currentTeacher = currentUser.getTeacher();
        if (currentTeacher != null && currentTeacher.getId() != null
                && schoolClass != null && schoolClass.getHomeroomTeacher() != null
                && currentTeacher.getId().equals(schoolClass.getHomeroomTeacher().getId())) {
            return;
        }
        throw new CustomException("Chỉ giáo viên chủ nhiệm của lớp mới được đánh giá hạnh kiểm", 403);
    }

    private Conduct getConductEntity(String id) {
        UUID conductId = parseUuid(id, "Conduct id is invalid");
        return conductRepository.findById(conductId)
            .orElseThrow(() -> new CustomException("Conduct not found", 404));
    }

    private ConductResponse toResponse(Conduct conduct) {
        return ConductResponse.builder()
            .id(conduct.getId() != null ? conduct.getId().toString() : "")
            .studentCode(conduct.getStudent() != null ? safe(conduct.getStudent().getStudentCode()) : "")
            .studentName(resolveStudentName(conduct.getStudent()))
            .semesterCode(conduct.getSemester() != null ? safe(conduct.getSemester().getCode()) : "")
            .academicYearCode(conduct.getSemester() != null && conduct.getSemester().getAcademicYear() != null
                ? safe(conduct.getSemester().getAcademicYear().getCode())
                : "")
            .classCode(conduct.getSchoolClass() != null ? safe(conduct.getSchoolClass().getClassCode()) : "")
            .className(conduct.getSchoolClass() != null ? safe(conduct.getSchoolClass().getClassName()) : "Chưa cập nhật")
            .conductLevel(safe(conduct.getConductLevel()))
            .remarks(safe(conduct.getRemarks()))
            .assessedByTeacherCode(conduct.getAssessedBy() != null ? safe(conduct.getAssessedBy().getTeacherCode()) : "")
            .assessedByName(conduct.getAssessedBy() != null && conduct.getAssessedBy().getUser() != null
                ? safe(conduct.getAssessedBy().getUser().getFullName())
                : "Chưa cập nhật")
            .build();
    }

    private void ensureConductDoesNotExist(Student student, Semester semester, UUID currentId) {
        conductRepository.findByStudentAndSemester(student, semester)
            .ifPresent(existing -> {
                if (currentId == null || !currentId.equals(existing.getId())) {
                    throw new CustomException("Conduct record already exists for this student and semester", 409);
                }
            });
    }

    private Student resolveStudent(String studentCode) {
        return studentRepository.findByStudentCodeAndDeletedAtIsNull(normalizeCode(studentCode))
            .orElseThrow(() -> new CustomException("Student not found", 404));
    }

    private Semester resolveSemester(String semesterCode) {
        String normalizedCode = normalizeCode(semesterCode);
        return semesterRepository.findAllByOrderByStartDateDesc().stream()
            .filter(semester -> semester.getCode() != null && semester.getCode().equalsIgnoreCase(normalizedCode))
            .findFirst()
            .orElseThrow(() -> new CustomException("Semester not found", 404));
    }

    private SchoolClass resolveSchoolClass(String classCode) {
        return schoolClassRepository.findByClassCodeAndDeletedAtIsNull(normalizeCode(classCode))
            .orElseThrow(() -> new CustomException("Class not found", 404));
    }

    private Teacher resolveTeacher(String teacherCode) {
        return teacherRepository.findByTeacherCodeAndDeletedAtIsNull(normalizeCode(teacherCode))
            .orElseThrow(() -> new CustomException("Teacher not found", 404));
    }

    private String normalizeCode(String value) {
        return normalizeText(value, "Code is required").toUpperCase(Locale.ROOT);
    }

    private String normalizeText(String value, String errorMessage) {
        if (value == null || value.trim().isEmpty()) {
            throw new CustomException(errorMessage, 400);
        }
        return value.trim();
    }

    private String normalizeOptionalText(String value) {
        return value == null || value.trim().isEmpty() ? null : value.trim();
    }

    private UUID parseUuid(String value, String errorMessage) {
        try {
            return UUID.fromString(normalizeText(value, errorMessage));
        } catch (IllegalArgumentException exception) {
            throw new CustomException(errorMessage, 400);
        }
    }

    private String safe(String value) {
        return value != null ? value : "";
    }

    private String resolveStudentName(Student student) {
        if (student == null) {
            return "Chưa cập nhật";
        }
        if (student.getUser() != null && student.getUser().getFullName() != null && !student.getUser().getFullName().isBlank()) {
            return student.getUser().getFullName();
        }
        String firstName = student.getFirstName() != null ? student.getFirstName().trim() : "";
        String lastName = student.getLastName() != null ? student.getLastName().trim() : "";
        String fullName = (lastName + " " + firstName).trim().replaceAll("\\s+", " ");
        return fullName.isBlank() ? "Chưa cập nhật" : fullName;
    }
}

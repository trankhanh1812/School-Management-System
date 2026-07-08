package com.school.school_management.service.score;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.school.school_management.dto.score.ScoreHistoryResponse;
import com.school.school_management.dto.score.ScoreResponse;
import com.school.school_management.dto.score.ScoreUpsertRequest;
import com.school.school_management.entity.Exam;
import com.school.school_management.entity.ParentStudent;
import com.school.school_management.entity.Score;
import com.school.school_management.entity.ScoreApprovalLog;
import com.school.school_management.entity.ScoreHistory;
import com.school.school_management.entity.Teacher;
import com.school.school_management.entity.User;
import com.school.school_management.exception.CustomException;
import com.school.school_management.repository.ExamRepository;
import com.school.school_management.repository.ParentStudentRepository;
import com.school.school_management.repository.ScoreApprovalLogRepository;
import com.school.school_management.repository.ScoreHistoryRepository;
import com.school.school_management.repository.ScoreRepository;
import com.school.school_management.repository.TeacherRepository;
import com.school.school_management.repository.UserRepository;
import com.school.school_management.service.notification.NotificationAutomationService;
import com.school.school_management.service.system.SystemSettingService;

@Service
@Transactional
public class ScoreServiceImpl implements ScoreService {

    private static final String DRAFT = "DRAFT";
    private static final String SUBMITTED = "SUBMITTED";
    private static final String APPROVED = "APPROVED";
    private static final String PUBLISHED = "PUBLISHED";
    private static final String LOCKED = "LOCKED";

    private final ScoreRepository scoreRepository;
    private final ExamRepository examRepository;
    private final ScoreHistoryRepository scoreHistoryRepository;
    private final ScoreApprovalLogRepository scoreApprovalLogRepository;
    private final UserRepository userRepository;
    private final TeacherRepository teacherRepository;
    private final ParentStudentRepository parentStudentRepository;
    private final NotificationAutomationService notificationAutomationService;
    private final SystemSettingService systemSettingService;

    public ScoreServiceImpl(
            ScoreRepository scoreRepository,
            ExamRepository examRepository,
            ScoreHistoryRepository scoreHistoryRepository,
            ScoreApprovalLogRepository scoreApprovalLogRepository,
            UserRepository userRepository,
            TeacherRepository teacherRepository,
            ParentStudentRepository parentStudentRepository,
            NotificationAutomationService notificationAutomationService,
            SystemSettingService systemSettingService) {
        this.scoreRepository = scoreRepository;
        this.examRepository = examRepository;
        this.scoreHistoryRepository = scoreHistoryRepository;
        this.scoreApprovalLogRepository = scoreApprovalLogRepository;
        this.userRepository = userRepository;
        this.teacherRepository = teacherRepository;
        this.parentStudentRepository = parentStudentRepository;
        this.notificationAutomationService = notificationAutomationService;
        this.systemSettingService = systemSettingService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ScoreResponse> listScores(String examId) {
        List<Score> scores;
        if (examId != null && !examId.trim().isEmpty()) {
            scores = scoreRepository.findByExamAndDeletedAtIsNull(getExamEntity(examId));
        } else {
            scores = scoreRepository.findAllByDeletedAtIsNullOrderByCreatedAtDesc();
        }

        if (isCurrentUserAdmin()) {
            return scores.stream().map(this::toResponse).toList();
        }

        Teacher teacher = getCurrentTeacher();
        return scores.stream()
            .filter(score -> score.getTeacher() != null && score.getTeacher().getId().equals(teacher.getId()))
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ScoreResponse getScore(String scoreId) {
        Score score = getScoreEntity(scoreId);
        assertCanAccessScore(score);
        return toResponse(score);
    }

    @Override
    public ScoreResponse updateScore(String scoreId, ScoreUpsertRequest request) {
        Score score = getScoreEntity(scoreId);
        assertCanAccessScore(score);
        assertCanEditScore(score);

        BigDecimal nextValue = request.getScoreValue() == null ? BigDecimal.ZERO : request.getScoreValue();
        BigDecimal oldValue = score.getScoreValue() == null ? BigDecimal.ZERO : score.getScoreValue();

        score.setScoreValue(nextValue);
        if (!PUBLISHED.equalsIgnoreCase(score.getStatus()) && !LOCKED.equalsIgnoreCase(score.getStatus())) {
            score.setStatus(DRAFT);
        }

        Score saved = scoreRepository.save(score);
        if (oldValue.compareTo(nextValue) != 0) {
            scoreHistoryRepository.save(ScoreHistory.builder()
                .score(saved)
                .oldValue(oldValue)
                .newValue(nextValue)
                .changedBy(getCurrentUser())
                .changeReason(normalizeReason(request.getChangeReason()))
                .changedAt(OffsetDateTime.now())
                .build());

            notificationAutomationService.notifyUsers(
                resolveScoreAudience(saved),
                "Điểm số đã được cập nhật",
                String.format(
                    "Điểm %s của học sinh %s được cập nhật từ %s thành %s.",
                    saved.getExam() != null ? normalizeText(saved.getExam().getTitle(), "bài kiểm tra") : "bài kiểm tra",
                    saved.getStudent() != null ? normalizeText(saved.getStudent().getStudentCode(), "N/A") : "N/A",
                    oldValue,
                    nextValue
                ),
                "SCORE_UPDATE"
            );
        }

        return toResponse(saved);
    }

    @Override
    public void submitScores(String examId) {
        Exam exam = getExamEntity(examId);
        List<Score> scores = scoreRepository.findByExamAndDeletedAtIsNull(exam);
        if (scores.isEmpty()) {
            throw new CustomException("No scores found for exam", 404);
        }

        if (isCurrentUserAdmin()) {
            boolean hasSubmitted = false;
            for (Score score : scores) {
                // Only DRAFT scores advance to SUBMITTED. Never pull an already
                // APPROVED/PUBLISHED score backward in the workflow.
                if (DRAFT.equalsIgnoreCase(score.getStatus())) {
                    score.setStatus(SUBMITTED);
                    scoreRepository.save(score);
                    hasSubmitted = true;
                }
            }
            if (hasSubmitted) {
                notificationAutomationService.notifyRole(
                    "ADMIN",
                    "Điểm số chờ duyệt",
                    String.format("Bài kiểm tra %s đã được nộp điểm và đang chờ duyệt.", normalizeText(exam.getTitle(), "N/A")),
                    "SCORE_UPDATE"
                );
            }
            return;
        }

        Teacher teacher = getCurrentTeacher();
        boolean hasSubmitted = false;
        for (Score score : scores) {
            if (score.getTeacher() == null || !score.getTeacher().getId().equals(teacher.getId())) {
                continue;
            }
            // Only DRAFT scores advance to SUBMITTED; leave APPROVED/PUBLISHED untouched.
            if (DRAFT.equalsIgnoreCase(score.getStatus())) {
                score.setStatus(SUBMITTED);
                scoreRepository.save(score);
                hasSubmitted = true;
            }
        }

        if (hasSubmitted) {
            notificationAutomationService.notifyRole(
                "ADMIN",
                "Điểm số chờ duyệt",
                String.format("Giáo viên đã nộp điểm cho bài kiểm tra %s.", normalizeText(exam.getTitle(), "N/A")),
                "SCORE_UPDATE"
            );
        }
    }

    @Override
    public ScoreResponse approveScore(String scoreId) {
        Score score = getScoreEntity(scoreId);

        if (LOCKED.equalsIgnoreCase(score.getStatus())) {
            throw new CustomException("Locked score cannot be approved", 409);
        }
        // Workflow: DRAFT -> SUBMITTED -> APPROVED. Approval requires a SUBMITTED score;
        // it cannot skip the submit step straight from DRAFT.
        if (!SUBMITTED.equalsIgnoreCase(score.getStatus())) {
            throw new CustomException("Only a submitted score can be approved", 409);
        }

        score.setStatus(APPROVED);
        Score saved = scoreRepository.save(score);

        scoreApprovalLogRepository.save(ScoreApprovalLog.builder()
            .score(saved)
            .approvedBy(getCurrentUser())
            .action("APPROVE")
            .createdAt(OffsetDateTime.now())
            .build());

        if (saved.getTeacher() != null && saved.getTeacher().getUser() != null) {
            notificationAutomationService.notifyUsers(
                List.of(saved.getTeacher().getUser()),
                "Điểm đã được duyệt",
                String.format(
                    "Điểm của bài kiểm tra %s cho học sinh %s đã được duyệt.",
                    saved.getExam() != null ? normalizeText(saved.getExam().getTitle(), "N/A") : "N/A",
                    saved.getStudent() != null ? normalizeText(saved.getStudent().getStudentCode(), "N/A") : "N/A"
                ),
                "SCORE_UPDATE"
            );
        }

        return toResponse(saved);
    }

    @Override
    public void publishScores(String examId) {
        Exam exam = getExamEntity(examId);
        List<Score> scores = scoreRepository.findByExamAndDeletedAtIsNull(exam);
        if (scores.isEmpty()) {
            throw new CustomException("No scores found for exam", 404);
        }

        boolean isAdmin = isCurrentUserAdmin();
        boolean requireAdminApproval = systemSettingService.getSettings().isRequireAdminApproval();

        if (requireAdminApproval && !isAdmin) {
            throw new CustomException("Only ADMIN can publish scores when admin approval is enabled", 403);
        }

        List<Score> targetScores = scores;
        if (!isAdmin) {
            Teacher teacher = getCurrentTeacher();
            targetScores = scores.stream()
                .filter(score -> score.getTeacher() != null && score.getTeacher().getId().equals(teacher.getId()))
                .toList();

            if (targetScores.isEmpty()) {
                throw new CustomException("No scores found for current teacher", 404);
            }
        }

        OffsetDateTime now = OffsetDateTime.now();
        List<String> publishedClassCodes = new java.util.ArrayList<>();
        for (Score score : targetScores) {
            if (LOCKED.equalsIgnoreCase(score.getStatus())) {
                throw new CustomException("Locked score cannot be published", 409);
            }

            boolean validStatus = requireAdminApproval
                ? (APPROVED.equalsIgnoreCase(score.getStatus()) || PUBLISHED.equalsIgnoreCase(score.getStatus()))
                : (DRAFT.equalsIgnoreCase(score.getStatus())
                    || SUBMITTED.equalsIgnoreCase(score.getStatus())
                    || APPROVED.equalsIgnoreCase(score.getStatus())
                    || PUBLISHED.equalsIgnoreCase(score.getStatus()));

            if (!validStatus) {
                throw new CustomException("All scores must be approved before publishing", 409);
            }

            score.setStatus(PUBLISHED);
            score.setPublishedAt(now);
            scoreRepository.save(score);

            if (score.getSchoolClass() != null && score.getSchoolClass().getClassCode() != null) {
                publishedClassCodes.add(score.getSchoolClass().getClassCode());
            }

            scoreApprovalLogRepository.save(ScoreApprovalLog.builder()
                .score(score)
                .approvedBy(getCurrentUser())
                .action("PUBLISH")
                .createdAt(now)
                .build());
        }

        notificationAutomationService.notifyClassCodes(
            publishedClassCodes.stream().distinct().toList(),
            "Điểm đã được công bố",
            String.format("Điểm bài kiểm tra %s đã được công bố.", normalizeText(exam.getTitle(), "N/A")),
            "SCORE_UPDATE"
        );
    }

    private List<User> resolveScoreAudience(Score score) {
        java.util.LinkedHashMap<UUID, User> recipients = new java.util.LinkedHashMap<>();
        if (score.getStudent() != null && score.getStudent().getUser() != null && score.getStudent().getUser().getDeletedAt() == null) {
            recipients.put(score.getStudent().getUser().getId(), score.getStudent().getUser());
        }

        if (score.getStudent() != null) {
            List<ParentStudent> links = parentStudentRepository.findByStudentIn(List.of(score.getStudent()));
            for (ParentStudent link : links) {
                if (link.getParent() != null && link.getParent().getUser() != null && link.getParent().getUser().getDeletedAt() == null) {
                    recipients.put(link.getParent().getUser().getId(), link.getParent().getUser());
                }
            }
        }

        return new java.util.ArrayList<>(recipients.values());
    }

    private String normalizeText(String value, String fallback) {
        if (value == null) {
            return fallback;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? fallback : trimmed;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ScoreHistoryResponse> getScoreHistory(String scoreId) {
        Score score = getScoreEntity(scoreId);
        assertCanAccessScore(score);

        return scoreHistoryRepository.findByScoreOrderByChangedAtDesc(score).stream()
            .map(item -> ScoreHistoryResponse.builder()
                .oldValue(item.getOldValue())
                .newValue(item.getNewValue())
                .changedBy(resolveUserName(item.getChangedBy()))
                .changeReason(item.getChangeReason())
                .changedAt(item.getChangedAt())
                .build())
            .toList();
    }

    private void assertCanEditScore(Score score) {
        if (LOCKED.equalsIgnoreCase(score.getStatus())) {
            throw new CustomException("Score is locked", 409);
        }

        if (PUBLISHED.equalsIgnoreCase(score.getStatus()) && !isWithinEditWindow(score)) {
            score.setStatus(LOCKED);
            scoreRepository.save(score);
            throw new CustomException("Edit window expired", 409);
        }
    }

    /** True if a PUBLISHED score is still inside its post-publish edit window. */
    private boolean isWithinEditWindow(Score score) {
        Integer editWindowDays = score.getExam() != null ? score.getExam().getEditWindowDays() : 0;
        OffsetDateTime publishedAt = score.getPublishedAt();
        if (publishedAt == null || editWindowDays == null || editWindowDays < 0) {
            return true;
        }
        return !OffsetDateTime.now().isAfter(publishedAt.plusDays(editWindowDays));
    }

    /** A score is editable unless locked, or published past its edit window. */
    private boolean isEditable(Score score) {
        if (LOCKED.equalsIgnoreCase(score.getStatus())) {
            return false;
        }
        if (PUBLISHED.equalsIgnoreCase(score.getStatus())) {
            return isWithinEditWindow(score);
        }
        return true;
    }

    private void assertCanAccessScore(Score score) {
        if (isCurrentUserAdmin()) {
            return;
        }

        Teacher teacher = getCurrentTeacher();
        if (score.getTeacher() == null || !score.getTeacher().getId().equals(teacher.getId())) {
            throw new CustomException("Forbidden", 403);
        }
    }

    private Score getScoreEntity(String scoreId) {
        UUID id;
        try {
            id = UUID.fromString(scoreId);
        } catch (IllegalArgumentException exception) {
            throw new CustomException("Invalid score id", 400);
        }

        return scoreRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new CustomException("Score not found", 404));
    }

    private Exam getExamEntity(String examId) {
        UUID id;
        try {
            id = UUID.fromString(examId);
        } catch (IllegalArgumentException exception) {
            throw new CustomException("Invalid exam id", 400);
        }

        return examRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new CustomException("Exam not found", 404));
    }

    private String normalizeReason(String reason) {
        if (reason == null || reason.trim().isEmpty()) {
            return "Manual update";
        }
        return reason.trim();
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

    private Teacher getCurrentTeacher() {
        User currentUser = getCurrentUser();
        return teacherRepository.findByUserAndDeletedAtIsNull(currentUser)
            .orElseThrow(() -> new CustomException("Teacher profile not found", 403));
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

    private String resolveUserName(User user) {
        if (user == null) {
            return "N/A";
        }
        if (user.getFullName() != null && !user.getFullName().isBlank()) {
            return user.getFullName();
        }
        return user.getEmail() != null ? user.getEmail() : "N/A";
    }

    private ScoreResponse toResponse(Score score) {
        String studentName = score.getStudent() != null && score.getStudent().getUser() != null
            ? score.getStudent().getUser().getFullName()
            : null;
        String teacherName = score.getTeacher() != null && score.getTeacher().getUser() != null
            ? score.getTeacher().getUser().getFullName()
            : null;

        return ScoreResponse.builder()
            .scoreId(score.getId().toString())
            .studentCode(score.getStudent() != null ? score.getStudent().getStudentCode() : "")
            .studentName(studentName == null ? "Chưa cập nhật" : studentName)
            .examId(score.getExam() != null && score.getExam().getId() != null ? score.getExam().getId().toString() : "")
            .examTitle(score.getExam() != null ? score.getExam().getTitle() : "")
            .examType(score.getExam() != null ? score.getExam().getExamType() : "")
            .classCode(score.getSchoolClass() != null ? score.getSchoolClass().getClassCode() : "")
            .teacherCode(score.getTeacher() != null ? score.getTeacher().getTeacherCode() : "")
            .teacherName(teacherName == null ? "Chưa cập nhật" : teacherName)
            .scoreValue(score.getScoreValue())
            .status(score.getStatus())
            .publishedAt(score.getPublishedAt())
            .editable(isEditable(score))
            .history(getScoreHistory(score.getId().toString()))
            .build();
    }
}

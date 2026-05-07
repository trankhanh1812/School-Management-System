package com.school.school_management.service.notification;

import com.school.school_management.dto.notification.NotificationAudienceClassResponse;
import com.school.school_management.dto.notification.NotificationCreateRequest;
import com.school.school_management.dto.notification.NotificationListResponse;
import com.school.school_management.dto.notification.NotificationResponse;
import com.school.school_management.entity.Notification;
import com.school.school_management.entity.NotificationRecipient;
import com.school.school_management.entity.ParentStudent;
import com.school.school_management.entity.SchoolClass;
import com.school.school_management.entity.Student;
import com.school.school_management.entity.StudentClass;
import com.school.school_management.entity.Teacher;
import com.school.school_management.entity.TeachingAssignment;
import com.school.school_management.entity.User;
import com.school.school_management.enums.NotificationType;
import com.school.school_management.exception.CustomException;
import com.school.school_management.repository.NotificationRecipientRepository;
import com.school.school_management.repository.NotificationRepository;
import com.school.school_management.repository.ParentStudentRepository;
import com.school.school_management.repository.SchoolClassRepository;
import com.school.school_management.repository.StudentClassRepository;
import com.school.school_management.repository.TeacherRepository;
import com.school.school_management.repository.TeachingAssignmentRepository;
import com.school.school_management.repository.UserRepository;
import com.school.school_management.service.notification.events.NotificationCreatedEvent;
import com.school.school_management.service.notification.events.NotificationUnreadCountChangedEvent;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private static final int DEFAULT_PAGE = 0;
    private static final int DEFAULT_SIZE = 20;
    private static final int MAX_SIZE = 100;

    private final NotificationRepository notificationRepository;
    private final NotificationRecipientRepository notificationRecipientRepository;
    private final UserRepository userRepository;
    private final TeacherRepository teacherRepository;
    private final TeachingAssignmentRepository teachingAssignmentRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final StudentClassRepository studentClassRepository;
    private final ParentStudentRepository parentStudentRepository;
    private final ApplicationEventPublisher applicationEventPublisher;

    public NotificationServiceImpl(
            NotificationRepository notificationRepository,
            NotificationRecipientRepository notificationRecipientRepository,
            UserRepository userRepository,
            TeacherRepository teacherRepository,
            TeachingAssignmentRepository teachingAssignmentRepository,
            SchoolClassRepository schoolClassRepository,
            StudentClassRepository studentClassRepository,
            ParentStudentRepository parentStudentRepository,
            ApplicationEventPublisher applicationEventPublisher) {
        this.notificationRepository = notificationRepository;
        this.notificationRecipientRepository = notificationRecipientRepository;
        this.userRepository = userRepository;
        this.teacherRepository = teacherRepository;
        this.teachingAssignmentRepository = teachingAssignmentRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.studentClassRepository = studentClassRepository;
        this.parentStudentRepository = parentStudentRepository;
        this.applicationEventPublisher = applicationEventPublisher;
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationListResponse listMine(Integer page, Integer size, String keyword, Boolean unreadOnly) {
        User currentUser = getCurrentUser();
        List<NotificationResponse> allRows = notificationRecipientRepository.findInboxByUser(currentUser)
            .stream()
            .map(this::toResponse)
            .toList();

        String normalizedKeyword = keyword == null ? "" : keyword.trim().toLowerCase(Locale.ROOT);
        boolean unread = Boolean.TRUE.equals(unreadOnly);

        List<NotificationResponse> filtered = allRows.stream()
            .filter(item -> !unread || !item.isRead())
            .filter(item -> {
                if (normalizedKeyword.isBlank()) {
                    return true;
                }
                String haystack = String.join(" ",
                    safe(item.getTitle()),
                    safe(item.getMessage()),
                    safe(item.getNotificationType()),
                    safe(item.getChannel())
                ).toLowerCase(Locale.ROOT);
                return haystack.contains(normalizedKeyword);
            })
            .toList();

        int normalizedPage = page == null ? DEFAULT_PAGE : Math.max(page, 0);
        int normalizedSize = size == null ? DEFAULT_SIZE : Math.max(1, Math.min(size, MAX_SIZE));

        long totalElements = filtered.size();
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / normalizedSize);

        int fromIndex = Math.min(normalizedPage * normalizedSize, filtered.size());
        int toIndex = Math.min(fromIndex + normalizedSize, filtered.size());
        List<NotificationResponse> pageItems = filtered.subList(fromIndex, toIndex);

        return NotificationListResponse.builder()
            .items(pageItems)
            .page(normalizedPage)
            .size(normalizedSize)
            .totalElements(totalElements)
            .totalPages(totalPages)
            .unreadCount(notificationRecipientRepository.countUnreadByUser(currentUser))
            .build();
    }

    @Override
    public NotificationResponse create(NotificationCreateRequest request) {
        if (!isCurrentUserAdminOrTeacher()) {
            throw new CustomException("Forbidden", 403);
        }

        List<User> recipients = resolveAudienceUsers(request);
        if (recipients.isEmpty()) {
            throw new CustomException("No recipients found for selected audience", 400);
        }

        NotificationType notificationType = NotificationType.fromString(request.getNotificationType());
        OffsetDateTime now = OffsetDateTime.now();

        Notification notification = Notification.builder()
            .title(request.getTitle().trim())
            .message(request.getMessage().trim())
            .notificationType(notificationType.name())
            .channel(request.getChannel().trim().toUpperCase(Locale.ROOT))
            .createdAt(now)
            .sentAt(now)
            .build();

        Notification saved = notificationRepository.save(notification);

        for (User recipient : recipients) {
            notificationRecipientRepository.save(NotificationRecipient.builder()
                .notification(saved)
                .user(recipient)
                .build());
        }

        applicationEventPublisher.publishEvent(new NotificationCreatedEvent(
            recipients.stream().map(User::getId).toList(),
            NotificationResponse.builder()
                .notificationId(saved.getId().toString())
                .title(saved.getTitle())
                .message(saved.getMessage())
                .notificationType(saved.getNotificationType())
                .channel(saved.getChannel())
                .createdAt(saved.getCreatedAt())
                .sentAt(saved.getSentAt())
                .read(false)
                .build()
        ));

        return NotificationResponse.builder()
            .notificationId(saved.getId().toString())
            .title(saved.getTitle())
            .message(saved.getMessage())
            .notificationType(saved.getNotificationType())
            .channel(saved.getChannel())
            .createdAt(saved.getCreatedAt())
            .sentAt(saved.getSentAt())
            .read(false)
            .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationAudienceClassResponse> listAudienceClasses() {
        if (isCurrentUserAdmin()) {
            return schoolClassRepository.findAllByDeletedAtIsNullOrderByClassNameAsc().stream()
                .map(this::toAudienceClass)
                .toList();
        }

        Teacher teacher = getCurrentTeacher();
        return teachingAssignmentRepository
            .findByTeacherOrderBySemester_AcademicYear_CodeDescSemester_CodeAsc(teacher)
            .stream()
            .map(TeachingAssignment::getSchoolClass)
            .filter(item -> item != null && item.getDeletedAt() == null)
            .collect(Collectors.toMap(
                item -> normalizeCode(item.getClassCode()),
                item -> item,
                (left, right) -> left,
                LinkedHashMap::new
            ))
            .values()
            .stream()
            .sorted((left, right) -> normalizeCode(left.getClassCode()).compareTo(normalizeCode(right.getClassCode())))
            .map(this::toAudienceClass)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount() {
        return notificationRecipientRepository.countUnreadByUser(getCurrentUser());
    }

    @Override
    public void markRead(String notificationId) {
        User currentUser = getCurrentUser();
        UUID id = parseNotificationId(notificationId);

        NotificationRecipient recipient = notificationRecipientRepository.findByUserAndNotificationId(currentUser, id)
            .orElseThrow(() -> new CustomException("Notification not found", 404));

        if (recipient.getReadAt() == null) {
            recipient.setReadAt(OffsetDateTime.now());
            notificationRecipientRepository.save(recipient);
            applicationEventPublisher.publishEvent(new NotificationUnreadCountChangedEvent(
                currentUser.getId(),
                notificationRecipientRepository.countUnreadByUser(currentUser)
            ));
        }
    }

    @Override
    public void markAllRead() {
        User currentUser = getCurrentUser();
        List<NotificationRecipient> inbox = notificationRecipientRepository.findInboxByUser(currentUser);
        OffsetDateTime now = OffsetDateTime.now();

        boolean hasUpdates = false;
        for (NotificationRecipient recipient : inbox) {
            if (recipient.getReadAt() == null) {
                recipient.setReadAt(now);
                hasUpdates = true;
            }
        }

        if (hasUpdates) {
            notificationRecipientRepository.saveAll(inbox);
            applicationEventPublisher.publishEvent(new NotificationUnreadCountChangedEvent(
                currentUser.getId(),
                notificationRecipientRepository.countUnreadByUser(currentUser)
            ));
        }
    }

    private List<User> resolveAudienceUsers(NotificationCreateRequest request) {
        String audience = normalizeAudience(request.getAudience());
        if ("CLASS".equals(audience)) {
            return resolveClassAudienceUsers(request.getClassCodes());
        }

        if ("ALL".equals(audience)) {
            return userRepository.findAllActiveUsers();
        }

        List<User> users = userRepository.findAllActiveByRoleCode(audience);
        return dedupUsers(users);
    }

    private List<User> resolveClassAudienceUsers(List<String> classCodesInput) {
        List<String> classCodes = normalizeClassCodes(classCodesInput);
        List<SchoolClass> classes = classCodes.stream()
            .map(this::resolveClassByCode)
            .toList();

        if (!isCurrentUserAdmin()) {
            assertTeacherCanTargetClasses(classes);
        }

        Map<UUID, User> recipients = new LinkedHashMap<>();
        for (SchoolClass schoolClass : classes) {
            List<StudentClass> activeMembers = studentClassRepository.findBySchoolClassAndEndDateIsNull(schoolClass);
            List<Student> students = activeMembers.stream()
                .map(StudentClass::getStudent)
                .filter(item -> item != null && item.getUser() != null && item.getUser().getDeletedAt() == null)
                .toList();

            for (Student student : students) {
                recipients.put(student.getUser().getId(), student.getUser());
            }

            if (!students.isEmpty()) {
                List<ParentStudent> parentLinks = parentStudentRepository.findByStudentIn(students);
                for (ParentStudent link : parentLinks) {
                    if (link.getParent() != null && link.getParent().getUser() != null && link.getParent().getUser().getDeletedAt() == null) {
                        User parentUser = link.getParent().getUser();
                        recipients.put(parentUser.getId(), parentUser);
                    }
                }
            }
        }

        return new ArrayList<>(recipients.values());
    }

    private void assertTeacherCanTargetClasses(List<SchoolClass> classes) {
        Teacher teacher = getCurrentTeacher();
        Set<String> allowedClasses = teachingAssignmentRepository
            .findByTeacherOrderBySemester_AcademicYear_CodeDescSemester_CodeAsc(teacher)
            .stream()
            .map(TeachingAssignment::getSchoolClass)
            .filter(item -> item != null && item.getClassCode() != null)
            .map(item -> normalizeCode(item.getClassCode()))
            .collect(Collectors.toSet());

        for (SchoolClass schoolClass : classes) {
            String classCode = normalizeCode(schoolClass.getClassCode());
            if (!allowedClasses.contains(classCode)) {
                throw new CustomException("Teacher cannot send notification to class " + classCode, 403);
            }
        }
    }

    private SchoolClass resolveClassByCode(String classCode) {
        return schoolClassRepository.findByClassCodeAndDeletedAtIsNull(classCode)
            .orElseThrow(() -> new CustomException("Class not found: " + classCode, 404));
    }

    private NotificationAudienceClassResponse toAudienceClass(SchoolClass schoolClass) {
        return NotificationAudienceClassResponse.builder()
            .classCode(schoolClass.getClassCode())
            .className(schoolClass.getClassName() != null ? schoolClass.getClassName() : schoolClass.getClassCode())
            .build();
    }

    private List<String> normalizeClassCodes(List<String> classCodes) {
        if (classCodes == null || classCodes.isEmpty()) {
            throw new CustomException("Class list is required for class audience", 400);
        }

        return classCodes.stream()
            .map(this::normalizeCode)
            .distinct()
            .toList();
    }

    private String normalizeAudience(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new CustomException("Audience is required", 400);
        }

        String normalized = value.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "ALL", "ADMIN", "TEACHER", "STUDENT", "PARENT", "CLASS" -> normalized;
            default -> throw new CustomException("Invalid audience", 400);
        };
    }

    private NotificationResponse toResponse(NotificationRecipient recipient) {
        Notification notification = recipient.getNotification();
        return NotificationResponse.builder()
            .notificationId(notification.getId().toString())
            .title(notification.getTitle())
            .message(notification.getMessage())
            .notificationType(notification.getNotificationType())
            .channel(notification.getChannel())
            .sentAt(notification.getSentAt())
            .createdAt(notification.getCreatedAt())
            .readAt(recipient.getReadAt())
            .read(recipient.getReadAt() != null)
            .build();
    }

    private UUID parseNotificationId(String notificationId) {
        try {
            return UUID.fromString(notificationId);
        } catch (IllegalArgumentException exception) {
            throw new CustomException("Invalid notification id", 400);
        }
    }

    private String normalizeCode(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new CustomException("Required code is missing", 400);
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private List<User> dedupUsers(List<User> users) {
        Map<UUID, User> uniqueUsers = new LinkedHashMap<>();
        for (User user : users) {
            if (user.getId() != null) {
                uniqueUsers.put(user.getId(), user);
            }
        }
        return new ArrayList<>(uniqueUsers.values());
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

    private Teacher getCurrentTeacher() {
        return teacherRepository.findByUserAndDeletedAtIsNull(getCurrentUser())
            .orElseThrow(() -> new CustomException("Teacher profile not found", 403));
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

    private boolean isCurrentUserAdminOrTeacher() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new CustomException("Unauthenticated", 401);
        }

        return authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .anyMatch(authority -> "ROLE_ADMIN".equals(authority) || "ROLE_TEACHER".equals(authority));
    }
}

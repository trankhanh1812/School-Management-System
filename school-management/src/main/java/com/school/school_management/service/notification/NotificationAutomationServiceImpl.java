package com.school.school_management.service.notification;

import com.school.school_management.dto.notification.NotificationResponse;
import com.school.school_management.entity.Notification;
import com.school.school_management.entity.NotificationRecipient;
import com.school.school_management.entity.ParentStudent;
import com.school.school_management.entity.SchoolClass;
import com.school.school_management.entity.Student;
import com.school.school_management.entity.StudentClass;
import com.school.school_management.entity.User;
import com.school.school_management.enums.NotificationType;
import com.school.school_management.repository.NotificationRecipientRepository;
import com.school.school_management.repository.NotificationRepository;
import com.school.school_management.repository.ParentStudentRepository;
import com.school.school_management.repository.SchoolClassRepository;
import com.school.school_management.repository.StudentClassRepository;
import com.school.school_management.repository.UserRepository;
import com.school.school_management.service.notification.events.NotificationCreatedEvent;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class NotificationAutomationServiceImpl implements NotificationAutomationService {

    private static final String DEFAULT_CHANNEL = "APP";

    private final NotificationRepository notificationRepository;
    private final NotificationRecipientRepository notificationRecipientRepository;
    private final UserRepository userRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final StudentClassRepository studentClassRepository;
    private final ParentStudentRepository parentStudentRepository;
    private final ApplicationEventPublisher applicationEventPublisher;

    public NotificationAutomationServiceImpl(
            NotificationRepository notificationRepository,
            NotificationRecipientRepository notificationRecipientRepository,
            UserRepository userRepository,
            SchoolClassRepository schoolClassRepository,
            StudentClassRepository studentClassRepository,
            ParentStudentRepository parentStudentRepository,
            ApplicationEventPublisher applicationEventPublisher) {
        this.notificationRepository = notificationRepository;
        this.notificationRecipientRepository = notificationRecipientRepository;
        this.userRepository = userRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.studentClassRepository = studentClassRepository;
        this.parentStudentRepository = parentStudentRepository;
        this.applicationEventPublisher = applicationEventPublisher;
    }

    @Override
    public void notifyUsers(Collection<User> recipients, String title, String message, String notificationType) {
        List<User> normalizedRecipients = normalizeRecipients(recipients);
        if (normalizedRecipients.isEmpty()) {
            return;
        }

        OffsetDateTime now = OffsetDateTime.now();
        Notification notification = notificationRepository.save(Notification.builder()
            .title(normalizeText(title, "Thông báo hệ thống"))
            .message(normalizeText(message, "Có cập nhật mới trong hệ thống."))
            .notificationType(NotificationType.fromString(notificationType).name())
            .channel(DEFAULT_CHANNEL)
            .createdAt(now)
            .sentAt(now)
            .build());

        List<NotificationRecipient> links = normalizedRecipients.stream()
            .map(user -> NotificationRecipient.builder().notification(notification).user(user).build())
            .toList();
        notificationRecipientRepository.saveAll(links);

        applicationEventPublisher.publishEvent(new NotificationCreatedEvent(
            normalizedRecipients.stream().map(User::getId).toList(),
            NotificationResponse.builder()
                .notificationId(notification.getId().toString())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .notificationType(notification.getNotificationType())
                .channel(notification.getChannel())
                .createdAt(notification.getCreatedAt())
                .sentAt(notification.getSentAt())
                .read(false)
                .build()
        ));
    }

    @Override
    public void notifyRole(String roleCode, String title, String message, String notificationType) {
        if (roleCode == null || roleCode.trim().isEmpty()) {
            return;
        }

        List<User> recipients = userRepository.findAllActiveByRoleCode(roleCode.trim().toUpperCase(Locale.ROOT));
        notifyUsers(recipients, title, message, notificationType);
    }

    @Override
    public void notifyClassCodes(Collection<String> classCodes, String title, String message, String notificationType) {
        if (classCodes == null || classCodes.isEmpty()) {
            return;
        }

        List<User> recipients = resolveRecipientsFromClassCodes(classCodes);
        notifyUsers(recipients, title, message, notificationType);
    }

    private List<User> normalizeRecipients(Collection<User> recipients) {
        if (recipients == null || recipients.isEmpty()) {
            return List.of();
        }

        Map<UUID, User> dedup = new LinkedHashMap<>();
        for (User recipient : recipients) {
            if (recipient == null || recipient.getId() == null || recipient.getDeletedAt() != null) {
                continue;
            }
            dedup.put(recipient.getId(), recipient);
        }

        return new ArrayList<>(dedup.values());
    }

    private List<User> resolveRecipientsFromClassCodes(Collection<String> classCodes) {
        Set<String> normalizedCodes = classCodes.stream()
            .filter(code -> code != null && !code.trim().isEmpty())
            .map(code -> code.trim().toUpperCase(Locale.ROOT))
            .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));

        Map<UUID, User> recipients = new LinkedHashMap<>();

        for (String classCode : normalizedCodes) {
            SchoolClass schoolClass = schoolClassRepository.findByClassCodeAndDeletedAtIsNull(classCode).orElse(null);
            if (schoolClass == null) {
                continue;
            }

            List<StudentClass> activeMappings = studentClassRepository.findBySchoolClassAndEndDateIsNull(schoolClass);
            List<Student> students = activeMappings.stream()
                .map(StudentClass::getStudent)
                .filter(student -> student != null && student.getUser() != null && student.getUser().getDeletedAt() == null)
                .toList();

            for (Student student : students) {
                recipients.put(student.getUser().getId(), student.getUser());
            }

            if (!students.isEmpty()) {
                List<ParentStudent> links = parentStudentRepository.findByStudentIn(students);
                for (ParentStudent link : links) {
                    if (link.getParent() != null && link.getParent().getUser() != null && link.getParent().getUser().getDeletedAt() == null) {
                        User parentUser = link.getParent().getUser();
                        recipients.put(parentUser.getId(), parentUser);
                    }
                }
            }
        }

        return new ArrayList<>(recipients.values());
    }

    private String normalizeText(String value, String fallback) {
        if (value == null) {
            return fallback;
        }

        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return fallback;
        }

        return trimmed;
    }
}
package com.school.school_management.controller;

import com.school.school_management.dto.ApiResponse;
import com.school.school_management.dto.notification.NotificationAudienceClassResponse;
import com.school.school_management.dto.notification.NotificationCreateRequest;
import com.school.school_management.dto.notification.NotificationListResponse;
import com.school.school_management.dto.notification.NotificationResponse;
import com.school.school_management.dto.notification.NotificationUnreadCountResponse;
import com.school.school_management.service.notification.NotificationService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    @GetMapping
    public ResponseEntity<ApiResponse<NotificationListResponse>> listMine(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean unreadOnly) {
        return ResponseEntity.ok(ApiResponse.of(
            notificationService.listMine(page, size, keyword, unreadOnly),
            "Notifications fetched successfully",
            200
        ));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @PostMapping
    public ResponseEntity<ApiResponse<NotificationResponse>> create(@Valid @RequestBody NotificationCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.of(notificationService.create(request), "Notification created successfully", 201));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    @GetMapping("/audience-classes")
    public ResponseEntity<ApiResponse<List<NotificationAudienceClassResponse>>> listAudienceClasses() {
        return ResponseEntity.ok(ApiResponse.of(notificationService.listAudienceClasses(), "Audience classes fetched successfully", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<NotificationUnreadCountResponse>> getUnreadCount() {
        return ResponseEntity.ok(ApiResponse.of(
            NotificationUnreadCountResponse.builder().unreadCount(notificationService.getUnreadCount()).build(),
            "Unread count fetched successfully",
            200
        ));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(@PathVariable String notificationId) {
        notificationService.markRead(notificationId);
        return ResponseEntity.ok(ApiResponse.of(null, "Notification marked as read", 200));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')")
    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllRead() {
        notificationService.markAllRead();
        return ResponseEntity.ok(ApiResponse.of(null, "All notifications marked as read", 200));
    }
}

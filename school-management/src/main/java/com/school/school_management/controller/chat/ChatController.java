package com.school.school_management.controller.chat;

import java.util.Locale;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.school.school_management.dto.ApiResponse;
import com.school.school_management.dto.chat.AddStudentMembersRequest;
import com.school.school_management.dto.chat.AutoAddMembersRequest;
import com.school.school_management.dto.chat.ChatGroupResponse;
import com.school.school_management.dto.chat.ChatMessageResponse;
import com.school.school_management.dto.chat.CreateChatGroupRequest;
import com.school.school_management.dto.chat.SendMessageRequest;
import com.school.school_management.entity.User;
import com.school.school_management.exception.CustomException;
import com.school.school_management.repository.UserRepository;
import com.school.school_management.service.chat.ChatGroupService;
import com.school.school_management.service.chat.ChatMessageService;

@RestController
@RequestMapping("/api/chat")
@PreAuthorize("isAuthenticated()")
public class ChatController {

    private final ChatGroupService chatGroupService;
    private final ChatMessageService chatMessageService;
    private final UserRepository userRepository;

    public ChatController(
        ChatGroupService chatGroupService,
        ChatMessageService chatMessageService,
        UserRepository userRepository
    ) {
        this.chatGroupService = chatGroupService;
        this.chatMessageService = chatMessageService;
        this.userRepository = userRepository;
    }

    private UUID getCurrentUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().trim().isEmpty()) {
            throw new CustomException("Unauthenticated", 401);
        }
        String email = authentication.getName().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new CustomException("Current user not found", 404));
        return user.getId();
    }

    // ========== CHAT GROUP ENDPOINTS ==========

    @PostMapping("/groups")
    public ResponseEntity<ApiResponse<ChatGroupResponse>> createGroup(
        @RequestBody CreateChatGroupRequest request,
        Authentication authentication
    ) {
        UUID userId = getCurrentUserId(authentication);
        ChatGroupResponse response = chatGroupService.createGroup(request, userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Chat group created successfully"));
    }

    @GetMapping("/groups/{groupId}")
    public ResponseEntity<ApiResponse<ChatGroupResponse>> getGroup(
        @PathVariable UUID groupId,
        Authentication authentication
    ) {
        UUID userId = getCurrentUserId(authentication);
        boolean isAdmin = authentication.getAuthorities().stream()
            .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (!isAdmin && !chatGroupService.isMemberOfGroup(groupId, userId)) {
            throw new CustomException("You are not a member of this chat group", 403);
        }
        ChatGroupResponse response = chatGroupService.getGroupById(groupId);
        return ResponseEntity.ok(ApiResponse.success(response, "Chat group retrieved"));
    }

    @GetMapping("/groups")
    public ResponseEntity<ApiResponse<Page<ChatGroupResponse>>> getUserGroups(
        Authentication authentication,
        Pageable pageable
    ) {
        UUID userId = getCurrentUserId(authentication);
        Page<ChatGroupResponse> response = chatGroupService.getUserGroups(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "User chat groups retrieved"));
    }

    @GetMapping("/groups/type/{groupType}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<Object>> getGroupsByType(@PathVariable String groupType) {
        var response = chatGroupService.getGroupsByType(groupType);
        return ResponseEntity.ok(ApiResponse.success(response, "Groups by type retrieved"));
    }

    @PutMapping("/groups/{groupId}")
    public ResponseEntity<ApiResponse<ChatGroupResponse>> updateGroup(
        @PathVariable UUID groupId,
        @RequestBody CreateChatGroupRequest request,
        Authentication authentication
    ) {
        ChatGroupResponse response = chatGroupService.updateGroup(groupId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Chat group updated successfully"));
    }

    @PostMapping("/groups/{groupId}/members/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<Void>> addMemberToGroup(
        @PathVariable UUID groupId,
        @PathVariable UUID userId
    ) {
        chatGroupService.addMemberToGroup(groupId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Member added to group"));
    }

    @PostMapping("/groups/{groupId}/members/by-email")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<Void>> addMemberToGroupByEmail(
        @PathVariable UUID groupId,
        @RequestBody java.util.Map<String, String> payload
    ) {
        String email = payload.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Email is required", 400));
        }

        User user = userRepository.findByEmail(email.trim().toLowerCase(Locale.ROOT))
            .orElseThrow(() -> new com.school.school_management.exception.CustomException("User not found", 404));

        chatGroupService.addMemberToGroup(groupId, user.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "Member added to group"));
    }

    @PostMapping("/groups/{groupId}/members/students/add")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<Void>> addStudentMembersToGroup(
        @PathVariable UUID groupId,
        @RequestBody AddStudentMembersRequest request
    ) {
        chatGroupService.addStudentMembersToGroup(groupId, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Student members added to group"));
    }

    @PostMapping("/groups/{groupId}/members/auto-add")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<Void>> autoAddMembersToGroup(
        @PathVariable UUID groupId,
        @RequestBody AutoAddMembersRequest request
    ) {
        chatGroupService.autoAddMembersToGroup(groupId, request);
        return ResponseEntity.ok(ApiResponse.success(null, "Members auto-added to group"));
    }

    @DeleteMapping("/groups/{groupId}/members/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeMemberFromGroup(
        @PathVariable UUID groupId,
        @PathVariable UUID userId,
        Authentication authentication
    ) {
        UUID currentUserId = getCurrentUserId(authentication);
        // Check if user is removing themselves or is admin
        if (!userId.equals(currentUserId)) {
            // Only admin can remove others
        }
        chatGroupService.removeMemberFromGroup(groupId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Member removed from group"));
    }

    @PostMapping("/groups/{groupId}/archive")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<Void>> archiveGroup(@PathVariable UUID groupId) {
        chatGroupService.archiveGroup(groupId);
        return ResponseEntity.ok(ApiResponse.success(null, "Group archived"));
    }

    @PostMapping("/groups/{groupId}/unarchive")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<Void>> unarchiveGroup(@PathVariable UUID groupId) {
        chatGroupService.unarchiveGroup(groupId);
        return ResponseEntity.ok(ApiResponse.success(null, "Group unarchived"));
    }

    @DeleteMapping("/groups/{groupId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteGroup(@PathVariable UUID groupId) {
        chatGroupService.deleteGroup(groupId);
        return ResponseEntity.ok(ApiResponse.success(null, "Group deleted"));
    }

    // ========== CHAT MESSAGE ENDPOINTS ==========

    @PostMapping("/groups/{groupId}/messages")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
        @PathVariable UUID groupId,
        @RequestBody SendMessageRequest request,
        Authentication authentication
    ) {
        UUID userId = getCurrentUserId(authentication);
        ChatMessageResponse response = chatMessageService.sendMessage(groupId, userId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Message sent successfully"));
    }

    @GetMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> getMessage(
        @PathVariable UUID messageId,
        Authentication authentication
    ) {
        UUID userId = getCurrentUserId(authentication);
        ChatMessageResponse response = chatMessageService.getMessageById(messageId, userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Message retrieved"));
    }

    @GetMapping("/groups/{groupId}/messages")
    public ResponseEntity<ApiResponse<Page<ChatMessageResponse>>> getGroupMessages(
        @PathVariable UUID groupId,
        Authentication authentication,
        Pageable pageable
    ) {
        UUID userId = getCurrentUserId(authentication);
        Page<ChatMessageResponse> response = chatMessageService.getGroupMessages(groupId, userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Messages retrieved"));
    }

    @GetMapping("/groups/{groupId}/messages/search")
    public ResponseEntity<ApiResponse<Page<ChatMessageResponse>>> searchMessages(
        @PathVariable UUID groupId,
        @RequestParam String keyword,
        Authentication authentication,
        Pageable pageable
    ) {
        UUID userId = getCurrentUserId(authentication);
        Page<ChatMessageResponse> response = chatMessageService.searchMessages(groupId, keyword, userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Messages searched"));
    }

    @PutMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> updateMessage(
        @PathVariable UUID messageId,
        @RequestBody SendMessageRequest request,
        Authentication authentication
    ) {
        UUID userId = getCurrentUserId(authentication);
        ChatMessageResponse response = chatMessageService.updateMessage(messageId, userId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Message updated successfully"));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(
        @PathVariable UUID messageId,
        Authentication authentication
    ) {
        UUID userId = getCurrentUserId(authentication);
        chatMessageService.deleteMessage(messageId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Message deleted"));
    }

    @PostMapping("/messages/{messageId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
        @PathVariable UUID messageId,
        Authentication authentication
    ) {
        UUID userId = getCurrentUserId(authentication);
        chatMessageService.markMessageAsRead(messageId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Message marked as read"));
    }

    @PostMapping("/groups/{groupId}/read-all")
    public ResponseEntity<ApiResponse<Void>> markGroupMessagesAsRead(
        @PathVariable UUID groupId,
        Authentication authentication
    ) {
        UUID userId = getCurrentUserId(authentication);
        chatMessageService.markGroupMessagesAsRead(groupId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "All group messages marked as read"));
    }

    @GetMapping("/groups/{groupId}/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
        @PathVariable UUID groupId,
        Authentication authentication
    ) {
        UUID userId = getCurrentUserId(authentication);
        long count = chatMessageService.getUnreadMessageCount(groupId, userId);
        return ResponseEntity.ok(ApiResponse.success(count, "Unread count retrieved"));
    }
}

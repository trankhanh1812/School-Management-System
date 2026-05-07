package com.school.school_management.service.chat;

import com.school.school_management.dto.chat.ChatGroupResponse;
import com.school.school_management.dto.chat.CreateChatGroupRequest;
import com.school.school_management.dto.chat.AddStudentMembersRequest;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ChatGroupService {

    ChatGroupResponse createGroup(CreateChatGroupRequest request, UUID createdBy);

    ChatGroupResponse getGroupById(UUID groupId);

    Page<ChatGroupResponse> getUserGroups(UUID userId, Pageable pageable);

    List<ChatGroupResponse> getGroupsByType(String groupType);

    Page<ChatGroupResponse> getAllGroups(Pageable pageable);

    void addMemberToGroup(UUID groupId, UUID userId);

    void addStudentMembersToGroup(UUID groupId, AddStudentMembersRequest request);

    void removeMemberFromGroup(UUID groupId, UUID userId);

    boolean isMemberOfGroup(UUID groupId, UUID userId);

    void archiveGroup(UUID groupId);

    void unarchiveGroup(UUID groupId);

    void deleteGroup(UUID groupId);

    ChatGroupResponse updateGroup(UUID groupId, CreateChatGroupRequest request);
}

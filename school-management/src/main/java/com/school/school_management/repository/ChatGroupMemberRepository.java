package com.school.school_management.repository;

import com.school.school_management.entity.ChatGroupMember;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatGroupMemberRepository extends BaseRepository<ChatGroupMember, UUID> {

    Optional<ChatGroupMember> findByChatGroupIdAndUserId(UUID chatGroupId, UUID userId);

    List<ChatGroupMember> findByChatGroupId(UUID chatGroupId);

    List<ChatGroupMember> findByUserId(UUID userId);

    boolean existsByChatGroupIdAndUserId(UUID chatGroupId, UUID userId);

    long countByChatGroupId(UUID chatGroupId);

    void deleteByChatGroupIdAndUserId(UUID chatGroupId, UUID userId);
}

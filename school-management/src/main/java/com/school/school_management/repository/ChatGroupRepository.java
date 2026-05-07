package com.school.school_management.repository;

import com.school.school_management.entity.ChatGroup;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatGroupRepository extends BaseRepository<ChatGroup, UUID> {

    Optional<ChatGroup> findByIdAndDeletedAtIsNull(UUID id);

    List<ChatGroup> findByDeletedAtIsNullOrderByCreatedAtDesc();

    Page<ChatGroup> findByDeletedAtIsNullOrderByCreatedAtDesc(Pageable pageable);

    List<ChatGroup> findByGroupTypeAndDeletedAtIsNull(String groupType);

    List<ChatGroup> findByScopeAndDeletedAtIsNull(String scope);

    List<ChatGroup> findByGroupTypeAndScopeAndDeletedAtIsNull(String groupType, String scope);

    List<ChatGroup> findBySchoolClassIdAndDeletedAtIsNull(UUID classId);

    List<ChatGroup> findBySubjectIdAndDeletedAtIsNull(UUID subjectId);

    List<ChatGroup> findByDepartmentIdAndDeletedAtIsNull(UUID departmentId);

    List<ChatGroup> findByCreatedByAndDeletedAtIsNull(UUID createdBy);
}

package com.school.school_management.repository;

import com.school.school_management.entity.Parent;
import com.school.school_management.entity.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface ParentRepository extends BaseRepository<Parent, UUID> {
    Optional<Parent> findByParentCode(String parentCode);
    Optional<Parent> findByUser(User user);
}

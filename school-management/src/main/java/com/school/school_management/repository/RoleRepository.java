package com.school.school_management.repository;

import com.school.school_management.entity.Role;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface RoleRepository extends BaseRepository<Role, UUID> {

    Optional<Role> findByCode(String code);
}

package com.school.school_management.repository;

import com.school.school_management.entity.UserRole;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * UserRoleRepository - Data access layer for UserRole entity.
 * 
 * Provides CRUD operations and custom queries for managing user-role associations.
 */
@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {
}

package com.school.school_management.repository;

import com.school.school_management.entity.User;
import java.util.List;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * UserRepository - Repository for User entity
 * 
 * Extends BaseRepository for standard CRUD operations
 * Provides custom query methods for User-specific operations
 */
@Repository
public interface UserRepository extends BaseRepository<User, UUID> {
    
    /**
     * Find user by email
     * Used for login authentication
     * 
     * @param email user email address
     * @return Optional containing User if found, empty otherwise
     */
    Optional<User> findByEmail(String email);
    
    /**
     * Check if user with given email exists
     * 
     * @param email user email address
     * @return true if user exists, false otherwise
     */
    boolean existsByEmail(String email);
    
    /**
     * Find user by username
     * 
     * @param username user username
     * @return Optional containing User if found, empty otherwise
     */
    Optional<User> findByUsername(String username);

    Optional<User> findByIdAndDeletedAtIsNull(java.util.UUID id);

    Optional<User> findByUsernameAndDeletedAtIsNull(String username);

    @Query("""
        select u
        from User u
        where u.deletedAt is null
        """)
    List<User> findAllActiveUsers();

    @Query("""
        select distinct u
        from User u
        join u.userRoles ur
        join ur.role r
        where u.deletedAt is null
          and upper(r.code) = upper(:roleCode)
        """)
    List<User> findAllActiveByRoleCode(@Param("roleCode") String roleCode);
}

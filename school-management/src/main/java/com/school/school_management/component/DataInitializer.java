package com.school.school_management.component;

import com.school.school_management.entity.Role;
import com.school.school_management.entity.User;
import com.school.school_management.entity.UserRole;
import com.school.school_management.repository.RoleRepository;
import com.school.school_management.repository.UserRepository;
import com.school.school_management.repository.UserRoleRepository;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * DataInitializer - Automatically initialize system admin account on application startup.
 * 
 * This component runs after the application context is fully created and initializes:
 * - ADMIN role (if not exists)
 * - admin/admin user account with ADMIN role (if not exists)
 * 
 * The initialization is idempotent and only runs once per application startup.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void initializeAdminData() {
        log.info("Initializing admin data...");

        // Step 1: Ensure ADMIN role exists
        Role adminRole = roleRepository.findByCode("ADMIN")
            .orElseGet(() -> {
                log.info("Creating ADMIN role...");
                return roleRepository.save(
                    Role.builder()
                        .code("ADMIN")
                        .name("Administrator")
                        .description("System administrator with full access")
                        .build()
                );
            });

        // Step 2: Ensure admin user exists
        if (userRepository.findByUsername("admin").isEmpty()) {
            log.info("Creating admin user account...");

            User adminUser = User.builder()
                .username("admin")
                .email("admin@school.local")
                .passwordHash(passwordEncoder.encode("admin"))
                .fullName("System Administrator")
                .status("ACTIVE")
                .build();

            adminUser = userRepository.save(adminUser);

            // Step 3: Assign ADMIN role to admin user
            UserRole userRole = UserRole.builder()
                .user(adminUser)
                .role(adminRole)
                .build();

            userRoleRepository.save(userRole);
            
            log.info("Admin account created successfully: username=admin, password=admin, roles=[ADMIN]");
        } else {
            log.debug("Admin user already exists, skipping initialization");
        }
    }
}

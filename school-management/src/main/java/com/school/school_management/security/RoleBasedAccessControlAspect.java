package com.school.school_management.security;

import com.school.school_management.exception.CustomException;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.Arrays;

/**
 * RoleBasedAccessControlAspect - AOP aspect for RBAC using @RequireRole annotation
 * 
 * Intercepts methods annotated with @RequireRole and checks if current user has required role
 * before allowing method execution
 * 
 * Usage:
 * @RequireRole({"ADMIN", "TEACHER"})
 * public ResponseEntity<?> manageStudents() { ... }
 * 
 * If user doesn't have required role, throws CustomException with 403 status
 */
@Slf4j
@Aspect
@Component
public class RoleBasedAccessControlAspect {
    
    /**
     * Before method execution, check if user has required role
     * 
     * @param joinPoint method being called
     * @throws CustomException if user doesn't have required role
     */
    @Before("@annotation(com.school.school_management.security.RequireRole)")
    public void checkRole(JoinPoint joinPoint) {
        // Get the method signature
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        
        // Get the annotation
        RequireRole requireRole = method.getAnnotation(RequireRole.class);
        if (requireRole == null) {
            return;
        }
        
        String[] requiredRoles = requireRole.value();
        
        // Get current authentication
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            log.warn("Unauthorized access attempt to method: {}", method.getName());
            throw new CustomException("Access denied. Authentication required.", 401);
        }
        
        // Check if user has any of the required roles
        boolean hasRequiredRole = authentication.getAuthorities().stream()
            .anyMatch(auth -> {
                String authorityName = auth.getAuthority();
                // Authority might be in form "ROLE_ADMIN" and requiredRoles contains "ADMIN"
                String roleName = authorityName.replace("ROLE_", "");
                return Arrays.asList(requiredRoles).contains(roleName);
            });
        
        if (!hasRequiredRole) {
            String username = authentication.getName();
            log.warn("Access denied for user: {} to method: {}. Required roles: {}",
                username, method.getName(), Arrays.toString(requiredRoles));
            
            throw new CustomException(
                "Access denied. Required roles: " + String.join(", ", requiredRoles),
                403
            );
        }
        
        log.debug("User {} granted access to method: {}", 
            authentication.getName(), method.getName());
    }
}

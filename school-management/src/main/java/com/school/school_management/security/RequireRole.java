package com.school.school_management.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * RequireRole - Annotation for role-based access control (RBAC)
 * 
 * Used on controller methods to restrict access to specific roles
 * 
 * Examples:
 * @RequireRole(UserRole.ADMIN)
 * public ResponseEntity<?> deleteAllData() { ... }
 * 
 * @RequireRole(UserRole.TEACHER)
 * public ResponseEntity<?> submitGrades() { ... }
 * 
 * @RequireRole({UserRole.ADMIN, UserRole.TEACHER})
 * public ResponseEntity<?> manageClass() { ... }
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireRole {
    
    /**
     * Allowed roles that can access this endpoint
     * Using string values to avoid import issues and allow flexibility
     * 
     * Valid values: ADMIN, TEACHER, STUDENT, PARENT, STAFF
     */
    String[] value();
}

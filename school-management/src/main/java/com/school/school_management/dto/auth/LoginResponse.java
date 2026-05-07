package com.school.school_management.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * LoginResponse - Response after successful login
 * 
 * Contains JWT token and user information
 * 
 * Example response:
 * {
 *   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "tokenType": "Bearer",
 *   "expiresIn": 3600,
 *   "user": {
 *     "id": "uuid",
 *     "email": "user@school.edu.vn",
 *     "fullName": "John Doe",
 *     "role": "STUDENT",
 *     "roles": ["STUDENT"],
 *     "isActive": true
 *   }
 * }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    
    private String accessToken;
    private String refreshToken;
    private String tokenType;        // "Bearer"
    private long expiresIn;          // Seconds (default 3600 = 1 hour)
    private UserInfo user;
    
    /**
     * Inner class for user information in response
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserInfo {
        private UUID id;
        private String email;
        private String fullName;
        private String role;          // Primary role
        private List<String> roles;   // All assigned roles
        private boolean active;
        private OffsetDateTime createdAt;
        
        // Department info for TEACHER role
        private Integer departmentLevel;  // 1 = Head, 2 = Vice, 3 = Regular
        private String departmentCode;
        private String departmentName;
    }
}

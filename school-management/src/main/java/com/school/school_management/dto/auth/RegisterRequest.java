package com.school.school_management.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * RegisterRequest - DTO for user registration
 * 
 * Example:
 * {
 *   "email": "user@school.edu.vn",
 *   "password": "secure_password_123",
 *   "confirmPassword": "secure_password_123",
 *   "fullName": "John Doe",
 *   "role": "STUDENT"
 * }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {
    
    @Email(message = "Email should be valid")
    @NotBlank(message = "Email is required")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
    
    @NotBlank(message = "Confirm password is required")
    private String confirmPassword;
    
    @NotBlank(message = "Full name is required")
    private String fullName;
    
    @NotBlank(message = "Role is required")
    private String role;  // STUDENT, TEACHER, PARENT, STAFF, ADMIN
}

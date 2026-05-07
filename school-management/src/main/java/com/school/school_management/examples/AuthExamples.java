//package com.school.school_management.examples;
//
//import com.school.school_management.security.RequireRole;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
///**
// * AuthExamples - Demonstrates authentication and authorization patterns
// *
// * This file shows:
// * - How to use JWT authentication
// * - How to use RBAC with @RequireRole
// * - How to implement protected endpoints
// * - How to make API calls with JWT token
// * - Workflow examples (login -> call API -> refresh token)
// */
//public class AuthExamples {
//
//    /**
//     * ========== JWT AUTHENTICATION FLOW ==========
//     */
//
//    /**
//     * Step 1: User Login
//     *
//     * Request:
//     * POST /api/auth/login
//     * Content-Type: application/json
//     *
//     * Body:
//     * {
//     *   "email": "student@school.edu.vn",
//     *   "password": "secure_password_123"
//     * }
//     *
//     * Response (200 OK):
//     * {
//     *   "data": {
//     *     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
//     *     "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
//     *     "tokenType": "Bearer",
//     *     "expiresIn": 3600,
//     *     "user": {
//     *       "id": "550e8400-e29b-41d4-a716-446655440000",
//     *       "email": "student@school.edu.vn",
//     *       "fullName": "John Doe",
//     *       "role": "STUDENT",
//     *       "roles": ["STUDENT"],
//     *       "active": true,
//     *       "createdAt": "2026-03-18T10:00:00+07:00"
//     *     }
//     *   },
//     *   "message": "Login successful",
//     *   "status": 200,
//     *   "timestamp": "2026-03-18T10:30:00+07:00"
//     * }
//     *
//     * Error Response (401 Unauthorized):
//     * {
//     *   "message": "Invalid email or password",
//     *   "status": 401,
//     *   "timestamp": "2026-03-18T10:30:00+07:00"
//     * }
//     */
//    public void loginExample() {
//        /*
//        curl -X POST http://localhost:8080/api/auth/login \
//          -H "Content-Type: application/json" \
//          -d '{
//            "email": "student@school.edu.vn",
//            "password": "secure_password_123"
//          }'
//        */
//    }
//
//    /**
//     * Step 2: Call Protected API with JWT Token
//     *
//     * Use the accessToken from login response in Authorization header
//     *
//     * Request:
//     * GET /api/students/me
//     * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
//     *
//     * Example curl:
//     */
//    public void callProtectedApiExample(String accessToken) {
//        /*
//        curl -X GET http://localhost:8080/api/students/me \
//          -H "Authorization: Bearer ${ACCESS_TOKEN}"
//        */
//    }
//
//    /**
//     * Step 3: Refresh Expired Token
//     *
//     * When access token expires (after 1 hour by default),
//     * use the refresh token to get a new access token
//     *
//     * Request:
//     * POST /api/auth/refresh-token
//     * Content-Type: application/json
//     *
//     * Body:
//     * {
//     *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
//     * }
//     *
//     * Response (200 OK):
//     * {
//     *   "data": {
//     *     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // NEW
//     *     "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // SAME
//     *     "tokenType": "Bearer",
//     *     "expiresIn": 3600,
//     *     "user": {...}
//     *   },
//     *   "message": "Token refreshed successfully",
//     *   "status": 200,
//     *   "timestamp": "2026-03-18T10:30:00+07:00"
//     * }
//     */
//    public void refreshTokenExample() {
//        /*
//        curl -X POST http://localhost:8080/api/auth/refresh-token \
//          -H "Content-Type: application/json" \
//          -d '{
//            "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
//          }'
//        */
//    }
//
//    /**
//     * Step 4: User Registration
//     *
//     * Request:
//     * POST /api/auth/register
//     * Content-Type: application/json
//     *
//     * Body:
//     * {
//     *   "email": "newuser@school.edu.vn",
//     *   "password": "secure_password_123",
//     *   "confirmPassword": "secure_password_123",
//     *   "fullName": "Jane Smith",
//     *   "role": "STUDENT"
//     * }
//     *
//     * Response (201 Created): Same as login response
//     *
//     * Valid roles: ADMIN, TEACHER, STUDENT, PARENT, STAFF
//     */
//    public void registerExample() {
//        /*
//        curl -X POST http://localhost:8080/api/auth/register \
//          -H "Content-Type: application/json" \
//          -d '{
//            "email": "newuser@school.edu.vn",
//            "password": "secure_password_123",
//            "confirmPassword": "secure_password_123",
//            "fullName": "Jane Smith",
//            "role": "STUDENT"
//          }'
//        */
//    }
//
//    /**
//     * ========== ROLE-BASED ACCESS CONTROL EXAMPLES ==========
//     */
//
//    /**
//     * Example 1: Admin-only endpoint
//     * Only users with ADMIN role can access this
//     *
//     * If non-admin tries to access, gets 403 Forbidden
//     */
//    @RequireRole({"ADMIN"})
//    @DeleteMapping("/api/admin/users/{id}")
//    public ResponseEntity<?> deleteUser(@PathVariable String id) {
//        /*
//        // This method can only be called by ADMIN users
//        // Spring Security will check user role before executing this method
//        // If user role is not ADMIN, throws CustomException with 403 status
//
//        return ResponseEntity.ok("User deleted");
//        */
//        return null;
//    }
//
//    /**
//     * Example 2: Teacher-only endpoint
//     * Can be accessed by TEACHER role only
//     */
//    @RequireRole({"TEACHER"})
//    @PostMapping("/api/teachers/grades/submit")
//    public ResponseEntity<?> submitGrades() {
//        /*
//        // Only TEACHER can submit grades
//        return ResponseEntity.ok("Grades submitted");
//        */
//        return null;
//    }
//
//    /**
//     * Example 3: Multiple roles allowed
//     * Can be accessed by ADMIN or TEACHER
//     */
//    @RequireRole({"ADMIN", "TEACHER"})
//    @GetMapping("/api/students")
//    public ResponseEntity<?> listStudents() {
//        /*
//        // Both ADMIN and TEACHER can view student list
//        return ResponseEntity.ok(students);
//        */
//        return null;
//    }
//
//    /**
//     * Example 4: Parent-specific endpoint
//     * Parents can only view their own children's information
//     */
//    @RequireRole({"PARENT"})
//    @GetMapping("/api/parents/children")
//    public ResponseEntity<?> listMyChildren() {
//        /*
//        // PARENT can only see their own children
//        return ResponseEntity.ok(myChildren);
//        */
//        return null;
//    }
//
//    /**
//     * Example 5: Public endpoint
//     * No authentication required (no @RequireRole)
//     */
//    @PostMapping("/api/health")
//    public ResponseEntity<?> health() {
//        /*
//        // No @RequireRole annotation = public endpoint
//        return ResponseEntity.ok("OK");
//        */
//        return null;
//    }
//
//    /**
//     * ========== FRONTEND IMPLEMENTATION EXAMPLES ==========
//     */
//
//    /**
//     * JavaScript/React Example: Complete Login Flow
//     *
//     * // 1. Login request
//     * const loginResponse = await fetch('http://localhost:8080/api/auth/login', {
//     *   method: 'POST',
//     *   headers: { 'Content-Type': 'application/json' },
//     *   body: JSON.stringify({
//     *     email: 'user@school.edu.vn',
//     *     password: 'password123'
//     *   })
//     * });
//     *
//     * const { data } = await loginResponse.json();
//     *
//     * // 2. Store tokens
//     * localStorage.setItem('accessToken', data.accessToken);
//     * localStorage.setItem('refreshToken', data.refreshToken);
//     *
//     * // 3. Call protected API with token
//     * const apiResponse = await fetch('http://localhost:8080/api/students/me', {
//     *   headers: {
//     *     'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
//     *   }
//     * });
//     *
//     * // 4. Handle token expiration
//     * if (apiResponse.status === 401) {
//     *   // Token expired, refresh it
//     *   const refreshResponse = await fetch('http://localhost:8080/api/auth/refresh-token', {
//     *     method: 'POST',
//     *     headers: { 'Content-Type': 'application/json' },
//     *     body: JSON.stringify({
//     *       refreshToken: localStorage.getItem('refreshToken')
//     *     })
//     *   });
//     *
//     *   const { data } = await refreshResponse.json();
//     *   localStorage.setItem('accessToken', data.accessToken);
//     *
//     *   // Retry original request
//     *   const retryResponse = await fetch('http://localhost:8080/api/students/me', {
//     *     headers: {
//     *       'Authorization': `Bearer ${data.accessToken}`
//     *     }
//     *   });
//     * }
//     *
//     * // 5. Logout
//     * localStorage.removeItem('accessToken');
//     * localStorage.removeItem('refreshToken');
//     */
//    public void javascriptFrontendExample() {
//    }
//
//    /**
//     * ========== TOKEN MANAGEMENT ==========
//     */
//
//    /**
//     * Access Token Expiration
//     * Default: 3600 seconds (1 hour)
//     * Configurable in application.properties:
//     *
//     * app.jwt.expiration=3600
//     */
//    public void accessTokenTtl() {
//    }
//
//    /**
//     * Refresh Token Expiration
//     * Default: 604800 seconds (7 days)
//     * Configurable in application.properties:
//     *
//     * app.jwt.refresh.expiration=604800
//     */
//    public void refreshTokenTtl() {
//    }
//
//    /**
//     * JWT Secret Key
//     * Default: configured in application.properties
//     *
//     * app.jwt.secret=my-super-secret-key-that-needs-to-be-at-least-256-bits-long
//     *
//     * IMPORTANT: Use strong secret in production!
//     * Minimum 256 bits (32 bytes) for HS512
//     */
//    public void jwtSecretKey() {
//    }
//
//    /**
//     * ========== ERROR SCENARIOS ==========
//     */
//
//    /**
//     * Error 1: Invalid Credentials
//     * Status: 401 Unauthorized
//     *
//     * POST /api/auth/login
//     * Body: { "email": "user@school.edu.vn", "password": "wrong_password" }
//     *
//     * Response:
//     * {
//     *   "message": "Invalid email or password",
//     *   "status": 401,
//     *   "timestamp": "2026-03-18T10:30:00+07:00"
//     * }
//     */
//    public void errorInvalidCredentials() {
//    }
//
//    /**
//     * Error 2: Missing Authorization Header
//     * Status: 401 Unauthorized
//     *
//     * GET /api/students/me
//     * (no Authorization header)
//     *
//     * Response:
//     * {
//     *   "message": "Unauthorized",
//     *   "status": 401,
//     *   "timestamp": "2026-03-18T10:30:00+07:00"
//     * }
//     */
//    public void errorMissingToken() {
//    }
//
//    /**
//     * Error 3: Expired Token
//     * Status: 401 Unauthorized
//     *
//     * GET /api/students/me
//     * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (expired)
//     *
//     * Response:
//     * {
//     *   "message": "Unauthorized",
//     *   "status": 401,
//     *   "timestamp": "2026-03-18T10:30:00+07:00"
//     * }
//     *
//     * Solution: Use refresh token to get new access token
//     */
//    public void errorExpiredToken() {
//    }
//
//    /**
//     * Error 4: Insufficient Permission
//     * Status: 403 Forbidden
//     *
//     * DELETE /api/admin/users/123
//     * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (STUDENT role)
//     *
//     * Response:
//     * {
//     *   "message": "Access denied. Required roles: ADMIN",
//     *   "status": 403,
//     *   "timestamp": "2026-03-18T10:30:00+07:00"
//     * }
//     */
//    public void errorInsufficientPermission() {
//    }
//
//    /**
//     * Error 5: Email Already Exists
//     * Status: 409 Conflict
//     *
//     * POST /api/auth/register
//     * Body: { "email": "existing@school.edu.vn", ... }
//     *
//     * Response:
//     * {
//     *   "message": "Email already exists",
//     *   "status": 409,
//     *   "timestamp": "2026-03-18T10:30:00+07:00"
//     * }
//     */
//    public void errorEmailExists() {
//    }
//
//    /**
//     * ========== SECURITY BEST PRACTICES ==========
//     *
//     * 1. ALWAYS use HTTPS in production
//     *    - JWT tokens contain sensitive user info
//     *    - Prevents token interception
//     *
//     * 2. Store tokens securely on frontend
//     *    - localStorage: Simple but vulnerable to XSS
//     *    - httpOnly cookies: Better (not accessible to JS)
//     *    - sessionStorage: Cleared when tab closes
//     *
//     * 3. Implement token refresh logic
//     *    - Use short-lived access tokens (1 hour)
//     *    - Refresh silently before expiration
//     *    - Show login screen if refresh fails
//     *
//     * 4. Validate token expiration
//     *    - Check token expiration time before using
//     *    - Refresh if close to expiration
//     *
//     * 5. Use strong passwords
//     *    - Minimum 8 characters recommended
//     *    - Mix of upper, lower, numbers, symbols
//     *    - Enforce on client and server
//     *
//     * 6. Implement rate limiting
//     *    - Limit login attempts per IP
//     *    - Prevent brute force attacks
//     *
//     * 7. Log authentication events
//     *    - Log successful logins
//     *    - Log failed attempts
//     *    - Monitor for suspicious patterns
//     *
//     * 8. Token blacklisting for logout
//     *    - Optional: blacklist tokens on logout
//     *    - Useful for immediate logout on server side
//     *
//     * 9. CORS configuration
//     *    - Restrict to trusted origins only
//     *    - Never use "*" in production
//     *
//     * 10. Secret key management
//     *    - Use strong random secret (256+ bits)
//     *    - Rotate periodically
//     *    - Never commit to version control
//     *    - Use environment variables
//     */
//    public void securityBestPractices() {
//    }
//}

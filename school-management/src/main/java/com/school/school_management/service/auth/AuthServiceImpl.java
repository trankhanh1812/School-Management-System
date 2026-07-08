package com.school.school_management.service.auth;

import com.school.school_management.dto.auth.ForgotPasswordRequest;
import com.school.school_management.dto.auth.LoginRequest;
import com.school.school_management.dto.auth.LoginResponse;
import com.school.school_management.dto.auth.RefreshTokenRequest;
import com.school.school_management.dto.auth.RegisterRequest;
import com.school.school_management.dto.auth.ResetPasswordRequest;
import com.school.school_management.entity.PasswordResetToken;
import com.school.school_management.entity.Role;
import com.school.school_management.entity.Student;
import com.school.school_management.entity.Teacher;
import com.school.school_management.entity.User;
import com.school.school_management.entity.UserRole;
import com.school.school_management.exception.CustomException;
import com.school.school_management.repository.PasswordResetTokenRepository;
import com.school.school_management.repository.RoleRepository;
import com.school.school_management.repository.StudentRepository;
import com.school.school_management.repository.UserRepository;
import com.school.school_management.security.JwtProvider;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private static final String ACTIVE_STATUS = "ACTIVE";

    private final AuthenticationManager authenticationManager;
    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final StudentRepository studentRepository;

    public AuthServiceImpl(
            AuthenticationManager authenticationManager,
            JwtProvider jwtProvider,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            RoleRepository roleRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            StudentRepository studentRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtProvider = jwtProvider;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.roleRepository = roleRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.studentRepository = studentRepository;
    }

    @Override
    public LoginResponse login(LoginRequest loginRequest) {
        String identifier = loginRequest.getUsername();
        log.debug("Login attempt for identifier: {}", identifier);

        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(identifier, loginRequest.getPassword())
            );

            User user = getActiveUserByEmail(authentication.getName());
            // Ghi mốc đăng nhập gần nhất (trước đây cột last_login_at không bao giờ được cập nhật).
            user.setLastLoginAt(OffsetDateTime.now());
            userRepository.save(user);
            String accessToken = jwtProvider.generateAccessToken(authentication);
            String refreshToken = jwtProvider.generateRefreshToken(user.getEmail());

            return buildLoginResponse(user, accessToken, refreshToken);
        } catch (AuthenticationException ex) {
            log.warn("Login failed for identifier: {}", identifier);
            throw new CustomException("Tên người dùng hoặc mật khẩu không đúng", 401);
        }
    }

    @Override
    public LoginResponse register(RegisterRequest registerRequest) {
        if (!registerRequest.getPassword().equals(registerRequest.getConfirmPassword())) {
            throw new CustomException("Passwords do not match", 400);
        }

        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new CustomException("Email already exists", 409);
        }

        // Self-registration is ALWAYS a STUDENT account. Privileged roles
        // (ADMIN/TEACHER/PARENT/STAFF) must be provisioned by an ADMIN through the
        // admin user-management flow — never chosen by an anonymous caller.
        // The client-supplied registerRequest.getRole() is intentionally ignored.
        Role role = getOrCreateRole(com.school.school_management.enums.UserRole.STUDENT);

        User user = User.builder()
            .username(buildUsername(registerRequest.getEmail()))
            .email(registerRequest.getEmail().trim().toLowerCase(Locale.ROOT))
            .passwordHash(passwordEncoder.encode(registerRequest.getPassword()))
            .fullName(registerRequest.getFullName().trim())
            .status(ACTIVE_STATUS)
            .build();

        user.getUserRoles().add(UserRole.builder().user(user).role(role).build());
        User savedUser = userRepository.save(user);

        // Tài khoản tự đăng ký luôn là HỌC SINH → tạo hồ sơ students tối thiểu
        // (chưa xếp lớp; ADMIN sẽ bổ sung lớp/năm học sau). Trước đây register chỉ
        // tạo users + user_roles nên học sinh tự đăng ký thiếu hồ sơ students.
        createStudentProfileFor(savedUser);

        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(registerRequest.getEmail(), registerRequest.getPassword())
            );
            String accessToken = jwtProvider.generateAccessToken(authentication);
            String refreshToken = jwtProvider.generateRefreshToken(savedUser.getEmail());
            log.info("User {} registered successfully", savedUser.getEmail());
            return buildLoginResponse(savedUser, accessToken, refreshToken);
        } catch (AuthenticationException ex) {
            log.warn("Auth failed after registration for {}", registerRequest.getEmail());
            String accessToken = jwtProvider.generateAccessToken(savedUser.getEmail());
            String refreshToken = jwtProvider.generateRefreshToken(savedUser.getEmail());
            return buildLoginResponse(savedUser, accessToken, refreshToken);
        }
    }

    /**
     * Tạo hồ sơ students tối thiểu gắn với tài khoản vừa đăng ký (chưa xếp lớp).
     * Tách tên: từ cuối là tên (firstName), phần còn lại là họ + đệm (lastName).
     * Mã HS suy từ id user để bảo đảm duy nhất.
     */
    private void createStudentProfileFor(User user) {
        String fullName = user.getFullName() != null ? user.getFullName().trim() : "";
        String firstName = fullName;
        String lastName = "";
        int lastSpace = fullName.lastIndexOf(' ');
        if (lastSpace > 0) {
            lastName = fullName.substring(0, lastSpace).trim();
            firstName = fullName.substring(lastSpace + 1).trim();
        }
        String code = "HS" + user.getId().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
        studentRepository.save(Student.builder()
            .user(user)
            .studentCode(code)
            .firstName(firstName)
            .lastName(lastName)
            .status(ACTIVE_STATUS)
            .build());
    }

    @Override
    public LoginResponse refreshToken(RefreshTokenRequest refreshTokenRequest) {
        String refreshToken = refreshTokenRequest.getRefreshToken();
        if (!jwtProvider.validateToken(refreshToken)) {
            throw new CustomException("Invalid or expired refresh token", 401);
        }
        User user = getActiveUserByEmail(jwtProvider.getEmailFromToken(refreshToken));
        String newAccessToken = jwtProvider.generateAccessToken(user.getEmail());
        return buildLoginResponse(user, newAccessToken, refreshToken);
    }

    @Override
    @Transactional(readOnly = true)
    public LoginResponse.UserInfo getCurrentUser(String email) {
        return buildUserInfo(getActiveUserByEmail(email));
    }

    @Override
    public String forgotPassword(ForgotPasswordRequest forgotPasswordRequest) {
        String email = forgotPasswordRequest.getEmail().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmail(email).filter(this::isActiveUser).orElse(null);
        if (user == null) return null;

        passwordResetTokenRepository.deleteByUser_Id(user.getId());
        String token = UUID.randomUUID().toString().replace("-", "");
        passwordResetTokenRepository.save(PasswordResetToken.builder()
            .user(user).token(token)
            .expiresAt(OffsetDateTime.now().plusMinutes(30))
            .build());
        log.info("Created password reset token for {}", email);
        // Token is delivered out-of-band (email in production); available here only
        // for server-side logging/dev. It MUST NOT be returned to the HTTP client.
        log.debug("Password reset token for {}: {}", email, token);
        return token;
    }

    @Override
    public void resetPassword(ResetPasswordRequest resetPasswordRequest) {
        if (!resetPasswordRequest.getPassword().equals(resetPasswordRequest.getConfirmPassword())) {
            throw new CustomException("Passwords do not match", 400);
        }
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(resetPasswordRequest.getToken())
            .orElseThrow(() -> new CustomException("Reset token is invalid", 400));
        if (resetToken.getUsedAt() != null) throw new CustomException("Reset token has already been used", 400);
        if (resetToken.getExpiresAt().isBefore(OffsetDateTime.now())) throw new CustomException("Reset token has expired", 400);

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(resetPasswordRequest.getPassword()));
        user.setStatus(ACTIVE_STATUS);
        resetToken.setUsedAt(OffsetDateTime.now());
        userRepository.save(user);
        passwordResetTokenRepository.save(resetToken);
        log.info("Password reset successful for {}", user.getEmail());
    }

    @Override
    public void logout(String token) {
        if (token != null && jwtProvider.validateToken(token)) {
            log.info("User {} logged out", jwtProvider.getEmailFromToken(token));
        }
    }

    @Override
    public void changePasswordFirstLogin(String currentUserEmail, String newPassword) {
        if (newPassword == null || newPassword.trim().length() < 6) {
            throw new CustomException("Mật khẩu mới phải có ít nhất 6 ký tự", 400);
        }
        User user = getActiveUserByEmail(currentUserEmail);
        if (!user.isForcePasswordChange()) {
            throw new CustomException("Tài khoản không yêu cầu đổi mật khẩu lần đầu", 400);
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword.trim()));
        user.setForcePasswordChange(false);
        userRepository.save(user);
        log.info("First-login password changed for {}", currentUserEmail);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private LoginResponse buildLoginResponse(User user, String accessToken, String refreshToken) {
        return LoginResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .expiresIn(jwtProvider.getAccessTokenExpirationSeconds())
            .user(buildUserInfo(user))
            .build();
    }

    private LoginResponse.UserInfo buildUserInfo(User user) {
        List<String> roles = user.getUserRoles().stream()
            .map(UserRole::getRole)
            .filter(r -> r != null && r.getCode() != null)
            .map(Role::getCode)
            .map(c -> c.toUpperCase(Locale.ROOT))
            .distinct().sorted().collect(Collectors.toList());

        String primaryRole = roles.stream()
            .min(Comparator.comparingInt(this::rolePriority))
            .orElse("STUDENT");

        var builder = LoginResponse.UserInfo.builder()
            .id(user.getId())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .role(primaryRole)
            .roles(roles.isEmpty() ? List.of("STUDENT") : roles)
            .active(isActiveUser(user))
            .createdAt(user.getCreatedAt())
            .forcePasswordChange(user.isForcePasswordChange());

        if ("TEACHER".equals(primaryRole) && user.getTeacher() != null) {
            Teacher teacher = user.getTeacher();
            builder.departmentLevel(teacher.getDepartmentLevel())
                .departmentCode(teacher.getDepartment() != null ? teacher.getDepartment().getCode() : null)
                .departmentName(teacher.getDepartment() != null ? teacher.getDepartment().getName() : null);
        }

        return builder.build();
    }

    private User getActiveUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new CustomException("User not found", 404));
        if (!isActiveUser(user)) throw new CustomException("User account is inactive", 403);
        return user;
    }

    private boolean isActiveUser(User user) {
        return user.getDeletedAt() == null && ACTIVE_STATUS.equalsIgnoreCase(user.getStatus());
    }

    private Role getOrCreateRole(com.school.school_management.enums.UserRole requestedRole) {
        String code = requestedRole.name();
        return roleRepository.findByCode(code).orElseGet(() ->
            roleRepository.save(Role.builder()
                .code(code).name(requestedRole.getDisplayName())
                .description("System role " + code).build()));
    }

    private String buildUsername(String email) {
        String normalized = email.trim().toLowerCase(Locale.ROOT);
        int atIndex = normalized.indexOf("@");
        return atIndex > 0 ? normalized.substring(0, atIndex) : normalized;
    }

    private int rolePriority(String roleCode) {
        try { return com.school.school_management.enums.UserRole.fromString(roleCode).getPriority(); }
        catch (Exception ex) { return Integer.MAX_VALUE; }
    }
}

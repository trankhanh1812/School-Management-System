package com.school.school_management.service;

import com.school.school_management.entity.User;
import com.school.school_management.entity.UserRole;
import com.school.school_management.repository.UserRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Tìm user theo username trước (CCCD, phone, studentCode),
     * nếu không tìm thấy thì fallback tìm theo email.
     * Spring Security gọi method này với giá trị từ trường "username" của form.
     */
    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        String normalized = identifier == null ? "" : identifier.trim();

        User user = userRepository.findByUsernameAndDeletedAtIsNull(normalized)
            .or(() -> userRepository.findByEmail(normalized.toLowerCase(Locale.ROOT)))
            .orElseThrow(() -> new UsernameNotFoundException(
                "Không tìm thấy tài khoản: " + normalized));

        if (user.getDeletedAt() != null || !"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new UsernameNotFoundException("Tài khoản không hoạt động: " + normalized);
        }

        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        for (UserRole userRole : user.getUserRoles()) {
            if (userRole.getRole() != null && userRole.getRole().getCode() != null) {
                authorities.add(new SimpleGrantedAuthority(
                    "ROLE_" + userRole.getRole().getCode().toUpperCase(Locale.ROOT)
                ));
            }
        }

        if (authorities.isEmpty()) {
            log.warn("User {} has no roles assigned", normalized);
            throw new UsernameNotFoundException("Tài khoản chưa được gán vai trò: " + normalized);
        }

        log.debug("Loaded auth for {} with roles: {}", normalized, authorities);

        // Spring Security dùng email làm principal (để JWT và SecurityContext nhất quán)
        return org.springframework.security.core.userdetails.User.builder()
            .username(user.getEmail())
            .password(user.getPasswordHash())
            .authorities(authorities)
            .accountExpired(false)
            .accountLocked(false)
            .credentialsExpired(false)
            .disabled(false)
            .build();
    }
}

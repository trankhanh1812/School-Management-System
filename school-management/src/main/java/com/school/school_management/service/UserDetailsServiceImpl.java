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

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        if (user.getDeletedAt() != null || !"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new UsernameNotFoundException("User account is inactive: " + email);
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
            log.warn("User {} has no roles assigned in database", email);
            throw new UsernameNotFoundException("User has no assigned roles: " + email);
        }

        log.debug("Loaded auth details for {} with roles: {}", email, authorities);

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

package com.school.school_management.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Extracts the real client IP from X-Forwarded-For (set by reverse proxies / ngrok)
 * and stores it as a request attribute so service-layer code can read it without
 * depending on HttpServletRequest directly.
 */
@Component
@Order(1)
public class ClientIpFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank()) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isBlank()) {
            ip = request.getRemoteAddr();
        }

        // X-Forwarded-For may contain a comma-separated list; take the first (original client)
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }

        request.setAttribute("clientIp", ip != null ? ip : "");
        filterChain.doFilter(request, response);
    }
}

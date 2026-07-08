package com.school.school_management.config;

import com.school.school_management.repository.UserRepository;
import com.school.school_management.security.JwtProvider;
import java.util.Locale;
import java.util.Map;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Extracts the JWT from the {@code ?token=} query parameter during the WebSocket
 * handshake and, if valid, stashes the resolved user in the session attributes.
 * The {@link StompAuthChannelInterceptor} then uses this as a fallback when the
 * CONNECT frame carries no {@code token} header. This never rejects the handshake
 * itself — final authentication/authorisation happens on the CONNECT/SUBSCRIBE frames.
 */
@Component
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;

    public JwtHandshakeInterceptor(JwtProvider jwtProvider, UserRepository userRepository) {
        this.jwtProvider = jwtProvider;
        this.userRepository = userRepository;
    }

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) {
        String token = UriComponentsBuilder.fromUri(request.getURI())
            .build().getQueryParams().getFirst("token");
        if (token != null && jwtProvider.validateToken(token)) {
            String email = jwtProvider.getEmailFromToken(token);
            if (email != null) {
                userRepository.findByEmail(email.trim().toLowerCase(Locale.ROOT))
                    .ifPresent(user -> {
                        attributes.put("userId", user.getId().toString());
                        attributes.put("userEmail", user.getEmail());
                    });
            }
        }
        return true;
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception) {
        // no-op
    }
}

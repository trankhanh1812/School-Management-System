package com.school.school_management.websocket.notification;

import com.school.school_management.entity.User;
import com.school.school_management.repository.UserRepository;
import com.school.school_management.security.JwtProvider;
import java.net.URI;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;
    private final NotificationWebSocketSessionRegistry sessionRegistry;

    public NotificationWebSocketHandler(
            JwtProvider jwtProvider,
            UserRepository userRepository,
            NotificationWebSocketSessionRegistry sessionRegistry) {
        this.jwtProvider = jwtProvider;
        this.userRepository = userRepository;
        this.sessionRegistry = sessionRegistry;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        User user = authenticate(session.getUri());
        if (user == null) {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("Invalid or missing token"));
            return;
        }

        session.getAttributes().put("userId", user.getId());
        sessionRegistry.register(user.getId(), session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        if (message.getPayload() != null && "ping".equalsIgnoreCase(message.getPayload().trim())) {
            session.sendMessage(new TextMessage("pong"));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessionRegistry.unregister(session);
    }

    private User authenticate(URI uri) {
        if (uri == null) {
            return null;
        }

        String token = UriComponentsBuilder.fromUri(uri).build().getQueryParams().getFirst("token");
        if (token == null || token.isBlank() || !jwtProvider.validateToken(token)) {
            return null;
        }

        String email = jwtProvider.getEmailFromToken(token);
        if (email == null || email.isBlank()) {
            return null;
        }

        return userRepository.findByEmail(email)
            .filter(user -> user.getDeletedAt() == null && "ACTIVE".equalsIgnoreCase(user.getStatus()))
            .orElse(null);
    }
}
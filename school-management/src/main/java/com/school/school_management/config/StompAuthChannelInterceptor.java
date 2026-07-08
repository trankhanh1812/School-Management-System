package com.school.school_management.config;

import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import com.school.school_management.entity.User;
import com.school.school_management.repository.ChatGroupMemberRepository;
import com.school.school_management.repository.UserRepository;
import com.school.school_management.security.JwtProvider;
import com.school.school_management.websocket.StompPrincipal;

/**
 * Authenticates the STOMP CONNECT frame with a JWT and authorises every SUBSCRIBE.
 *
 * <p>Without this, the {@code /ws} broker was open: any client could connect
 * unauthenticated and subscribe to {@code /topic/notifications/{userId}} or
 * {@code /topic/chat/{groupId}} for any id, reading other users' notifications and
 * chat history. The token is read from the CONNECT native header {@code token}
 * (sent by the frontend as a STOMP connect header), falling back to the value the
 * handshake interceptor extracted from the {@code ?token=} query parameter.
 */
@Component
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private static final String NOTIF_PREFIX = "/topic/notifications/";
    private static final String CHAT_PREFIX = "/topic/chat/";
    private static final String SESSION_USER_ID = "userId";
    private static final String SESSION_USER_EMAIL = "userEmail";

    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;
    private final ChatGroupMemberRepository chatGroupMemberRepository;

    public StompAuthChannelInterceptor(
            JwtProvider jwtProvider,
            UserRepository userRepository,
            ChatGroupMemberRepository chatGroupMemberRepository) {
        this.jwtProvider = jwtProvider;
        this.userRepository = userRepository;
        this.chatGroupMemberRepository = chatGroupMemberRepository;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
            MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            authenticate(accessor);
        } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            authorizeSubscription(accessor);
        }
        return message;
    }

    private void authenticate(StompHeaderAccessor accessor) {
        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        String token = firstNonBlank(
            accessor.getFirstNativeHeader("token"),
            stripBearer(accessor.getFirstNativeHeader("Authorization")));

        // Fall back to a token/user resolved by the handshake interceptor (query param).
        if (token == null && sessionAttributes != null && sessionAttributes.get(SESSION_USER_ID) != null) {
            accessor.setUser(new StompPrincipal(String.valueOf(sessionAttributes.get(SESSION_USER_EMAIL))));
            return;
        }

        if (token == null || !jwtProvider.validateToken(token)) {
            throw new MessageDeliveryException("Unauthorized WebSocket connection");
        }

        String email = jwtProvider.getEmailFromToken(token);
        Optional<User> user = userRepository.findByEmail(email == null ? null
            : email.trim().toLowerCase(Locale.ROOT));
        if (user.isEmpty()) {
            throw new MessageDeliveryException("Unauthorized WebSocket connection");
        }

        accessor.setUser(new StompPrincipal(user.get().getEmail()));
        if (sessionAttributes != null) {
            sessionAttributes.put(SESSION_USER_ID, user.get().getId().toString());
            sessionAttributes.put(SESSION_USER_EMAIL, user.get().getEmail());
        }
    }

    private void authorizeSubscription(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        String userId = sessionAttributes == null ? null
            : (String) sessionAttributes.get(SESSION_USER_ID);
        if (destination == null || userId == null) {
            throw new MessageDeliveryException("Forbidden subscription");
        }

        if (destination.startsWith(NOTIF_PREFIX)) {
            // Only the owner may subscribe to their own notification stream.
            String target = destination.substring(NOTIF_PREFIX.length());
            if (!userId.equals(target)) {
                throw new MessageDeliveryException("Forbidden subscription");
            }
        } else if (destination.startsWith(CHAT_PREFIX)) {
            // Only members of a chat group may subscribe to its live stream.
            String groupId = destination.substring(CHAT_PREFIX.length());
            if (!isGroupMember(groupId, userId)) {
                throw new MessageDeliveryException("Forbidden subscription");
            }
        }
        // Other destinations (/user/**, /queue/**) are allowed for authenticated sessions.
    }

    private boolean isGroupMember(String groupId, String userId) {
        try {
            return chatGroupMemberRepository.existsByChatGroupIdAndUserId(
                UUID.fromString(groupId), UUID.fromString(userId));
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    private static String stripBearer(String value) {
        if (value == null) {
            return null;
        }
        return value.startsWith("Bearer ") ? value.substring("Bearer ".length()) : value;
    }

    private static String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank()) {
            return a;
        }
        return (b != null && !b.isBlank()) ? b : null;
    }
}

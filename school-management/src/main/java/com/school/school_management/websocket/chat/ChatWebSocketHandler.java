package com.school.school_management.websocket.chat;

import java.net.URI;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.school_management.dto.chat.ChatWebSocketMessage;
import com.school.school_management.entity.User;
import com.school.school_management.repository.ChatGroupMemberRepository;
import com.school.school_management.repository.UserRepository;
import com.school.school_management.security.JwtProvider;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;
    private final ChatGroupMemberRepository chatGroupMemberRepository;
    private final ObjectMapper objectMapper;
    private final ConcurrentHashMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    public ChatWebSocketHandler(
        JwtProvider jwtProvider,
        UserRepository userRepository,
        ChatGroupMemberRepository chatGroupMemberRepository,
        ObjectMapper objectMapper
    ) {
        this.jwtProvider = jwtProvider;
        this.userRepository = userRepository;
        this.chatGroupMemberRepository = chatGroupMemberRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        User user = authenticate(session.getUri());
        if (user == null) {
            session.close();
            return;
        }

        String sessionKey = user.getId().toString();
        session.getAttributes().put("userId", user.getId());
        sessions.put(sessionKey, session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            ChatWebSocketMessage wsMessage = objectMapper.readValue(message.getPayload(), ChatWebSocketMessage.class);
            
            // Validate sender
            UUID userId = (UUID) session.getAttributes().get("userId");
            if (!userId.equals(wsMessage.getSenderId())) {
                session.sendMessage(new TextMessage("{\"error\": \"Unauthorized sender\"}"));
                return;
            }

            // Handle action
            if ("send_message".equals(wsMessage.getAction())) {
                broadcastToGroup(wsMessage);
            } else if ("typing".equals(wsMessage.getAction())) {
                broadcastTypingIndicator(wsMessage);
            } else if ("read_message".equals(wsMessage.getAction())) {
                broadcastReadReceipt(wsMessage);
            }
        } catch (Exception e) {
            session.sendMessage(new TextMessage("{\"error\": \"" + e.getMessage() + "\"}"));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, org.springframework.web.socket.CloseStatus status) throws Exception {
        UUID userId = (UUID) session.getAttributes().get("userId");
        if (userId != null) {
            sessions.remove(userId.toString());
        }
    }

    private void broadcastToGroup(ChatWebSocketMessage message) throws Exception {
        sendToGroupMembers(message.getChatGroupId(), objectMapper.writeValueAsString(message));
    }

    private void broadcastTypingIndicator(ChatWebSocketMessage message) throws Exception {
        message.setAction("user_typing");
        sendToGroupMembers(message.getChatGroupId(), objectMapper.writeValueAsString(message));
    }

    private void broadcastReadReceipt(ChatWebSocketMessage message) throws Exception {
        message.setAction("message_read");
        sendToGroupMembers(message.getChatGroupId(), objectMapper.writeValueAsString(message));
    }

    /**
     * Deliver a payload only to connected sessions whose user is a member of the group.
     * Previously every event was sent to all sessions, leaking messages/typing/read
     * receipts to users who were not in the group.
     */
    private void sendToGroupMembers(UUID groupId, String payload) throws Exception {
        if (groupId == null) {
            return;
        }
        for (WebSocketSession session : sessions.values()) {
            if (!session.isOpen()) {
                continue;
            }
            UUID sessionUserId = (UUID) session.getAttributes().get("userId");
            if (sessionUserId != null
                    && chatGroupMemberRepository.existsByChatGroupIdAndUserId(groupId, sessionUserId)) {
                session.sendMessage(new TextMessage(payload));
            }
        }
    }

    private User authenticate(URI uri) {
        String token = UriComponentsBuilder.fromUri(uri)
            .build()
            .getQueryParams()
            .getFirst("token");

        if (token == null) {
            return null;
        }

        if (!jwtProvider.validateToken(token)) {
            return null;
        }

        String username = jwtProvider.getUsernameFromToken(token);
        return userRepository.findByUsernameAndDeletedAtIsNull(username).orElse(null);
    }

    public void sendToUser(UUID userId, String message) throws Exception {
        WebSocketSession session = sessions.get(userId.toString());
        if (session != null && session.isOpen()) {
            session.sendMessage(new TextMessage(message));
        }
    }

    public void sendToGroup(UUID groupId, String message) throws Exception {
        sendToGroupMembers(groupId, message);
    }
}

package com.school.school_management.websocket;

import java.security.Principal;

/**
 * Simple {@link Principal} used to attach the authenticated user (by email) to a
 * STOMP WebSocket session once the CONNECT frame's JWT has been validated.
 */
public class StompPrincipal implements Principal {

    private final String name;

    public StompPrincipal(String name) {
        this.name = name;
    }

    @Override
    public String getName() {
        return name;
    }
}

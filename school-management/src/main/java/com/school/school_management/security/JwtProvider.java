package com.school.school_management.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * JwtProvider - Utility for JWT token generation, validation, and extraction
 * 
 * Handles:
 * - Generate access tokens (short-lived, default 1 hour)
 * - Generate refresh tokens (long-lived, default 7 days)
 * - Validate tokens
 * - Extract claims and user info from tokens
 * - Handle token expiration
 */
@Slf4j
@Component
public class JwtProvider {
    
    @Value("${app.jwt.secret:my-super-secret-key-that-needs-to-be-at-least-256-bits-long-for-security}")
    private String jwtSecret;
    
    @Value("${app.jwt.expiration:3600}")       // 1 hour
    private int jwtExpirationSeconds;
    
    @Value("${app.jwt.refresh.expiration:604800}")  // 7 days
    private int refreshTokenExpirationSeconds;

    /**
     * Generate access token from Authentication
     * Token contains username/email and roles
     */
    public String generateAccessToken(Authentication authentication) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();
        return generateAccessToken(userPrincipal.getUsername());
    }

    /**
     * Generate access token from username/email
     * Token lifetime: 1 hour (configurable)
     */
    public String generateAccessToken(String username) {
        return generateToken(username, jwtExpirationSeconds);
    }

    /**
     * Generate refresh token from username/email
     * Token lifetime: 7 days (configurable)
     */
    public String generateRefreshToken(String username) {
        return generateToken(username, refreshTokenExpirationSeconds);
    }

    /**
     * Generate token with custom expiration time
     * 
     * @param username email or username
     * @param expirationSeconds token lifetime in seconds
     * @return JWT token
     */
    private String generateToken(String username, int expirationSeconds) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("sub", username);
        claims.put("iat", System.currentTimeMillis());
        
        return Jwts.builder()
            .setClaims(claims)
            .setSubject(username)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + (long) expirationSeconds * 1000))
            .signWith(getSigningKey(), SignatureAlgorithm.HS512)
            .compact();
    }

    /**
     * Validate JWT token
     * Check signature, expiration, and format
     * 
     * @param token JWT token
     * @return true if token is valid, false otherwise
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token);
            
            log.debug("JWT token validated successfully");
            return true;
        } catch (io.jsonwebtoken.security.SignatureException e) {
            log.error("Invalid JWT signature: {}", e.getMessage());
        } catch (io.jsonwebtoken.MalformedJwtException e) {
            log.error("Invalid JWT token: {}", e.getMessage());
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            log.error("Expired JWT token: {}", e.getMessage());
        } catch (io.jsonwebtoken.UnsupportedJwtException e) {
            log.error("Unsupported JWT token: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("JWT claims string is empty: {}", e.getMessage());
        }
        return false;
    }

    /**
     * Extract username/email from JWT token
     * 
     * @param token JWT token
     * @return username or email
     */
    public String getUsernameFromToken(String token) {
        return getClaimFromToken(token, Claims::getSubject);
    }

    /**
     * Extract email from JWT token (alias for getUsernameFromToken)
     */
    public String getEmailFromToken(String token) {
        return getUsernameFromToken(token);
    }

    /**
     * Extract specific claim from JWT token
     * 
     * @param token JWT token
     * @param claimsResolver function to extract desired claim
     * @param <T> type of claim
     * @return claim value
     */
    public <T> T getClaimFromToken(String token, java.util.function.Function<Claims, T> claimsResolver) {
        final Claims claims = getAllClaimsFromToken(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Extract all claims from JWT token
     * 
     * @param token JWT token
     * @return Claims object containing all token data
     */
    private Claims getAllClaimsFromToken(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(getSigningKey())
            .build()
            .parseClaimsJws(token)
            .getBody();
    }

    /**
     * Check if token is expired
     * 
     * @param token JWT token
     * @return true if expired, false otherwise
     */
    public boolean isTokenExpired(String token) {
        try {
            final Date expiration = getClaimFromToken(token, Claims::getExpiration);
            return expiration.before(new Date());
        } catch (Exception e) {
            log.error("Error checking token expiration: {}", e.getMessage());
            return true;
        }
    }

    /**
     * Get time remaining until token expires (in seconds)
     * Returns 0 if token is already expired
     * 
     * @param token JWT token
     * @return seconds until expiration, or 0 if expired
     */
    public long getExpiresIn(String token) {
        try {
            final Date expiration = getClaimFromToken(token, Claims::getExpiration);
            long remainingMs = expiration.getTime() - System.currentTimeMillis();
            if (remainingMs <= 0) {
                return 0;
            }
            return remainingMs / 1000;  // Convert to seconds
        } catch (Exception e) {
            log.error("Error getting token expiration time: {}", e.getMessage());
            return 0;
        }
    }

    /**
     * Get the signing key for JWT
     * Uses HS512 algorithm with the secret key
     * 
     * @return SecretKey for signing JWT
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Extract Bearer token from Authorization header
     * 
     * Example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     * Returns: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     * 
     * @param authorizationHeader Authorization header value
     * @return JWT token without "Bearer " prefix, or null if invalid format
     */
    public String extractTokenFromHeader(String authorizationHeader) {
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            return authorizationHeader.substring("Bearer ".length());
        }
        return null;
    }

    /**
     * Get default access token expiration time in seconds
     */
    public int getAccessTokenExpirationSeconds() {
        return jwtExpirationSeconds;
    }

    /**
     * Get default refresh token expiration time in seconds
     */
    public int getRefreshTokenExpirationSeconds() {
        return refreshTokenExpirationSeconds;
    }
}

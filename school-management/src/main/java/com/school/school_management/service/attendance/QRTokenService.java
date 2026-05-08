package com.school.school_management.service.attendance;

import com.school.school_management.exception.CustomException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Manages short-lived JWT tokens embedded inside QR codes.
 *
 * These tokens are completely separate from the user auth JWT:
 *  - Signed with a dedicated secret (app.qr.secret)
 *  - Expire in 15 minutes
 *  - Carry only sessionId as the subject claim
 *
 * Flow:
 *  1. Teacher calls POST /api/attendance/qr/generate/{sessionId}
 *     → backend calls QRTokenService.generateToken(sessionId)
 *     → returns a signed JWT
 *  2. Frontend encodes the JWT into a URL:
 *       {appUrl}/attend?token=<jwt>
 *     and renders that URL as a QR image.
 *  3. Student scans QR with phone camera → opens URL in browser.
 *  4. Frontend calls POST /api/attendance/qr/confirm { token: <jwt> }
 *     → backend calls QRTokenService.extractSessionId(jwt) to verify & extract sessionId
 *     → creates attendance record.
 */
@Slf4j
@Service
public class QRTokenService {

    /** Dedicated secret for QR tokens — must be ≥ 256 bits (32 chars). */
    @Value("${app.qr.secret:qr-secret-key-must-be-at-least-256-bits-long-for-hs256-security-ok}")
    private String qrSecret;

    /** QR token lifetime in seconds. Default: 15 minutes. */
    @Value("${app.qr.expiration:900}")
    private int qrExpirationSeconds;

    /**
     * Generate a signed JWT that encodes the given sessionId.
     *
     * @param sessionId UUID string of the ClassSession
     * @return compact JWT string (safe to embed in a URL query param)
     */
    public String generateToken(String sessionId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + (long) qrExpirationSeconds * 1000);

        return Jwts.builder()
                .setSubject(sessionId)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Verify the token and extract the sessionId.
     *
     * @param token compact JWT string from the QR URL
     * @return sessionId encoded in the token
     * @throws CustomException 400 if token is malformed or expired
     */
    public String extractSessionId(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            String sessionId = claims.getSubject();
            if (sessionId == null || sessionId.isBlank()) {
                throw new CustomException("QR token does not contain a valid session ID", 400);
            }
            return sessionId;

        } catch (ExpiredJwtException e) {
            log.warn("QR token expired: {}", e.getMessage());
            throw new CustomException("Mã QR đã hết hạn. Vui lòng yêu cầu giáo viên tạo mã mới.", 400);
        } catch (SignatureException | MalformedJwtException e) {
            log.warn("Invalid QR token signature/format: {}", e.getMessage());
            throw new CustomException("Mã QR không hợp lệ.", 400);
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error validating QR token", e);
            throw new CustomException("Không thể xác thực mã QR.", 400);
        }
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = qrSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}

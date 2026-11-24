package com.example.pets.petproject.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    private final Key key;
    private final long expirationMs;
    private final long rememberExpirationMs;

    public JwtUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration-ms:14400000}") long expirationMs,
            @Value("${jwt.remember-expiration-ms:604800000}") long rememberExpirationMs
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
        this.rememberExpirationMs = rememberExpirationMs;
    }

    public String generateToken(String username, String role, Integer id, boolean publishingAuthorized) {
        return generateToken(username, role, id, publishingAuthorized, false);
    }

    /** rememberMe=true: sesion larga ("Recordarme"); si no, la vigencia normal. */
    public String generateToken(String username, String role, Integer id, boolean publishingAuthorized,
                                boolean rememberMe) {
        long validity = rememberMe ? rememberExpirationMs : expirationMs;
        boolean isAdmin = "ADMIN".equals(role);
        return Jwts.builder()
                .setSubject(username)
                .claim("admin", isAdmin)
                .claim("role", role)
                .claim("id", id)
                .claim("pub", publishingAuthorized)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + validity))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims extractClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public boolean isTokenValid(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}

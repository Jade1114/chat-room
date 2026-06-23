package com.yuy.chatroom.security;

import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtTokenProvider {

  private final SecretKey key;
  private final long expirationMs;

  public JwtTokenProvider(
      @Value("${app.jwt.secret}") String secret,
      @Value("${app.jwt.expiration-ms}") long expirationMs) {
    this.key = Keys.hmacShaKeyFor(secret.getBytes());
    this.expirationMs = expirationMs;
  }

  public String createToken(String userId, String role, String displayName) {
    Date now = new Date();
    Date expiry = new Date(now.getTime() + expirationMs);

    return Jwts.builder()
        .subject(userId)
        .claim("role", role)
        .claim("displayName", displayName)
        .issuedAt(now)
        .expiration(expiry)
        .signWith(key)
        .compact();
  }

  public Jws<Claims> validateToken(String token) {
    return Jwts.parser()
        .verifyWith(key)
        .build()
        .parseSignedClaims(token);
  }

  public String getUserId(String token) {
    try {
      return validateToken(token).getPayload().getSubject();
    } catch (JwtException e) {
      return null;
    }
  }

  public String getRole(String token) {
    try {
      return validateToken(token).getPayload().get("role", String.class);
    } catch (JwtException e) {
      return null;
    }
  }

  public String getDisplayName(String token) {
    try {
      return validateToken(token).getPayload().get("displayName", String.class);
    } catch (JwtException e) {
      return null;
    }
  }
}

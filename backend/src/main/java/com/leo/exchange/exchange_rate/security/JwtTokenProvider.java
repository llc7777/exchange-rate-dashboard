package com.leo.exchange.exchange_rate.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.leo.exchange.exchange_rate.config.AuthProperties;
import com.leo.exchange.exchange_rate.entity.AuthUser;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private static final Base64.Encoder URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder URL_DECODER = Base64.getUrlDecoder();

    private final AuthProperties authProperties;
    private final ObjectMapper objectMapper;

    public String createToken(AuthUser user) {
        try {
            // 외부 라이브러리 없이 HMAC-SHA256 서명 JWT를 생성한다.
            // Creates an HMAC-SHA256 signed JWT without hardcoding any secret in Java code.
            String header = encodeJson(Map.of("alg", "HS256", "typ", "JWT"));
            String payload = encodeJson(Map.of(
                    "sub", String.valueOf(user.getId()),
                    "email", user.getEmail(),
                    "userKey", user.getUserKey(),
                    "name", user.getName(),
                    "exp", Instant.now().plus(authProperties.tokenTtl()).getEpochSecond()
            ));
            String unsignedToken = header + "." + payload;
            return unsignedToken + "." + sign(unsignedToken);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to create access token.", ex);
        }
    }

    public AuthPrincipal parseToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return null;
            }
            String unsignedToken = parts[0] + "." + parts[1];
            // 서명이 다르면 변조된 토큰으로 보고 인증하지 않는다.
            // Rejects the token when the signature does not match.
            if (!sign(unsignedToken).equals(parts[2])) {
                return null;
            }
            Map<String, Object> claims = objectMapper.readValue(
                    URL_DECODER.decode(parts[1]),
                    new TypeReference<>() {
                    }
            );
            Number exp = (Number) claims.get("exp");
            if (exp == null || exp.longValue() < Instant.now().getEpochSecond()) {
                return null;
            }
            return new AuthPrincipal(
                    Long.valueOf((String) claims.get("sub")),
                    (String) claims.get("email"),
                    (String) claims.get("userKey"),
                    (String) claims.get("name")
            );
        } catch (Exception ex) {
            return null;
        }
    }

    private String encodeJson(Map<String, Object> value) throws Exception {
        return URL_ENCODER.encodeToString(objectMapper.writeValueAsBytes(value));
    }

    private String sign(String unsignedToken) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(authProperties.jwtSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return URL_ENCODER.encodeToString(mac.doFinal(unsignedToken.getBytes(StandardCharsets.UTF_8)));
    }
}

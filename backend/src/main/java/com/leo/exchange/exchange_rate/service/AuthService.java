package com.leo.exchange.exchange_rate.service;

import com.leo.exchange.exchange_rate.dto.AuthLoginRequest;
import com.leo.exchange.exchange_rate.dto.AuthRegisterRequest;
import com.leo.exchange.exchange_rate.dto.AuthResponse;
import com.leo.exchange.exchange_rate.dto.AuthUserResponse;
import com.leo.exchange.exchange_rate.entity.AuthUser;
import com.leo.exchange.exchange_rate.exception.ConflictException;
import com.leo.exchange.exchange_rate.exception.UnauthorizedException;
import com.leo.exchange.exchange_rate.repository.AuthUserRepository;
import com.leo.exchange.exchange_rate.security.AuthPrincipal;
import com.leo.exchange.exchange_rate.security.JwtTokenProvider;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final AuthUserRepository authUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public AuthResponse register(AuthRegisterRequest request) {
        String email = normalizeEmail(request.email());
        String name = request.name().trim();
        if (authUserRepository.existsByEmail(email)) {
            throw new ConflictException("Email is already registered.");
        }
        if (authUserRepository.existsByName(name)) {
            throw new ConflictException("Name is already taken. Please choose another name.");
        }

        // 비밀번호는 BCrypt 해시로만 저장하고 원문은 저장하지 않는다.
        // Stores only the BCrypt password hash and never persists the raw password.
        AuthUser user = authUserRepository.save(AuthUser.builder()
                .email(email)
                .name(name)
                .passwordHash(passwordEncoder.encode(request.password()))
                .userKey(email)
                .build());
        return toAuthResponse(user);
    }

    public AuthResponse login(AuthLoginRequest request) {
        String email = normalizeEmail(request.email());
        AuthUser user = authUserRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password."));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password.");
        }
        // 로그인 성공 후 보호 API에서 사용할 Bearer 토큰을 발급한다.
        // Issues a bearer token for protected frontend API calls after successful login.
        return toAuthResponse(user);
    }

    public AuthUserResponse me(AuthPrincipal principal) {
        AuthUser user = authUserRepository.findByEmail(principal.email())
                .orElseThrow(() -> new UnauthorizedException("Authenticated user not found."));
        return AuthUserResponse.from(user);
    }

    private AuthResponse toAuthResponse(AuthUser user) {
        return new AuthResponse(jwtTokenProvider.createToken(user), "Bearer", AuthUserResponse.from(user));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}

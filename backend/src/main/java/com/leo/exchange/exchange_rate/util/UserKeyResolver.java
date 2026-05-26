package com.leo.exchange.exchange_rate.util;

import com.leo.exchange.exchange_rate.exception.UnauthorizedException;
import com.leo.exchange.exchange_rate.security.AuthPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
public class UserKeyResolver {

    public static final String DEFAULT_USER_KEY = "demo-user";
    private static final String USER_KEY_HEADER = "X-USER-KEY";

    private final HttpServletRequest request;

    public String currentUserKeyOrNull() {
        AuthPrincipal principal = currentPrincipal();
        return principal == null ? null : principal.userKey();
    }

    public String currentUserKeyOrDefault() {
        AuthPrincipal principal = currentPrincipal();
        if (principal != null) {
            return principal.userKey();
        }
        String headerValue = request.getHeader(USER_KEY_HEADER);
        if (StringUtils.hasText(headerValue)) {
            return headerValue.trim();
        }
        return DEFAULT_USER_KEY;
    }

    public String requireUserKey() {
        AuthPrincipal principal = currentPrincipal();
        if (principal == null) {
            throw new UnauthorizedException("Login is required.");
        }
        return principal.userKey();
    }

    private AuthPrincipal currentPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthPrincipal principal)) {
            return null;
        }
        return principal;
    }
}

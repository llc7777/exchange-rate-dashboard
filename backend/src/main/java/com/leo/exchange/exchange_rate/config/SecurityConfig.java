package com.leo.exchange.exchange_rate.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.leo.exchange.exchange_rate.dto.ErrorResponse;
import com.leo.exchange.exchange_rate.repository.AuthUserRepository;
import com.leo.exchange.exchange_rate.security.JwtAuthenticationFilter;
import java.time.LocalDateTime;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final ObjectMapper objectMapper;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exception -> exception.authenticationEntryPoint((request, response, authException) -> {
                    // 로그인되지 않은 사용자가 보호된 API를 호출하면 JSON 에러 응답을 반환한다.
                    // Returns a JSON error response when an anonymous user calls a protected API.
                    response.setStatus(HttpMethod.OPTIONS.matches(request.getMethod()) ? 200 : 401);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    if (!HttpMethod.OPTIONS.matches(request.getMethod())) {
                        objectMapper.writeValue(response.getWriter(), new ErrorResponse(
                                401,
                                "Login is required.",
                                LocalDateTime.now()
                        ));
                    }
                }))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/**", "/swagger.yml", "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/exchange-rates/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/exchange-rates/calculate").permitAll()
                        .requestMatchers("/api/favorites/**").authenticated()
                        .requestMatchers("/api/portfolio/**").authenticated()
                        .requestMatchers("/api/admin/**").permitAll()
                        .anyRequest().permitAll())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService(AuthUserRepository authUserRepository) {
        return username -> authUserRepository.findByEmail(username.trim().toLowerCase(Locale.ROOT))
                .map(user -> User.withUsername(user.getEmail())
                        .password(user.getPasswordHash())
                        .authorities("ROLE_USER")
                        .build())
                .orElseThrow(() -> new UsernameNotFoundException("User not found."));
    }
}

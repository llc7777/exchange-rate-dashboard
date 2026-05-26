package com.leo.exchange.exchange_rate.cache;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.time.Duration;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

@ExtendWith(MockitoExtension.class)
class CacheServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private CacheService cacheService;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        cacheService = new CacheService(redisTemplate, objectMapper);
    }

    @Test
    void putCache() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        cacheService.put("key", new Sample("USD"), Duration.ofHours(6));

        verify(valueOperations).set(eq("key"), eq("{\"code\":\"USD\"}"), eq(Duration.ofHours(6)));
    }

    @Test
    void getCache() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("key")).thenReturn("{\"code\":\"USD\"}");

        Optional<Sample> result = cacheService.get("key", Sample.class);

        assertThat(result).isPresent();
        assertThat(result.get().code()).isEqualTo("USD");
    }

    @Test
    void evictCache() {
        cacheService.evict("key");

        verify(redisTemplate).delete("key");
    }

    @Test
    void evictByPattern() {
        when(redisTemplate.keys("exchange:*")).thenReturn(Set.of("exchange:today"));

        cacheService.evictByPattern("exchange:*");

        verify(redisTemplate).delete(Set.of("exchange:today"));
    }

    @Test
    void redisExceptionsAreSwallowed() {
        when(redisTemplate.opsForValue()).thenThrow(new RuntimeException("redis down"));
        doThrow(new RuntimeException("redis down")).when(redisTemplate).delete("key");

        assertThat(cacheService.get("key", Sample.class)).isEmpty();
        assertThatCode(() -> cacheService.put("key", new Sample("USD"), Duration.ofHours(6))).doesNotThrowAnyException();
        assertThatCode(() -> cacheService.evict("key")).doesNotThrowAnyException();
    }

    private record Sample(String code) {
    }
}

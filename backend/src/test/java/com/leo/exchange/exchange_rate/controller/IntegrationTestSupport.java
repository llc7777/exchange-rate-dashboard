package com.leo.exchange.exchange_rate.controller;

import com.leo.exchange.exchange_rate.entity.ExchangeRate;
import com.leo.exchange.exchange_rate.entity.AuthUser;
import com.leo.exchange.exchange_rate.security.JwtTokenProvider;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
abstract class IntegrationTestSupport {

    protected static final String TEST_USER_EMAIL = "tester@example.com";

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Container
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4")
            .withDatabaseName("exchange_db")
            .withUsername("root")
            .withPassword("1234");

    @Container
    static final GenericContainer<?> REDIS = new GenericContainer<>("redis:7")
            .withExposedPorts(6379);

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create");
        registry.add("spring.data.redis.host", REDIS::getHost);
        registry.add("spring.data.redis.port", () -> REDIS.getMappedPort(6379));
        registry.add("exchange.scheduler.enabled", () -> "false");
        registry.add("exchange.api.auth-key", () -> "test-key");
    }

    protected ExchangeRate rate(String curUnit, LocalDate baseDate, String dealBasR) {
        String normalized = curUnit.contains("(") ? curUnit.substring(0, curUnit.indexOf('(')) : curUnit;
        return ExchangeRate.builder()
                .curUnit(curUnit)
                .normalizedCurUnit(normalized)
                .curName(normalized + " name")
                .ttb(new BigDecimal(dealBasR))
                .tts(new BigDecimal(dealBasR))
                .dealBasR(new BigDecimal(dealBasR))
                .bkpr(new BigDecimal(dealBasR))
                .yyEfeeR(BigDecimal.ZERO)
                .tenDdEfeeR(BigDecimal.ZERO)
                .kftcDealBasR(new BigDecimal(dealBasR))
                .kftcBkpr(new BigDecimal(dealBasR))
                .baseDate(baseDate)
                .changeAmount(BigDecimal.ZERO)
                .changeRate(BigDecimal.ZERO)
                .build();
    }

    protected String authorizationHeader() {
        AuthUser user = AuthUser.builder()
                .id(1L)
                .email(TEST_USER_EMAIL)
                .name("Test User")
                .userKey(TEST_USER_EMAIL)
                .passwordHash("unused")
                .build();
        return "Bearer " + jwtTokenProvider.createToken(user);
    }
}

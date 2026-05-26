package com.leo.exchange.exchange_rate.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.leo.exchange.exchange_rate.config.QueryDslConfig;
import com.leo.exchange.exchange_rate.dto.PortfolioTransactionSearchCondition;
import com.leo.exchange.exchange_rate.entity.PortfolioTransaction;
import com.leo.exchange.exchange_rate.entity.PortfolioTransactionType;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@DataJpaTest(properties = "spring.jpa.hibernate.ddl-auto=create")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(QueryDslConfig.class)
@Testcontainers(disabledWithoutDocker = true)
class PortfolioTransactionRepositoryTest {

    @Container
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4")
            .withDatabaseName("exchange_db")
            .withUsername("root")
            .withPassword("1234");

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
    }

    @Autowired
    private PortfolioTransactionRepository portfolioTransactionRepository;

    @Test
    void searchByNormalizedCurUnit() {
        portfolioTransactionRepository.save(transaction("demo-user", "USD", PortfolioTransactionType.BUY, "2026-05-20"));
        portfolioTransactionRepository.save(transaction("demo-user", "JPY", PortfolioTransactionType.BUY, "2026-05-21"));

        var result = portfolioTransactionRepository.searchTransactions(
                new PortfolioTransactionSearchCondition("demo-user", 10L, "USD", null, null, null),
                PageRequest.of(0, 10)
        );

        assertThat(result.getContent())
                .extracting(PortfolioTransaction::getNormalizedCurUnit)
                .containsExactly("USD");
    }

    @Test
    void searchByTransactionType() {
        portfolioTransactionRepository.save(transaction("demo-user", "USD", PortfolioTransactionType.BUY, "2026-05-20"));
        portfolioTransactionRepository.save(transaction("demo-user", "USD", PortfolioTransactionType.SELL, "2026-05-21"));

        var result = portfolioTransactionRepository.searchTransactions(
                new PortfolioTransactionSearchCondition("demo-user", 10L, null, PortfolioTransactionType.SELL, null, null),
                PageRequest.of(0, 10)
        );

        assertThat(result.getContent())
                .extracting(PortfolioTransaction::getTransactionType)
                .containsExactly(PortfolioTransactionType.SELL);
    }

    @Test
    void searchByDateRangeAndPaging() {
        portfolioTransactionRepository.save(transaction("demo-user", "USD", PortfolioTransactionType.BUY, "2026-05-18"));
        portfolioTransactionRepository.save(transaction("demo-user", "USD", PortfolioTransactionType.BUY, "2026-05-20"));
        portfolioTransactionRepository.save(transaction("demo-user", "USD", PortfolioTransactionType.BUY, "2026-05-22"));

        var result = portfolioTransactionRepository.searchTransactions(
                new PortfolioTransactionSearchCondition(
                        "demo-user",
                        10L,
                        "USD",
                        PortfolioTransactionType.BUY,
                        LocalDate.of(2026, 5, 19),
                        LocalDate.of(2026, 5, 22)
                ),
                PageRequest.of(0, 1)
        );

        assertThat(result.getTotalElements()).isEqualTo(2);
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().getFirst().getTransactionDate()).isEqualTo(LocalDate.of(2026, 5, 22));
    }

    @Test
    void searchDoesNotReturnOtherUsersTransactions() {
        portfolioTransactionRepository.save(transaction("demo-user", "USD", PortfolioTransactionType.BUY, "2026-05-20"));
        portfolioTransactionRepository.save(transaction("other-user", "USD", PortfolioTransactionType.BUY, "2026-05-21"));

        var result = portfolioTransactionRepository.searchTransactions(
                new PortfolioTransactionSearchCondition("demo-user", 10L, "USD", null, null, null),
                PageRequest.of(0, 10)
        );

        assertThat(result.getContent())
                .extracting(PortfolioTransaction::getUserKey)
                .containsExactly("demo-user");
    }

    private PortfolioTransaction transaction(
            String userKey,
            String normalizedCurUnit,
            PortfolioTransactionType type,
            String transactionDate
    ) {
        BigDecimal amount = new BigDecimal("100");
        BigDecimal rate = new BigDecimal("1000");
        return PortfolioTransaction.builder()
                .userKey(userKey)
                .portfolioId(10L)
                .curUnit(normalizedCurUnit)
                .normalizedCurUnit(normalizedCurUnit)
                .transactionType(type)
                .transactionDate(LocalDate.parse(transactionDate))
                .foreignAmount(amount)
                .exchangeRate(rate)
                .unitFactor(BigDecimal.ONE)
                .krwAmount(amount.multiply(rate))
                .memo("memo")
                .build();
    }
}

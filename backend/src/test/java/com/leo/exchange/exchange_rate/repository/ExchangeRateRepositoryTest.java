package com.leo.exchange.exchange_rate.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.leo.exchange.exchange_rate.config.QueryDslConfig;
import com.leo.exchange.exchange_rate.entity.ExchangeRate;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@DataJpaTest(properties = "spring.jpa.hibernate.ddl-auto=create")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(QueryDslConfig.class)
@Testcontainers(disabledWithoutDocker = true)
class ExchangeRateRepositoryTest {

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
    private ExchangeRateRepository exchangeRateRepository;

    @Test
    void uniqueConstraintPreventsSameCurrencyAndDate() {
        LocalDate date = LocalDate.of(2026, 5, 24);
        exchangeRateRepository.saveAndFlush(rate("USD", "USD", "US Dollar", date, "1350"));

        assertThatThrownBy(() -> exchangeRateRepository.saveAndFlush(rate("USD", "USD", "US Dollar", date, "1351")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void findLatestDate() {
        exchangeRateRepository.save(rate("USD", "USD", "US Dollar", LocalDate.of(2026, 5, 23), "1340"));
        exchangeRateRepository.save(rate("USD", "USD", "US Dollar", LocalDate.of(2026, 5, 24), "1350"));

        assertThat(exchangeRateRepository.findLatestDate()).contains(LocalDate.of(2026, 5, 24));
    }

    @Test
    void searchByCurUnit() {
        LocalDate date = LocalDate.of(2026, 5, 24);
        exchangeRateRepository.save(rate("USD", "USD", "US Dollar", date, "1350"));
        exchangeRateRepository.save(rate("EUR", "EUR", "Euro", date, "1500"));

        assertThat(exchangeRateRepository.searchLatestRates("usd", date))
                .extracting(ExchangeRate::getCurUnit)
                .containsExactly("USD");
    }

    @Test
    void searchByNormalizedCurUnit() {
        LocalDate date = LocalDate.of(2026, 5, 24);
        exchangeRateRepository.save(rate("JPY(100)", "JPY", "Japanese Yen", date, "900"));

        assertThat(exchangeRateRepository.searchLatestRates("jpy", date))
                .extracting(ExchangeRate::getCurUnit)
                .containsExactly("JPY(100)");
    }

    @Test
    void searchByCurrencyName() {
        LocalDate date = LocalDate.of(2026, 5, 24);
        exchangeRateRepository.save(rate("JPY(100)", "JPY", "Japanese Yen", date, "900"));

        assertThat(exchangeRateRepository.searchLatestRates("yen", date))
                .extracting(ExchangeRate::getNormalizedCurUnit)
                .containsExactly("JPY");
    }

    @Test
    void findLatestHistoryReturnsLatestSevenInDescendingOrder() {
        LocalDate base = LocalDate.of(2026, 5, 24);
        for (int i = 0; i < 10; i++) {
            exchangeRateRepository.save(rate("USD", "USD", "US Dollar", base.minusDays(i), String.valueOf(1300 + i)));
        }

        var history = exchangeRateRepository.findLatestHistory("USD", 7);

        assertThat(history).hasSize(7);
        assertThat(history.getFirst().getBaseDate()).isEqualTo(base);
        assertThat(history.getLast().getBaseDate()).isEqualTo(base.minusDays(6));
    }

    private ExchangeRate rate(String curUnit, String normalizedCurUnit, String curName, LocalDate baseDate, String dealBasR) {
        return ExchangeRate.builder()
                .curUnit(curUnit)
                .normalizedCurUnit(normalizedCurUnit)
                .curName(curName)
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
}

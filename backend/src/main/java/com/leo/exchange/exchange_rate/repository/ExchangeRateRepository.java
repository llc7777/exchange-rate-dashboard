package com.leo.exchange.exchange_rate.repository;

import com.leo.exchange.exchange_rate.entity.ExchangeRate;
import com.leo.exchange.exchange_rate.repository.custom.ExchangeRateRepositoryCustom;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExchangeRateRepository extends JpaRepository<ExchangeRate, Long>, ExchangeRateRepositoryCustom {

    List<ExchangeRate> findByBaseDate(LocalDate baseDate);

    List<ExchangeRate> findByBaseDateOrderByCurUnitAsc(LocalDate baseDate);

    Optional<ExchangeRate> findTopByOrderByBaseDateDesc();

    Optional<ExchangeRate> findByCurUnitAndBaseDate(String curUnit, LocalDate baseDate);

    Optional<ExchangeRate> findByNormalizedCurUnitAndBaseDate(String normalizedCurUnit, LocalDate baseDate);

    Optional<ExchangeRate> findTopByCurUnitOrderByBaseDateDesc(String curUnit);

    Optional<ExchangeRate> findTopByNormalizedCurUnitOrderByBaseDateDesc(String normalizedCurUnit);

    Optional<ExchangeRate> findTopByNormalizedCurUnitAndBaseDateBeforeOrderByBaseDateDesc(
            String normalizedCurUnit,
            LocalDate baseDate
    );

    List<ExchangeRate> findTop7ByNormalizedCurUnitOrderByBaseDateDesc(String normalizedCurUnit);

    boolean existsByCurUnitAndBaseDate(String curUnit, LocalDate baseDate);

    boolean existsByBaseDate(LocalDate baseDate);
}

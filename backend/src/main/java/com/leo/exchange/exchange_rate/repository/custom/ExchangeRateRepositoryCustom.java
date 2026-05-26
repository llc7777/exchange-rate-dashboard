package com.leo.exchange.exchange_rate.repository.custom;

import com.leo.exchange.exchange_rate.entity.ExchangeRate;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ExchangeRateRepositoryCustom {

    List<ExchangeRate> searchLatestRates(String keyword, LocalDate baseDate);

    List<ExchangeRate> searchLatestRatesByKeyword(String keyword);

    Optional<LocalDate> findLatestDate();

    List<ExchangeRate> findLatestHistory(String normalizedCurUnit, int fixedLimit);
}

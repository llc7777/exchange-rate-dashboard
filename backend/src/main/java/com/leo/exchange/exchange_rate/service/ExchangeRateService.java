package com.leo.exchange.exchange_rate.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.leo.exchange.exchange_rate.cache.CacheService;
import com.leo.exchange.exchange_rate.config.ExchangeCacheProperties;
import com.leo.exchange.exchange_rate.dto.ExchangeRateForTransactionResponse;
import com.leo.exchange.exchange_rate.dto.ExchangeRateHistoryResponse;
import com.leo.exchange.exchange_rate.dto.ExchangeRateResponse;
import com.leo.exchange.exchange_rate.entity.ExchangeRate;
import com.leo.exchange.exchange_rate.exception.DataNotFoundException;
import com.leo.exchange.exchange_rate.exception.InvalidRequestException;
import com.leo.exchange.exchange_rate.repository.ExchangeRateRepository;
import com.leo.exchange.exchange_rate.repository.FavoriteCurrencyRepository;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExchangeRateService {

    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");
    private static final String KRW = "KRW";
    private static final String TODAY_CACHE_KEY = "exchange:today:v3";
    private static final int BUY_RATE_LOOKBACK_DAYS = 10;

    private final ExchangeRateRepository exchangeRateRepository;
    private final FavoriteCurrencyRepository favoriteCurrencyRepository;
    private final CurrencyUnitService currencyUnitService;
    private final CacheService cacheService;
    private final ExchangeCacheProperties cacheProperties;
    private final ExchangeRateSyncService exchangeRateSyncService;

    public List<ExchangeRateResponse> getTodayRates(String userKey) {
        List<ExchangeRateResponse> cachedRates = cacheService
                .get(TODAY_CACHE_KEY, new TypeReference<List<ExchangeRateResponse>>() {
                })
                .orElseGet(() -> {
                    LocalDate targetDate = resolveTodayOrLatestDate();
                    List<ExchangeRateResponse> responses = exchangeRateRepository.searchLatestRates(null, targetDate)
                            .stream()
                            .map(rate -> ExchangeRateResponse.from(rate, false))
                            .toList();
                    cacheService.put(TODAY_CACHE_KEY, responses, cacheProperties.ttl());
                    return responses;
                });

        return applyFavorites(cachedRates, userKey);
    }

    public List<ExchangeRateResponse> search(String keyword, String userKey) {
        LocalDate targetDate = resolveTodayOrLatestDate();
        List<ExchangeRateResponse> responses = exchangeRateRepository.searchLatestRates(keyword, targetDate)
                .stream()
                .map(rate -> ExchangeRateResponse.from(rate, false))
                .toList();
        return applyFavorites(responses, userKey);
    }

    public ExchangeRateResponse getDetail(String curUnit, LocalDate date, String userKey) {
        String normalizedCurUnit = currencyUnitService.normalize(curUnit);
        LocalDate targetDate = date != null ? date : resolveLatestDate();
        String key = detailCacheKey(normalizedCurUnit, targetDate);

        ExchangeRateResponse response = cacheService.get(key, ExchangeRateResponse.class)
                .orElseGet(() -> {
                    ExchangeRate rate = exchangeRateRepository
                            .findByNormalizedCurUnitAndBaseDate(normalizedCurUnit, targetDate)
                            .orElseThrow(() -> new DataNotFoundException("Exchange rate not found."));
                    ExchangeRateResponse uncached = ExchangeRateResponse.from(rate, false);
                    cacheService.put(key, uncached, cacheProperties.ttl());
                    return uncached;
                });

        boolean favorite = favoriteCurrencyRepository.existsByUserKeyAndNormalizedCurUnit(userKey, normalizedCurUnit);
        return response.withFavorite(favorite);
    }

    public List<ExchangeRateHistoryResponse> getHistory(String curUnit) {
        String normalizedCurUnit = currencyUnitService.normalize(curUnit);
        String key = historyCacheKey(normalizedCurUnit);

        return cacheService.get(key, new TypeReference<List<ExchangeRateHistoryResponse>>() {
                })
                .orElseGet(() -> {
                    List<ExchangeRateHistoryResponse> history = exchangeRateRepository
                            .findLatestHistory(normalizedCurUnit, 7)
                            .stream()
                            .sorted(Comparator.comparing(ExchangeRate::getBaseDate))
                            .map(rate -> new ExchangeRateHistoryResponse(rate.getBaseDate(), rate.getDealBasR()))
                            .toList();
                    cacheService.put(key, history, cacheProperties.ttl());
                    return history;
                });
    }

    @Transactional
    public ExchangeRateForTransactionResponse getRateForTransaction(String curUnit, LocalDate date) {
        if (date == null) {
            throw new InvalidRequestException("date query parameter is required.");
        }
        String normalizedCurUnit = currencyUnitService.normalize(curUnit);
        if (KRW.equals(normalizedCurUnit)) {
            return new ExchangeRateForTransactionResponse(KRW, KRW, "Korean Won", date, BigDecimal.ONE, BigDecimal.ONE);
        }
        ExchangeRate rate = findRateOrSyncWithBusinessDayFallback(normalizedCurUnit, date);
        return ExchangeRateForTransactionResponse.from(rate, currencyUnitService.getUnitFactor(rate.getCurUnit()));
    }

    public ExchangeRateForTransactionResponse getLatestRateForTransaction(String curUnit) {
        String normalizedCurUnit = currencyUnitService.normalize(curUnit);
        if (KRW.equals(normalizedCurUnit)) {
            return new ExchangeRateForTransactionResponse(
                    KRW,
                    KRW,
                    "Korean Won",
                    resolveLatestDate(),
                    BigDecimal.ONE,
                    BigDecimal.ONE
            );
        }
        ExchangeRate rate = exchangeRateRepository
                .findTopByNormalizedCurUnitOrderByBaseDateDesc(normalizedCurUnit)
                .orElseThrow(() -> new DataNotFoundException("Latest exchange rate not found."));
        return ExchangeRateForTransactionResponse.from(rate, currencyUnitService.getUnitFactor(rate.getCurUnit()));
    }

    public LocalDate resolveLatestDate() {
        return exchangeRateRepository.findLatestDate()
                .orElseThrow(() -> new DataNotFoundException("No exchange-rate data is stored."));
    }

    public LocalDate resolveTodayOrLatestDate() {
        LocalDate today = LocalDate.now(SEOUL_ZONE);
        if (exchangeRateRepository.existsByBaseDate(today)) {
            return today;
        }
        return resolveLatestDate();
    }

    public static String detailCacheKey(String normalizedCurUnit, LocalDate date) {
        return "exchange:detail:%s:%s".formatted(normalizedCurUnit, date);
    }

    public static String historyCacheKey(String normalizedCurUnit) {
        return "exchange:history:%s:7".formatted(normalizedCurUnit);
    }

    public static String todayCacheKey() {
        return TODAY_CACHE_KEY;
    }

    private ExchangeRate findRateOrSyncWithBusinessDayFallback(String normalizedCurUnit, LocalDate requestedDate) {
        for (LocalDate candidateDate : candidateBusinessDates(requestedDate)) {
            var storedRate = exchangeRateRepository.findByNormalizedCurUnitAndBaseDate(normalizedCurUnit, candidateDate);
            if (storedRate.isPresent()) {
                return storedRate.get();
            }

            // 선택 날짜 또는 직전 영업일 환율이 DB에 없으면 해당 날짜를 한 번 동기화한 뒤 다시 조회한다.
            // If the selected or previous business-day rate is missing in DB, synchronizes that date once and retries.
            exchangeRateSyncService.sync(candidateDate, false, ExternalApiCallerType.PORTFOLIO);
            storedRate = exchangeRateRepository.findByNormalizedCurUnitAndBaseDate(normalizedCurUnit, candidateDate);
            if (storedRate.isPresent()) {
                return storedRate.get();
            }
        }
        throw new DataNotFoundException("Exchange rate not found for the selected date or previous business days.");
    }

    private List<LocalDate> candidateBusinessDates(LocalDate requestedDate) {
        return IntStream.rangeClosed(0, BUY_RATE_LOOKBACK_DAYS)
                .mapToObj(requestedDate::minusDays)
                .filter(date -> date.getDayOfWeek() != DayOfWeek.SATURDAY)
                .filter(date -> date.getDayOfWeek() != DayOfWeek.SUNDAY)
                .toList();
    }

    private List<ExchangeRateResponse> applyFavorites(List<ExchangeRateResponse> responses, String userKey) {
        if (userKey == null) {
            return responses;
        }
        Set<String> favoriteCurrencies = favoriteCurrencyRepository.findByUserKey(userKey)
                .stream()
                .map(favorite -> favorite.getNormalizedCurUnit())
                .collect(Collectors.toSet());
        return responses.stream()
                .map(response -> response.withFavorite(favoriteCurrencies.contains(response.normalizedCurUnit())))
                .toList();
    }
}

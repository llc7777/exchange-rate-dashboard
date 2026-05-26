package com.leo.exchange.exchange_rate.service;

import com.leo.exchange.exchange_rate.dto.FavoriteResponse;
import com.leo.exchange.exchange_rate.entity.ExchangeRate;
import com.leo.exchange.exchange_rate.entity.FavoriteCurrency;
import com.leo.exchange.exchange_rate.exception.DataNotFoundException;
import com.leo.exchange.exchange_rate.repository.ExchangeRateRepository;
import com.leo.exchange.exchange_rate.repository.FavoriteCurrencyRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FavoriteCurrencyService {

    private final FavoriteCurrencyRepository favoriteCurrencyRepository;
    private final ExchangeRateRepository exchangeRateRepository;
    private final CurrencyUnitService currencyUnitService;

    public List<FavoriteResponse> getFavorites(String userKey) {
        return favoriteCurrencyRepository.findByUserKeyOrderByCreatedAtAsc(userKey)
                .stream()
                .flatMap(favorite -> exchangeRateRepository
                        .findTopByNormalizedCurUnitOrderByBaseDateDesc(favorite.getNormalizedCurUnit())
                        .stream())
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public FavoriteResponse addFavorite(String userKey, String curUnit) {
        String normalizedCurUnit = currencyUnitService.normalize(curUnit);
        ExchangeRate latestRate = exchangeRateRepository
                .findTopByNormalizedCurUnitOrderByBaseDateDesc(normalizedCurUnit)
                .orElseThrow(() -> new DataNotFoundException("Exchange rate not found."));

        if (!favoriteCurrencyRepository.existsByUserKeyAndNormalizedCurUnit(userKey, normalizedCurUnit)) {
            favoriteCurrencyRepository.save(FavoriteCurrency.builder()
                    .userKey(userKey)
                    .curUnit(latestRate.getCurUnit())
                    .normalizedCurUnit(normalizedCurUnit)
                    .build());
        }

        return toResponse(latestRate);
    }

    @Transactional
    public void deleteFavorite(String userKey, String curUnit) {
        String normalizedCurUnit = currencyUnitService.normalize(curUnit);
        favoriteCurrencyRepository.deleteByUserKeyAndNormalizedCurUnit(userKey, normalizedCurUnit);
    }

    private FavoriteResponse toResponse(ExchangeRate rate) {
        return new FavoriteResponse(
                rate.getCurUnit(),
                rate.getNormalizedCurUnit(),
                rate.getCurName(),
                rate.getTtb(),
                rate.getTts(),
                rate.getDealBasR(),
                rate.getChangeAmount(),
                rate.getChangeRate(),
                rate.getBaseDate()
        );
    }
}

package com.leo.exchange.exchange_rate.repository;

import com.leo.exchange.exchange_rate.entity.FavoriteCurrency;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FavoriteCurrencyRepository extends JpaRepository<FavoriteCurrency, Long> {

    List<FavoriteCurrency> findByUserKey(String userKey);

    List<FavoriteCurrency> findByUserKeyOrderByCreatedAtAsc(String userKey);

    boolean existsByUserKeyAndNormalizedCurUnit(String userKey, String normalizedCurUnit);

    void deleteByUserKeyAndNormalizedCurUnit(String userKey, String normalizedCurUnit);
}

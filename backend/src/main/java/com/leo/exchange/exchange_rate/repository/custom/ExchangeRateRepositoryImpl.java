package com.leo.exchange.exchange_rate.repository.custom;

import static com.leo.exchange.exchange_rate.entity.QExchangeRate.exchangeRate;

import com.leo.exchange.exchange_rate.entity.ExchangeRate;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

@Repository
@RequiredArgsConstructor
public class ExchangeRateRepositoryImpl implements ExchangeRateRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<ExchangeRate> searchLatestRates(String keyword, LocalDate baseDate) {
        LocalDate targetDate = baseDate != null ? baseDate : findLatestDate().orElse(null);
        if (targetDate == null) {
            return List.of();
        }

        BooleanBuilder builder = new BooleanBuilder();
        builder.and(exchangeRate.baseDate.eq(targetDate));

        if (StringUtils.hasText(keyword)) {
            String normalizedKeyword = keyword.trim().toLowerCase();
            // 검색어가 있으면 통화코드, 정규화 통화코드, 통화명 조건을 동적으로 추가한다.
            // Dynamically adds currency code, normalized currency code, and currency name conditions when a keyword exists.
            builder.and(
                    exchangeRate.curUnit.lower().contains(normalizedKeyword)
                            .or(exchangeRate.normalizedCurUnit.lower().contains(normalizedKeyword))
                            .or(exchangeRate.curName.lower().contains(normalizedKeyword))
            );
        }

        return queryFactory
                .selectFrom(exchangeRate)
                .where(builder)
                .orderBy(exchangeRate.curUnit.asc())
                .fetch();
    }

    @Override
    public List<ExchangeRate> searchLatestRatesByKeyword(String keyword) {
        return searchLatestRates(keyword, null);
    }

    @Override
    public Optional<LocalDate> findLatestDate() {
        return Optional.ofNullable(queryFactory
                .select(exchangeRate.baseDate.max())
                .from(exchangeRate)
                .fetchOne());
    }

    @Override
    public List<ExchangeRate> findLatestHistory(String normalizedCurUnit, int fixedLimit) {
        return queryFactory
                .selectFrom(exchangeRate)
                .where(exchangeRate.normalizedCurUnit.eq(normalizedCurUnit))
                .orderBy(exchangeRate.baseDate.desc())
                .limit(fixedLimit)
                .fetch();
    }
}

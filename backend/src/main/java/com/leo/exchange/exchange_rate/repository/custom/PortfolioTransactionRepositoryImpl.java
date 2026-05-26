package com.leo.exchange.exchange_rate.repository.custom;

import static com.leo.exchange.exchange_rate.entity.QPortfolioTransaction.portfolioTransaction;

import com.leo.exchange.exchange_rate.dto.PortfolioTransactionSearchCondition;
import com.leo.exchange.exchange_rate.entity.PortfolioTransaction;
import com.leo.exchange.exchange_rate.entity.PortfolioTransactionType;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

@Repository
@RequiredArgsConstructor
public class PortfolioTransactionRepositoryImpl implements PortfolioTransactionRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Page<PortfolioTransaction> searchTransactions(
            PortfolioTransactionSearchCondition condition,
            Pageable pageable
    ) {
        List<PortfolioTransaction> content = queryFactory
                .selectFrom(portfolioTransaction)
                .where(
                        userKeyEq(condition.userKey()),
                        portfolioIdEq(condition.portfolioId()),
                        normalizedCurUnitEq(condition.normalizedCurUnit()),
                        transactionTypeEq(condition.transactionType()),
                        fromDateGoe(condition.fromDate()),
                        toDateLoe(condition.toDate())
                )
                .orderBy(resolveOrder(pageable.getSort()))
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        Long total = queryFactory
                .select(portfolioTransaction.count())
                .from(portfolioTransaction)
                .where(
                        userKeyEq(condition.userKey()),
                        portfolioIdEq(condition.portfolioId()),
                        normalizedCurUnitEq(condition.normalizedCurUnit()),
                        transactionTypeEq(condition.transactionType()),
                        fromDateGoe(condition.fromDate()),
                        toDateLoe(condition.toDate())
                )
                .fetchOne();

        return new PageImpl<>(content, pageable, total == null ? 0 : total);
    }

    private BooleanExpression userKeyEq(String userKey) {
        return portfolioTransaction.userKey.eq(userKey);
    }

    private BooleanExpression portfolioIdEq(Long portfolioId) {
        return portfolioId == null ? null : portfolioTransaction.portfolioId.eq(portfolioId);
    }

    private BooleanExpression normalizedCurUnitEq(String normalizedCurUnit) {
        if (!StringUtils.hasText(normalizedCurUnit)) {
            return null;
        }
        // 검색 조건이 있을 때만 정규화 통화코드 조건을 추가한다.
        // Adds the normalized currency condition only when a search value exists.
        return portfolioTransaction.normalizedCurUnit.eq(normalizedCurUnit);
    }

    private BooleanExpression transactionTypeEq(PortfolioTransactionType transactionType) {
        return transactionType == null ? null : portfolioTransaction.transactionType.eq(transactionType);
    }

    private BooleanExpression fromDateGoe(LocalDate fromDate) {
        return fromDate == null ? null : portfolioTransaction.transactionDate.goe(fromDate);
    }

    private BooleanExpression toDateLoe(LocalDate toDate) {
        return toDate == null ? null : portfolioTransaction.transactionDate.loe(toDate);
    }

    private OrderSpecifier<?>[] resolveOrder(Sort sort) {
        if (sort.isUnsorted()) {
            return new OrderSpecifier<?>[]{
                    portfolioTransaction.transactionDate.desc(),
                    portfolioTransaction.id.desc()
            };
        }

        List<OrderSpecifier<?>> specifiers = new ArrayList<>();
        for (Sort.Order sortOrder : sort) {
            Order direction = sortOrder.isAscending() ? Order.ASC : Order.DESC;
            switch (sortOrder.getProperty()) {
                case "transactionDate" -> specifiers.add(new OrderSpecifier<>(direction, portfolioTransaction.transactionDate));
                case "createdAt" -> specifiers.add(new OrderSpecifier<>(direction, portfolioTransaction.createdAt));
                case "id" -> specifiers.add(new OrderSpecifier<>(direction, portfolioTransaction.id));
                default -> specifiers.add(new OrderSpecifier<>(Order.DESC, portfolioTransaction.transactionDate));
            }
        }
        return specifiers.toArray(OrderSpecifier[]::new);
    }
}

package com.leo.exchange.exchange_rate.controller;

import com.leo.exchange.exchange_rate.dto.PortfolioTransactionResponse;
import com.leo.exchange.exchange_rate.dto.PortfolioTransactionSearchCondition;
import com.leo.exchange.exchange_rate.entity.PortfolioTransactionType;
import com.leo.exchange.exchange_rate.service.CurrencyUnitService;
import com.leo.exchange.exchange_rate.service.PortfolioTransactionService;
import com.leo.exchange.exchange_rate.util.UserKeyResolver;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/portfolio/transactions")
public class PortfolioTransactionController {

    private final PortfolioTransactionService portfolioTransactionService;
    private final CurrencyUnitService currencyUnitService;
    private final UserKeyResolver userKeyResolver;

    @GetMapping
    public Page<PortfolioTransactionResponse> getTransactions(
            @RequestParam(required = false) String curUnit,
            @RequestParam(required = false) Long portfolioId,
            @RequestParam(required = false) PortfolioTransactionType transactionType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            Pageable pageable
    ) {
        String userKey = userKeyResolver.requireUserKey();
        PortfolioTransactionSearchCondition condition = new PortfolioTransactionSearchCondition(
                userKey,
                portfolioId,
                curUnit == null ? null : currencyUnitService.normalize(curUnit),
                transactionType,
                fromDate,
                toDate
        );
        return portfolioTransactionService.searchTransactions(userKey, condition, pageable);
    }

    @DeleteMapping("/{transactionId}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long transactionId) {
        portfolioTransactionService.deleteTransaction(
                userKeyResolver.requireUserKey(),
                transactionId
        );
        return ResponseEntity.noContent().build();
    }
}

package com.leo.exchange.exchange_rate.controller;

import com.leo.exchange.exchange_rate.dto.PortfolioAccountCreateRequest;
import com.leo.exchange.exchange_rate.dto.PortfolioAccountResponse;
import com.leo.exchange.exchange_rate.dto.PortfolioBuyRequest;
import com.leo.exchange.exchange_rate.dto.PortfolioDashboardResponse;
import com.leo.exchange.exchange_rate.dto.PortfolioDepositRequest;
import com.leo.exchange.exchange_rate.dto.PortfolioPositionResponse;
import com.leo.exchange.exchange_rate.dto.PortfolioSellRequest;
import com.leo.exchange.exchange_rate.dto.PortfolioSummaryResponse;
import com.leo.exchange.exchange_rate.dto.PortfolioTransactionResponse;
import com.leo.exchange.exchange_rate.entity.PortfolioAccount;
import com.leo.exchange.exchange_rate.service.CurrencyUnitService;
import com.leo.exchange.exchange_rate.service.PortfolioService;
import com.leo.exchange.exchange_rate.service.PortfolioTransactionService;
import com.leo.exchange.exchange_rate.util.UserKeyResolver;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/portfolio")
public class PortfolioController {

    private final PortfolioService portfolioService;
    private final PortfolioTransactionService portfolioTransactionService;
    private final CurrencyUnitService currencyUnitService;
    private final UserKeyResolver userKeyResolver;

    @PostMapping("/account")
    public PortfolioAccountResponse createAccount(@Valid @RequestBody PortfolioAccountCreateRequest request) {
        return portfolioService.createAccount(userKeyResolver.requireUserKey(), request);
    }

    @GetMapping("/accounts")
    public List<PortfolioAccountResponse> getAccounts() {
        return portfolioService.getAccounts(userKeyResolver.requireUserKey());
    }

    @DeleteMapping("/accounts/{portfolioId}")
    public ResponseEntity<Void> deleteAccount(@PathVariable Long portfolioId) {
        portfolioService.deleteAccount(userKeyResolver.requireUserKey(), portfolioId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public PortfolioDashboardResponse getDashboard(@RequestParam(required = false) Long portfolioId) {
        return portfolioService.getDashboard(userKeyResolver.requireUserKey(), portfolioId);
    }

    @GetMapping("/summary")
    public PortfolioSummaryResponse getSummary(@RequestParam(required = false) Long portfolioId) {
        return portfolioService.getSummary(userKeyResolver.requireUserKey(), portfolioId);
    }

    @GetMapping("/positions")
    public List<PortfolioPositionResponse> getPositions(@RequestParam(required = false) Long portfolioId) {
        return portfolioService.getPositions(userKeyResolver.requireUserKey(), portfolioId);
    }

    @GetMapping("/positions/{curUnit}")
    public PortfolioPositionResponse getPosition(
            @PathVariable String curUnit,
            @RequestParam(required = false) Long portfolioId
    ) {
        return portfolioService.getPosition(
                userKeyResolver.requireUserKey(),
                portfolioId,
                currencyUnitService.normalize(curUnit)
        );
    }

    @PostMapping("/deposits")
    public PortfolioAccountResponse deposit(@Valid @RequestBody PortfolioDepositRequest request) {
        PortfolioAccount account = portfolioTransactionService.deposit(
                userKeyResolver.requireUserKey(),
                request
        );
        return PortfolioAccountResponse.from(account);
    }

    @PostMapping("/buy")
    public PortfolioTransactionResponse buy(@Valid @RequestBody PortfolioBuyRequest request) {
        return portfolioTransactionService.buy(userKeyResolver.requireUserKey(), request);
    }

    @PostMapping("/sell")
    public PortfolioTransactionResponse sell(@Valid @RequestBody PortfolioSellRequest request) {
        return portfolioTransactionService.sell(userKeyResolver.requireUserKey(), request);
    }
}

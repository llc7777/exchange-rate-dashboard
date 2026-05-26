package com.leo.exchange.exchange_rate.controller;

import com.leo.exchange.exchange_rate.dto.FavoriteResponse;
import com.leo.exchange.exchange_rate.service.FavoriteCurrencyService;
import com.leo.exchange.exchange_rate.util.UserKeyResolver;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/favorites")
public class FavoriteCurrencyController {

    private final FavoriteCurrencyService favoriteCurrencyService;
    private final UserKeyResolver userKeyResolver;

    @GetMapping
    public List<FavoriteResponse> getFavorites() {
        return favoriteCurrencyService.getFavorites(userKeyResolver.requireUserKey());
    }

    @PostMapping("/{curUnit}")
    public FavoriteResponse addFavorite(@PathVariable String curUnit) {
        return favoriteCurrencyService.addFavorite(userKeyResolver.requireUserKey(), curUnit);
    }

    @DeleteMapping("/{curUnit}")
    public ResponseEntity<Void> deleteFavorite(@PathVariable String curUnit) {
        favoriteCurrencyService.deleteFavorite(userKeyResolver.requireUserKey(), curUnit);
        return ResponseEntity.noContent().build();
    }
}

package com.leo.exchange.exchange_rate.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(
        name = "portfolio_accounts_v3",
        indexes = {
                @Index(name = "idx_portfolio_accounts_v3_user_key", columnList = "user_key"),
                @Index(name = "idx_portfolio_accounts_v3_user_key_created_at", columnList = "user_key, created_at")
        }
)
public class PortfolioAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_key", nullable = false, length = 255)
    private String userKey;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(name = "investment_currency", nullable = false, length = 10)
    private String investmentCurrency;

    @Column(name = "cash_balance", nullable = false, precision = 19, scale = 6)
    private BigDecimal cashBalance;

    @Column(name = "total_deposited", nullable = false, precision = 19, scale = 6)
    private BigDecimal totalDeposited;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public void deposit(BigDecimal amount) {
        this.cashBalance = this.cashBalance.add(amount);
        this.totalDeposited = this.totalDeposited.add(amount);
    }

    public void decreaseCash(BigDecimal amount) {
        this.cashBalance = this.cashBalance.subtract(amount);
    }

    public void increaseCash(BigDecimal amount) {
        this.cashBalance = this.cashBalance.add(amount);
    }

    public void rebuild(BigDecimal cashBalance, BigDecimal totalDeposited) {
        this.cashBalance = cashBalance;
        this.totalDeposited = totalDeposited;
    }
}

package com.leo.exchange.exchange_rate.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
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
@Table(name = "portfolio_transactions_v2")
public class PortfolioTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_key", nullable = false, length = 255)
    private String userKey;

    @Column(name = "portfolio_id")
    private Long portfolioId;

    @Column(name = "cur_unit", length = 30)
    private String curUnit;

    @Column(name = "normalized_cur_unit", length = 10)
    private String normalizedCurUnit;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 10)
    private PortfolioTransactionType transactionType;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Column(name = "foreign_amount", precision = 19, scale = 6)
    private BigDecimal foreignAmount;

    @Column(name = "exchange_rate", precision = 19, scale = 12)
    private BigDecimal exchangeRate;

    @Column(name = "unit_factor", precision = 19, scale = 6)
    private BigDecimal unitFactor;

    @Column(name = "krw_amount", nullable = false, precision = 19, scale = 6)
    private BigDecimal krwAmount;

    @Column(length = 500)
    private String memo;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

}

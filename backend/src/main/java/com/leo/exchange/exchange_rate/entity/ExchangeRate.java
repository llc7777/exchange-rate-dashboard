package com.leo.exchange.exchange_rate.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
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
@Table(
        name = "exchange_rates",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_exchange_rate_cur_unit_base_date", columnNames = {"cur_unit", "base_date"})
        }
)
public class ExchangeRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cur_unit", nullable = false, length = 30)
    private String curUnit;

    @Column(name = "normalized_cur_unit", nullable = false, length = 10)
    private String normalizedCurUnit;

    @Column(name = "cur_name", nullable = false, length = 100)
    private String curName;

    @Column(precision = 19, scale = 6)
    private BigDecimal ttb;

    @Column(precision = 19, scale = 6)
    private BigDecimal tts;

    @Column(name = "deal_bas_r", precision = 19, scale = 6)
    private BigDecimal dealBasR;

    @Column(precision = 19, scale = 6)
    private BigDecimal bkpr;

    @Column(name = "yy_efee_r", precision = 19, scale = 6)
    private BigDecimal yyEfeeR;

    @Column(name = "ten_dd_efee_r", precision = 19, scale = 6)
    private BigDecimal tenDdEfeeR;

    @Column(name = "kftc_deal_bas_r", precision = 19, scale = 6)
    private BigDecimal kftcDealBasR;

    @Column(name = "kftc_bkpr", precision = 19, scale = 6)
    private BigDecimal kftcBkpr;

    @Column(name = "base_date", nullable = false)
    private LocalDate baseDate;

    @Column(name = "change_amount", precision = 19, scale = 6)
    private BigDecimal changeAmount;

    @Column(name = "change_rate", precision = 19, scale = 6)
    private BigDecimal changeRate;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public void updateRates(
            String curName,
            BigDecimal ttb,
            BigDecimal tts,
            BigDecimal dealBasR,
            BigDecimal bkpr,
            BigDecimal yyEfeeR,
            BigDecimal tenDdEfeeR,
            BigDecimal kftcDealBasR,
            BigDecimal kftcBkpr,
            BigDecimal changeAmount,
            BigDecimal changeRate
    ) {
        this.curName = curName;
        this.ttb = ttb;
        this.tts = tts;
        this.dealBasR = dealBasR;
        this.bkpr = bkpr;
        this.yyEfeeR = yyEfeeR;
        this.tenDdEfeeR = tenDdEfeeR;
        this.kftcDealBasR = kftcDealBasR;
        this.kftcBkpr = kftcBkpr;
        this.changeAmount = changeAmount;
        this.changeRate = changeRate;
    }
}

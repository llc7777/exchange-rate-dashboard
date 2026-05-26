package com.leo.exchange.exchange_rate.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ExchangeApiRateItem(
        String result,
        @JsonProperty("cur_unit") String curUnit,
        @JsonProperty("cur_nm") String curName,
        String ttb,
        String tts,
        @JsonProperty("deal_bas_r") String dealBasR,
        String bkpr,
        @JsonProperty("yy_efee_r") String yyEfeeR,
        @JsonProperty("ten_dd_efee_r") String tenDdEfeeR,
        @JsonProperty("kftc_deal_bas_r") String kftcDealBasR,
        @JsonProperty("kftc_bkpr") String kftcBkpr
) {
}

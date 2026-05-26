export interface ExchangeRate {
  id: number;
  curUnit: string;
  normalizedCurUnit: string;
  curName: string;
  ttb: number;
  tts: number;
  dealBasR: number;
  bkpr: number;
  yyEfeeR: number;
  tenDdEfeeR: number;
  kftcDealBasR: number;
  kftcBkpr: number;
  baseDate: string;
  changeAmount: number;
  changeRate: number;
  favorite: boolean;
}

export interface ExchangeRateHistory {
  baseDate: string;
  dealBasR: number;
}

export interface ExchangeCalculateRequest {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
}

export interface ExchangeCalculateResponse {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  convertedAmount: number;
  appliedRate: number;
}

export interface ExchangeSyncResponse {
  baseDate: string;
  skipped: boolean;
  savedCount: number;
  message: string;
}

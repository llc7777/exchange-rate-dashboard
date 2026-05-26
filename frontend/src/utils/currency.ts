import type { ExchangeRate } from '../types/exchange';

export const KRW_RATE: ExchangeRate = {
  id: 0,
  curUnit: 'KRW',
  normalizedCurUnit: 'KRW',
  curName: 'Korean Won',
  ttb: 1,
  tts: 1,
  dealBasR: 1,
  bkpr: 1,
  yyEfeeR: 0,
  tenDdEfeeR: 0,
  kftcDealBasR: 1,
  kftcBkpr: 1,
  baseDate: new Date().toISOString().slice(0, 10),
  changeAmount: 0,
  changeRate: 0,
  favorite: false,
};

export function getDisplayCurrency(rate: Pick<ExchangeRate, 'curUnit' | 'normalizedCurUnit'>) {
  return rate.curUnit === rate.normalizedCurUnit
    ? rate.curUnit
    : `${rate.normalizedCurUnit} (${rate.curUnit})`;
}

export function uniqueCurrencies(rates: ExchangeRate[]) {
  const byCode = new Map<string, ExchangeRate>();
  [KRW_RATE, ...rates].forEach((rate) => {
    byCode.set(rate.normalizedCurUnit, rate);
  });
  return Array.from(byCode.values());
}

export function getUnitFactor(curUnit: string) {
  return curUnit.toUpperCase().includes('(100)') ? 100 : 1;
}

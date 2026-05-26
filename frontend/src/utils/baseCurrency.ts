import type { ExchangeRate, ExchangeRateHistory } from '../types/exchange';
import { getUnitFactor, KRW_RATE, uniqueCurrencies } from './currency';

export function getBaseCurrencyOptions(rates: ExchangeRate[]) {
  return uniqueCurrencies(rates).sort((left, right) =>
    left.normalizedCurUnit.localeCompare(right.normalizedCurUnit),
  );
}

export function convertRatesForBase(
  rates: ExchangeRate[],
  baseCurrency: string,
  baseSourceRates: ExchangeRate[] = rates,
) {
  const baseOptions = uniqueCurrencies(baseSourceRates);
  const displayOptions = uniqueCurrencies(rates);
  const baseRate = baseOptions.find((rate) => rate.normalizedCurUnit === baseCurrency) ?? KRW_RATE;
  const baseCurrentRate = getRatePerSingleUnit(baseRate);
  const basePreviousRate = getPreviousRatePerSingleUnit(baseRate);

  return displayOptions
    .filter((rate) => rate.normalizedCurUnit !== baseRate.normalizedCurUnit)
    .filter((rate) => rate.normalizedCurUnit !== 'KRW' || baseRate.normalizedCurUnit !== 'KRW')
    .map((rate) => {
      if (baseRate.normalizedCurUnit === 'KRW') {
        return rate;
      }

      const currentCrossRate = baseCurrentRate / getRatePerSingleUnit(rate);
      const previousCrossRate = basePreviousRate / getPreviousRatePerSingleUnit(rate);
      const changeAmount = currentCrossRate - previousCrossRate;
      const changeRate = previousCrossRate === 0 ? 0 : (changeAmount / previousCrossRate) * 100;

      // 선택한 기준 통화 대비 환율을 목록 표시용 값으로 변환한다.
      // Converts list display values into rates against the selected base currency.
      return {
        ...rate,
        dealBasR: round(currentCrossRate, 6),
        changeAmount: round(changeAmount, 6),
        changeRate: round(changeRate, 6),
      };
    });
}

export function convertRateForBase(
  rate: ExchangeRate,
  baseCurrency: string,
  baseRate: ExchangeRate,
) {
  if (baseCurrency === 'KRW') {
    return rate;
  }

  const baseCurrentRate = getRatePerSingleUnit(baseRate);
  const basePreviousRate = getPreviousRatePerSingleUnit(baseRate);
  const targetCurrentRate = getRatePerSingleUnit(rate);
  const targetPreviousRate = getPreviousRatePerSingleUnit(rate);
  const dealBasR = convertKrwQuotedValue(rate.dealBasR, rate, baseCurrentRate);
  const previousCrossRate =
    targetPreviousRate === 0 ? 0 : basePreviousRate / targetPreviousRate;
  const changeAmount = dealBasR - previousCrossRate;
  const changeRate = previousCrossRate === 0 ? 0 : (changeAmount / previousCrossRate) * 100;

  // 상세 페이지의 KRW 기준 고시값을 선택한 기준 통화 대비 값으로 변환한다.
  // Converts KRW-quoted detail values into values against the selected base currency.
  return {
    ...rate,
    ttb: convertKrwQuotedValue(rate.ttb, rate, baseCurrentRate),
    tts: convertKrwQuotedValue(rate.tts, rate, baseCurrentRate),
    dealBasR: round(dealBasR, 6),
    bkpr: convertKrwQuotedValue(rate.bkpr, rate, baseCurrentRate),
    kftcDealBasR: convertKrwQuotedValue(rate.kftcDealBasR, rate, baseCurrentRate),
    kftcBkpr: convertKrwQuotedValue(rate.kftcBkpr, rate, baseCurrentRate),
    changeAmount: round(changeAmount, 6),
    changeRate: round(changeRate, 6),
  };
}

export function convertHistoryForBase(
  history: ExchangeRateHistory[],
  targetCurUnit: string,
  baseCurrency: string,
  baseRatesByDate: Record<string, ExchangeRate>,
) {
  if (baseCurrency === 'KRW') {
    return history;
  }

  return history.map((point) => {
    const baseRate = baseRatesByDate[point.baseDate];
    if (!baseRate) {
      return point;
    }

    const baseRatePerSingleUnit = getRatePerSingleUnit(baseRate);
    const targetRatePerSingleUnit = point.dealBasR / getUnitFactor(targetCurUnit);

    // 선택한 기준 통화 1단위가 대상 통화 몇 단위인지 그래프 값으로 변환한다.
    // Converts each chart point into target-currency units per one selected base-currency unit.
    return {
      ...point,
      dealBasR:
        targetRatePerSingleUnit === 0
          ? 0
          : round(baseRatePerSingleUnit / targetRatePerSingleUnit, 6),
    };
  });
}

export function buildKrwRate(baseDate: string): ExchangeRate {
  return {
    ...KRW_RATE,
    baseDate,
  };
}

function getRatePerSingleUnit(rate: ExchangeRate) {
  return rate.dealBasR / getUnitFactor(rate.curUnit);
}

function getPreviousRatePerSingleUnit(rate: ExchangeRate) {
  const previousDealBasR = rate.dealBasR - rate.changeAmount;
  return previousDealBasR / getUnitFactor(rate.curUnit);
}

function round(value: number, digits: number) {
  return Number(value.toFixed(digits));
}

function convertKrwQuotedValue(value: number, targetRate: ExchangeRate, baseRatePerSingleUnit: number) {
  if (targetRate.normalizedCurUnit === 'KRW') {
    return round(baseRatePerSingleUnit, 6);
  }
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  if (value === 0) {
    return 0;
  }
  return round(baseRatePerSingleUnit / (value / getUnitFactor(targetRate.curUnit)), 6);
}

import type { ExchangeRate } from '../types/exchange';
import type { ExchangeRateForTransaction } from '../types/portfolio';
import { getUnitFactor } from './currency';
import { formatAmount } from './numberFormat';

interface RateBasis {
  dealBasR: number;
  unitFactor: number;
  normalizedCurUnit: string;
}

interface DisplayRateUnit {
  unitFactor: number;
  normalizedCurUnit: string;
}

const PREFERRED_DISPLAY_UNITS: Record<string, number> = {
  KRW: 1000,
  JPY: 100,
  IDR: 100,
  VND: 100,
};

export function toRateBasis(rate: ExchangeRateForTransaction): RateBasis {
  return {
    dealBasR: rate.dealBasR,
    unitFactor: rate.unitFactor,
    normalizedCurUnit: rate.normalizedCurUnit,
  };
}

export function exchangeRateToBasis(rate: ExchangeRate): RateBasis {
  return {
    dealBasR: rate.dealBasR,
    unitFactor: getUnitFactor(rate.curUnit),
    normalizedCurUnit: rate.normalizedCurUnit,
  };
}

export function syntheticKrwRate(baseDate: string): ExchangeRateForTransaction {
  return {
    curUnit: 'KRW',
    normalizedCurUnit: 'KRW',
    curName: 'Korean Won',
    baseDate,
    dealBasR: 1,
    unitFactor: 1,
  };
}

export function calculateInvestmentCurrencyRate(targetRate: RateBasis, investmentRate: RateBasis) {
  const investmentUnitValueInKrw = investmentRate.dealBasR / investmentRate.unitFactor;
  return targetRate.dealBasR / investmentUnitValueInKrw;
}

export function getDisplayRateUnit(
  targetRate: Pick<RateBasis, 'unitFactor' | 'normalizedCurUnit'>,
  appliedRate?: number | null,
): DisplayRateUnit {
  let displayUnitFactor = Math.max(
    targetRate.unitFactor,
    PREFERRED_DISPLAY_UNITS[targetRate.normalizedCurUnit] ?? targetRate.unitFactor,
  );

  if (appliedRate && appliedRate > 0) {
    while ((appliedRate * displayUnitFactor) / targetRate.unitFactor < 0.01 && displayUnitFactor < 1_000_000) {
      displayUnitFactor *= 10;
    }
  }

  return {
    unitFactor: displayUnitFactor,
    normalizedCurUnit: targetRate.normalizedCurUnit,
  };
}

export function convertAppliedRateToDisplayUnit(appliedRate: number, targetRate: RateBasis, displayUnitFactor: number) {
  return (appliedRate * displayUnitFactor) / targetRate.unitFactor;
}

export function calculateInvestmentCurrencyAmount(
  foreignAmount: number,
  targetRate: RateBasis,
  investmentRate: RateBasis,
) {
  const appliedRate = calculateInvestmentCurrencyRate(targetRate, investmentRate);
  return (foreignAmount * appliedRate) / targetRate.unitFactor;
}

export function formatRateUnit(rate: Pick<RateBasis, 'unitFactor' | 'normalizedCurUnit'>) {
  return `per ${formatAmount(rate.unitFactor)} ${rate.normalizedCurUnit}`;
}

import { useEffect, useState } from 'react';

import { searchExchangeRates } from '../../api/exchangeRateApi';
import { toAppApiError } from '../../api/httpClient';
import { getExchangeRateForBuy } from '../../api/portfolioApi';
import type { ExchangeRate } from '../../types/exchange';
import type { ExchangeRateForTransaction } from '../../types/portfolio';
import { getEnglishCurrencyName } from '../../utils/currencyName';
import { formatRate } from '../../utils/numberFormat';
import {
  calculateInvestmentCurrencyRate,
  convertAppliedRateToDisplayUnit,
  exchangeRateToBasis,
  formatRateUnit,
  getDisplayRateUnit,
  syntheticKrwRate,
  toRateBasis,
} from '../../utils/portfolioRate';
import { Button } from '../common/Button';
import { EmptyView } from '../common/EmptyView';
import { ErrorView } from '../common/ErrorView';
import { LoadingView } from '../common/LoadingView';

interface CurrencySearchForPortfolioProps {
  disabled: boolean;
  investmentCurrency: string;
  onBuy: (rate: ExchangeRate) => void;
}

export function CurrencySearchForPortfolio({
  disabled,
  investmentCurrency,
  onBuy,
}: CurrencySearchForPortfolioProps) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<ExchangeRate[]>([]);
  const [investmentRatesByDate, setInvestmentRatesByDate] = useState<
    Record<string, ExchangeRateForTransaction>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = keyword.trim();
    if (!trimmed || disabled) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const timerId = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      // 포트폴리오 매수 후보 통화를 저장된 백엔드 환율 데이터에서 검색한다.
      // Searches stored backend exchange-rate data for portfolio buy candidates.
      searchExchangeRates(trimmed)
        .then((rates) =>
          setResults(rates.filter((rate) => rate.normalizedCurUnit !== investmentCurrency)),
        )
        .catch((error) => setError(toAppApiError(error).message))
        .finally(() => setLoading(false));
    }, 300);

    return () => window.clearTimeout(timerId);
  }, [disabled, investmentCurrency, keyword]);

  useEffect(() => {
    if (disabled || results.length === 0) {
      setInvestmentRatesByDate({});
      return;
    }

    let active = true;
    const dates = [...new Set(results.map((rate) => rate.baseDate))];

    Promise.all(
      dates.map(async (baseDate) => [
        baseDate,
        investmentCurrency === 'KRW'
          ? syntheticKrwRate(baseDate)
          : await getExchangeRateForBuy(investmentCurrency, baseDate),
      ] as const),
    )
      .then((entries) => {
        if (active) {
          setInvestmentRatesByDate(Object.fromEntries(entries));
        }
      })
      .catch(() => {
        if (active) {
          setInvestmentRatesByDate({});
        }
      });

    return () => {
      active = false;
    };
  }, [disabled, investmentCurrency, results]);

  return (
    <section className="grid gap-3 rounded-app border border-line bg-panel p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-bold">Buy currency</h2>
        <p className="text-sm text-muted">
          Search a currency and buy it with your available {investmentCurrency} cash.
        </p>
      </div>
      <label className="grid gap-1 text-sm font-semibold">
        Currency search
        <input
          value={keyword}
          disabled={disabled}
          onChange={(event) => setKeyword(event.target.value)}
          className="rounded-app border border-line bg-panel px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60"
          placeholder={disabled ? 'Deposit cash before buying.' : 'Search USD, JPY, Euro...'}
        />
      </label>
      {disabled ? (
        <EmptyView message={`Deposit ${investmentCurrency} investment cash before buying currencies.`} />
      ) : null}
      {loading ? <LoadingView label="Searching currencies..." /> : null}
      {error ? <ErrorView message={error} /> : null}
      {!disabled && !loading && !error && keyword.trim() && results.length === 0 ? (
        <EmptyView message="No currencies matched your search." />
      ) : null}
      {!disabled && results.length > 0 ? (
        <div className="grid gap-2">
          {results.map((rate) => (
            <CurrencySearchResult
              key={`${rate.curUnit}-${rate.baseDate}`}
              rate={rate}
              investmentCurrency={investmentCurrency}
              investmentRate={investmentRatesByDate[rate.baseDate]}
              onBuy={onBuy}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

interface CurrencySearchResultProps {
  rate: ExchangeRate;
  investmentCurrency: string;
  investmentRate?: ExchangeRateForTransaction;
  onBuy: (rate: ExchangeRate) => void;
}

function CurrencySearchResult({
  rate,
  investmentCurrency,
  investmentRate,
  onBuy,
}: CurrencySearchResultProps) {
  const targetBasis = exchangeRateToBasis(rate);
  const appliedRate = investmentRate
    ? calculateInvestmentCurrencyRate(targetBasis, toRateBasis(investmentRate))
    : null;
  const displayUnit = getDisplayRateUnit(targetBasis, appliedRate);
  const displayRate = appliedRate === null
    ? null
    : convertAppliedRateToDisplayUnit(appliedRate, targetBasis, displayUnit.unitFactor);

  return (
    <article className="grid gap-3 rounded-app border border-line bg-surface p-3 sm:grid-cols-[1fr_auto]">
      <div>
        <strong>{rate.normalizedCurUnit}</strong>
        <p className="text-sm text-muted">
          {getEnglishCurrencyName(rate.normalizedCurUnit, rate.curName)}
        </p>
        <p className="text-xs text-muted">
          {appliedRate === null
            ? `Base date ${rate.baseDate}`
            : `${formatRate(displayRate)} ${investmentCurrency} ${formatRateUnit(displayUnit)} - Base date ${rate.baseDate}`}
        </p>
      </div>
      <Button type="button" variant="secondary" onClick={() => onBuy(rate)}>
        Buy
      </Button>
    </article>
  );
}

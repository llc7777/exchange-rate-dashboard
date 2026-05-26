import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ExchangeRateList } from '../components/exchange/ExchangeRateList';
import { ExchangeSearchBar } from '../components/exchange/ExchangeSearchBar';
import { BaseCurrencySelector } from '../components/exchange/BaseCurrencySelector';
import { ErrorView } from '../components/common/ErrorView';
import { LoadingView } from '../components/common/LoadingView';
import { useExchangeRates } from '../hooks/useExchangeRates';
import { useAuth } from '../hooks/useAuth';
import { useFavorites } from '../hooks/useFavorites';
import type { ExchangeRate } from '../types/exchange';
import { convertRatesForBase, getBaseCurrencyOptions } from '../utils/baseCurrency';
import {
  isBaseCurrencyStorageEvent,
  readStoredBaseCurrency,
  storeBaseCurrency,
} from '../utils/baseCurrencyPreference';

export function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [baseCurrency, setBaseCurrency] = useState(readStoredBaseCurrency);
  const [baseRates, setBaseRates] = useState<ExchangeRate[]>([]);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const { rates, loading, error, syncError, refresh } = useExchangeRates(keyword, {
    syncBeforeLoad: true,
    reloadKey: isAuthenticated,
  });
  const { toggleFavorite, error: favoriteError } = useFavorites({ enabled: isAuthenticated });
  const baseSourceRates = baseRates.length > 0 ? baseRates : rates;
  const baseCurrencyOptions = useMemo(() => getBaseCurrencyOptions(baseSourceRates), [baseSourceRates]);
  const displayRates = useMemo(
    () => sortRatesByFavorite(convertRatesForBase(rates, baseCurrency, baseSourceRates)),
    [baseCurrency, baseSourceRates, rates],
  );
  const rateLabel =
    baseCurrency === 'KRW' ? 'Deal base rate' : `1 ${baseCurrency} equals`;

  useEffect(() => {
    if (!keyword.trim() && rates.length > 0) {
      setBaseRates(rates);
    }
  }, [keyword, rates]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (isBaseCurrencyStorageEvent(event)) {
        setBaseCurrency(event.newValue || 'KRW');
      }
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  function handleBaseCurrencyChange(value: string) {
    // 사용자가 고른 기준 통화를 브라우저 저장소에 보존한다.
    // Persists the selected base currency in browser storage.
    setBaseCurrency(value);
    storeBaseCurrency(value);
  }

  async function handleToggleFavorite(rate: ExchangeRate) {
    if (!isAuthenticated) {
      setAuthNotice('Log in to save favorite currencies.');
      navigate('/login', {
        state: {
          from: '/',
          message: 'Log in to save favorite currencies.',
        },
      });
      return;
    }
    await toggleFavorite(rate.curUnit, rate.favorite);
    await refresh();
  }

  return (
    <section className="grid gap-5">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Today&apos;s exchange rates</h1>
        <p className="mt-2 text-sm font-medium text-muted">
          Exchange rates are not published on weekends or holidays. Changes are calculated against the previous business day.        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_260px] md:items-end">
        <ExchangeSearchBar value={keyword} onChange={setKeyword} />
        <BaseCurrencySelector
          value={baseCurrency}
          currencies={baseCurrencyOptions}
          onChange={handleBaseCurrencyChange}
        />
      </div>

      {favoriteError ? <ErrorView message={favoriteError} /> : null}
      {authNotice ? <ErrorView message={authNotice} /> : null}
      {syncError ? <ErrorView message={`Live sync failed: ${syncError}`} /> : null}
      {loading ? <LoadingView label="Loading exchange rates..." /> : null}
      {error ? <ErrorView message={error} onRetry={refresh} /> : null}
      {!loading && !error ? (
        <ExchangeRateList
          rates={displayRates}
          onToggleFavorite={handleToggleFavorite}
          emptyMessage={keyword ? 'No currencies matched your search.' : 'No exchange-rate data is stored.'}
          scrollable
          rateLabel={rateLabel}
        />
      ) : null}
    </section>
  );
}

function sortRatesByFavorite(rates: ExchangeRate[]) {
  return [...rates].sort((left, right) => {
    if (left.favorite !== right.favorite) {
      return left.favorite ? -1 : 1;
    }
    return left.normalizedCurUnit.localeCompare(right.normalizedCurUnit);
  });
}

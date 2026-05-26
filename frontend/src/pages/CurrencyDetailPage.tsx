import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { getExchangeRateDetail } from '../api/exchangeRateApi';
import { toAppApiError } from '../api/httpClient';
import { Button } from '../components/common/Button';
import { ErrorView } from '../components/common/ErrorView';
import { LoadingView } from '../components/common/LoadingView';
import { ExchangeDetailCard } from '../components/exchange/ExchangeDetailCard';
import { ExchangeHistoryChart } from '../components/exchange/ExchangeHistoryChart';
import { BusinessDatePicker } from '../components/portfolio/BusinessDatePicker';
import { useAuth } from '../hooks/useAuth';
import { useExchangeHistory } from '../hooks/useExchangeHistory';
import { useExchangeRateDetail } from '../hooks/useExchangeRateDetail';
import { useFavorites } from '../hooks/useFavorites';
import type { ExchangeRate } from '../types/exchange';
import { buildKrwRate, convertHistoryForBase, convertRateForBase } from '../utils/baseCurrency';
import {
  isBaseCurrencyStorageEvent,
  readStoredBaseCurrency,
} from '../utils/baseCurrencyPreference';

export function CurrencyDetailPage() {
  const { curUnit } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [dateError, setDateError] = useState<string | null>(null);
  const [baseCurrency, setBaseCurrency] = useState(readStoredBaseCurrency);
  const [baseRate, setBaseRate] = useState<ExchangeRate | null>(null);
  const [baseRateLoading, setBaseRateLoading] = useState(false);
  const [baseRateError, setBaseRateError] = useState<string | null>(null);
  const [historyBaseRates, setHistoryBaseRates] = useState<Record<string, ExchangeRate>>({});
  const [historyBaseLoading, setHistoryBaseLoading] = useState(false);
  const [historyBaseError, setHistoryBaseError] = useState<string | null>(null);
  const detail = useExchangeRateDetail(curUnit, selectedDate, {
    syncBeforeLoad: true,
    reloadKey: isAuthenticated,
  });
  const history = useExchangeHistory(curUnit, { reloadKey: detail.detail?.baseDate });
  const favorites = useFavorites({ enabled: isAuthenticated });
  const today = new Date().toISOString().slice(0, 10);
  const detailDateValue = selectedDate || detail.detail?.baseDate || today;
  const displayDetail = useMemo(() => {
    if (!detail.detail || !baseRate) {
      return detail.detail;
    }
    return convertRateForBase(detail.detail, baseCurrency, baseRate);
  }, [baseCurrency, baseRate, detail.detail]);
  const detailRateLabel =
    baseCurrency === 'KRW' ? 'KRW per quoted currency unit' : `1 ${baseCurrency} equals`;
  const displayHistory = useMemo(() => {
    if (!detail.detail) {
      return history.history;
    }

    if (baseCurrency === 'KRW') {
      return history.history;
    }

    if (detail.detail.normalizedCurUnit === baseCurrency) {
      return history.history.map((point) => ({ ...point, dealBasR: 1 }));
    }

    return convertHistoryForBase(
      history.history,
      detail.detail.curUnit,
      baseCurrency,
      historyBaseRates,
    );
  }, [baseCurrency, detail.detail, history.history, historyBaseRates]);
  const historyRateLabel =
    baseCurrency === 'KRW'
      ? 'KRW per quoted currency unit, compared across stored business days.'
      : `${detail.detail?.normalizedCurUnit ?? curUnit} per 1 ${baseCurrency}, compared across stored business days.`;

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (isBaseCurrencyStorageEvent(event)) {
        setBaseCurrency(event.newValue || 'KRW');
      }
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const baseDate = detail.detail?.baseDate;
    if (!baseDate) {
      setBaseRate(null);
      setBaseRateError(null);
      return;
    }

    if (baseCurrency === 'KRW') {
      setBaseRate(buildKrwRate(baseDate));
      setBaseRateError(null);
      setBaseRateLoading(false);
      return;
    }

    if (detail.detail?.normalizedCurUnit === baseCurrency) {
      setBaseRate(detail.detail);
      setBaseRateError(null);
      setBaseRateLoading(false);
      return;
    }

    let active = true;
    setBaseRateLoading(true);
    setBaseRateError(null);
    getExchangeRateDetail(baseCurrency, baseDate)
      .then((loadedBaseRate) => {
        if (active) {
          setBaseRate(loadedBaseRate);
        }
      })
      .catch((error) => {
        if (active) {
          setBaseRate(null);
          setBaseRateError(toAppApiError(error).message);
        }
      })
      .finally(() => {
        if (active) {
          setBaseRateLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [baseCurrency, detail.detail]);

  useEffect(() => {
    if (!detail.detail || history.history.length === 0) {
      setHistoryBaseRates({});
      setHistoryBaseError(null);
      setHistoryBaseLoading(false);
      return;
    }

    if (baseCurrency === 'KRW') {
      setHistoryBaseRates({});
      setHistoryBaseError(null);
      setHistoryBaseLoading(false);
      return;
    }

    if (detail.detail.normalizedCurUnit === baseCurrency) {
      setHistoryBaseRates({});
      setHistoryBaseError(null);
      setHistoryBaseLoading(false);
      return;
    }

    let active = true;
    setHistoryBaseLoading(true);
    setHistoryBaseError(null);

    Promise.all(
      history.history.map(async (point) => {
        const loadedBaseRate = await getExchangeRateDetail(baseCurrency, point.baseDate);
        return [point.baseDate, loadedBaseRate] as const;
      }),
    )
      .then((entries) => {
        if (active) {
          setHistoryBaseRates(Object.fromEntries(entries));
        }
      })
      .catch((error) => {
        if (active) {
          setHistoryBaseRates({});
          setHistoryBaseError(toAppApiError(error).message);
        }
      })
      .finally(() => {
        if (active) {
          setHistoryBaseLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [baseCurrency, detail.detail, history.history]);

  async function toggleFavorite() {
    if (!detail.detail) {
      return;
    }
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: `${location.pathname}${location.search}`,
          message: 'Log in to save favorite currencies.',
        },
      });
      return;
    }
    await favorites.toggleFavorite(detail.detail.curUnit, detail.detail.favorite);
    await detail.refresh();
  }

  function handleDateChange(value: string) {
    setDateError(null);
    setSelectedDate(value);
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <ArrowLeft size={18} aria-hidden="true" />
          Back to list
        </Link>
      </div>

      {detail.loading ? <LoadingView label="Loading currency detail..." /> : null}
      {baseRateLoading ? <LoadingView label="Loading base currency rate..." /> : null}
      {historyBaseLoading ? <LoadingView label="Loading base currency chart rates..." /> : null}
      {detail.syncError ? <ErrorView message={`Date sync failed: ${detail.syncError}`} /> : null}
      {detail.error ? <ErrorView message={detail.error} onRetry={detail.refresh} /> : null}
      {baseRateError ? <ErrorView message={`Base currency conversion failed: ${baseRateError}`} /> : null}
      {historyBaseError ? <ErrorView message={`Chart conversion failed: ${historyBaseError}`} /> : null}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-5">
          {displayDetail && !detail.loading ? (
            <ExchangeDetailCard
              rate={displayDetail}
              baseCurrency={baseCurrency}
              rateLabel={detailRateLabel}
              onToggleFavorite={toggleFavorite}
            />
          ) : null}

          {history.loading ? <LoadingView label="Loading latest 7 stored rates..." /> : null}
          {history.error ? <ErrorView message={history.error} onRetry={history.refresh} /> : null}
          {!history.loading && !history.error ? (
            <ExchangeHistoryChart history={displayHistory} rateLabel={historyRateLabel} />
          ) : null}
        </div>

        <aside className="rounded-app border border-line bg-panel p-4 shadow-sm lg:sticky lg:top-4">
          <BusinessDatePicker
            value={detailDateValue}
            onChange={handleDateChange}
            maxDate={today}
            label="Detail date"
            compact
          />
          {dateError ? (
            <p className="mt-2 text-xs font-medium text-[var(--color-up)]">{dateError}</p>
          ) : null}
        </aside>
      </div>

      {!detail.loading && !detail.detail && !detail.error ? (
        <div>
          <Button type="button" variant="secondary" onClick={detail.refresh}>
            Retry
          </Button>
        </div>
      ) : null}
    </section>
  );
}

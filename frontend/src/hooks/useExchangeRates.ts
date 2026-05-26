import { useCallback, useEffect, useState } from 'react';

import { syncLatestAvailableExchangeRates } from '../api/adminExchangeRateApi';
import { getTodayExchangeRates, searchExchangeRates } from '../api/exchangeRateApi';
import { toAppApiError } from '../api/httpClient';
import type { ExchangeRate } from '../types/exchange';

interface UseExchangeRatesOptions {
  syncBeforeLoad?: boolean;
  reloadKey?: unknown;
}

const syncOnHomeLoad = import.meta.env.VITE_SYNC_ON_HOME_LOAD !== 'false';
const homeSyncForce = import.meta.env.VITE_HOME_SYNC_FORCE !== 'false';
const parsedLookbackDays = Number(import.meta.env.VITE_HOME_SYNC_LOOKBACK_DAYS ?? 7);
const homeSyncLookbackDays =
  Number.isFinite(parsedLookbackDays) && parsedLookbackDays > 0 ? parsedLookbackDays : 7;
let homeSyncAttempted = false;

export function useExchangeRates(keyword: string, options: UseExchangeRatesOptions = {}) {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSyncError(null);
    try {
      const trimmed = keyword.trim();
      if (!trimmed && options.syncBeforeLoad && syncOnHomeLoad && !homeSyncAttempted) {
        homeSyncAttempted = true;
        try {
          await syncLatestAvailableExchangeRates({
            force: homeSyncForce,
            lookbackDays: homeSyncLookbackDays,
          });
        } catch (error) {
          // 동기화에 실패해도 저장된 DB 데이터 조회는 계속 시도한다.
          // Even when synchronization fails, still attempts to read stored DB data.
          setSyncError(toAppApiError(error).message);
        }
      }
      const data = trimmed ? await searchExchangeRates(trimmed) : await getTodayExchangeRates();
      setRates(data);
    } catch (error) {
      setError(toAppApiError(error).message);
    } finally {
      setLoading(false);
    }
  }, [keyword, options.reloadKey, options.syncBeforeLoad]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void load();
    }, 300);
    return () => window.clearTimeout(timerId);
  }, [load]);

  return { rates, loading, error, syncError, refresh: load };
}

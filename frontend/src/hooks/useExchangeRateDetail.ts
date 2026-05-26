import { useCallback, useEffect, useState } from 'react';

import { syncExchangeRates } from '../api/adminExchangeRateApi';
import { getExchangeRateDetail } from '../api/exchangeRateApi';
import { toAppApiError } from '../api/httpClient';
import type { ExchangeRate } from '../types/exchange';

interface UseExchangeRateDetailOptions {
  syncBeforeLoad?: boolean;
  reloadKey?: unknown;
}

const syncedDetailDates = new Set<string>();

export function useExchangeRateDetail(
  curUnit: string | undefined,
  date?: string,
  options: UseExchangeRateDetailOptions = {},
) {
  const [detail, setDetail] = useState<ExchangeRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!curUnit) {
      setDetail(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setSyncError(null);
    try {
      const syncKey = `${curUnit}:${date}`;
      if (date && options.syncBeforeLoad && !syncedDetailDates.has(syncKey)) {
        syncedDetailDates.add(syncKey);
        try {
          // 날짜 선택 시 백엔드 동기화 API로 해당 날짜 데이터를 먼저 저장한다.
          // When a date is selected, first stores that date through the backend sync API.
          await syncExchangeRates({ date, force: true });
        } catch (error) {
          setSyncError(toAppApiError(error).message);
        }
      }
      setDetail(await getExchangeRateDetail(curUnit, date || undefined));
    } catch (error) {
      setError(toAppApiError(error).message);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [curUnit, date, options.reloadKey, options.syncBeforeLoad]);

  useEffect(() => {
    void load();
  }, [load]);

  return { detail, loading, error, syncError, refresh: load };
}

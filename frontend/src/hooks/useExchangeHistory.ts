import { useCallback, useEffect, useState } from 'react';

import { getExchangeHistory } from '../api/exchangeRateApi';
import { toAppApiError } from '../api/httpClient';
import type { ExchangeRateHistory } from '../types/exchange';
import { sortByBaseDateAsc } from '../utils/dateFormat';

interface UseExchangeHistoryOptions {
  reloadKey?: unknown;
}

export function useExchangeHistory(
  curUnit: string | undefined,
  options: UseExchangeHistoryOptions = {},
) {
  const [history, setHistory] = useState<ExchangeRateHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!curUnit) {
      setHistory([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 백엔드가 오름차순으로 내려줘도 프론트에서 한 번 더 정렬한다.
      // Sorts once more in the frontend even though the backend returns ascending dates.
      // 백엔드 history는 최신 7개 고정이지만 mock/예외 응답도 7개로 방어한다.
      // Backend history is fixed to the latest 7 records, but mock/edge responses are also capped defensively.
      const sorted = sortByBaseDateAsc(await getExchangeHistory(curUnit));
      setHistory(sorted.slice(-7));
    } catch (error) {
      setError(toAppApiError(error).message);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [curUnit, options.reloadKey]);

  useEffect(() => {
    void load();
  }, [load]);

  return { history, loading, error, refresh: load };
}

import { useCallback, useEffect, useState } from 'react';

import { getPortfolioTransactions, type PortfolioTransactionQuery } from '../api/portfolioApi';
import { toAppApiError } from '../api/httpClient';
import type { PortfolioTransactionPage } from '../types/portfolio';

export function usePortfolioTransactions(query: PortfolioTransactionQuery = {}) {
  const [page, setPage] = useState<PortfolioTransactionPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPage(await getPortfolioTransactions(query));
    } catch (error) {
      setError(toAppApiError(error).message);
      setPage(null);
    } finally {
      setLoading(false);
    }
  }, [query.curUnit, query.fromDate, query.page, query.size, query.sort, query.toDate, query.transactionType]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { page, loading, error, refresh };
}

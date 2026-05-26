import { useCallback, useEffect, useState } from 'react';

import { getPortfolioAccounts, getPortfolioDashboard } from '../api/portfolioApi';
import { toAppApiError } from '../api/httpClient';
import type { PortfolioAccount, PortfolioDashboard } from '../types/portfolio';

export function usePortfolio(portfolioId: number | null, enabled = true) {
  const [accounts, setAccounts] = useState<PortfolioAccount[]>([]);
  const [dashboard, setDashboard] = useState<PortfolioDashboard | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (overridePortfolioId?: number | null) => {
    if (!enabled) {
      setAccounts([]);
      setDashboard(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const loadedAccounts = await getPortfolioAccounts();
      setAccounts(loadedAccounts);
      const requestedPortfolioId = overridePortfolioId ?? portfolioId;
      const selectedExists = loadedAccounts.some((account) => account.id === requestedPortfolioId);
      const resolvedPortfolioId = selectedExists ? requestedPortfolioId : loadedAccounts[0]?.id ?? null;
      setDashboard(await getPortfolioDashboard(resolvedPortfolioId));
    } catch (error) {
      setError(toAppApiError(error).message);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, portfolioId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { accounts, dashboard, loading, error, refresh };
}

import { useState } from 'react';

import { calculateExchangeRate } from '../api/exchangeRateApi';
import { toAppApiError } from '../api/httpClient';
import type { ExchangeCalculateResponse } from '../types/exchange';

export function useExchangeCalculator() {
  const [result, setResult] = useState<ExchangeCalculateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function calculate(fromCurrency: string, toCurrency: string, amount: number) {
    if (amount <= 0) {
      setError('Amount must be greater than zero.');
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setResult(await calculateExchangeRate({ fromCurrency, toCurrency, amount }));
    } catch (error) {
      setError(toAppApiError(error).message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return { result, loading, error, calculate };
}

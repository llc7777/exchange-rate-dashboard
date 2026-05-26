import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getMock, postMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
}));

vi.mock('../httpClient', () => ({
  useMockApi: false,
  httpClient: {
    get: getMock,
    post: postMock,
  },
  request: async <T>(callback: () => Promise<{ data: T }>) => {
    const response = await callback();
    return response.data;
  },
}));

import {
  calculateExchangeRate,
  exchangeRatePaths,
  getExchangeHistory,
  getExchangeRateDetail,
  getTodayExchangeRates,
  searchExchangeRates,
} from '../exchangeRateApi';

describe('exchangeRateApi', () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    getMock.mockResolvedValue({ data: [] });
    postMock.mockResolvedValue({ data: {} });
  });

  it('uses today API path', async () => {
    await getTodayExchangeRates();
    expect(getMock).toHaveBeenCalledWith('/exchange-rates/today');
  });

  it('uses search API path', async () => {
    await searchExchangeRates('usd');
    expect(getMock).toHaveBeenCalledWith('/exchange-rates/search', {
      params: { keyword: 'usd' },
    });
  });

  it('uses detail API path', async () => {
    await getExchangeRateDetail('USD', '2026-05-24');
    expect(getMock).toHaveBeenCalledWith('/exchange-rates/USD', {
      params: { date: '2026-05-24' },
    });
  });

  it('uses fixed history API path without days query parameter', async () => {
    await getExchangeHistory('USD');
    expect(exchangeRatePaths.history('USD')).toBe('/exchange-rates/USD/history');
    expect(getMock).toHaveBeenCalledWith('/exchange-rates/USD/history');
    expect(getMock.mock.calls[0][0]).not.toContain('days');
    expect(getMock.mock.calls[0][1]).toBeUndefined();
  });

  it('sends calculate body in English camelCase', async () => {
    await calculateExchangeRate({
      fromCurrency: 'USD',
      toCurrency: 'KRW',
      amount: 100,
    });
    expect(postMock).toHaveBeenCalledWith('/exchange-rates/calculate', {
      fromCurrency: 'USD',
      toCurrency: 'KRW',
      amount: 100,
    });
  });
});

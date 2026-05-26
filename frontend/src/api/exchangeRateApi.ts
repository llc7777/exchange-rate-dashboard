import { httpClient, request, useMockApi } from './httpClient';
import {
  calculateMockExchangeRate,
  getMockExchangeHistory,
  getMockExchangeRateDetail,
  getMockTodayExchangeRates,
  searchMockExchangeRates,
} from './mockApi';
import type {
  ExchangeCalculateRequest,
  ExchangeCalculateResponse,
  ExchangeRate,
  ExchangeRateHistory,
} from '../types/exchange';
import { getEnglishCurrencyName } from '../utils/currencyName';

export const exchangeRatePaths = {
  today: '/exchange-rates/today',
  search: '/exchange-rates/search',
  detail: (curUnit: string) => `/exchange-rates/${encodeURIComponent(curUnit)}`,
  history: (curUnit: string) => `/exchange-rates/${encodeURIComponent(curUnit)}/history`,
  rate: (curUnit: string) => `/exchange-rates/${encodeURIComponent(curUnit)}/rate`,
  calculate: '/exchange-rates/calculate',
};

export async function getTodayExchangeRates(): Promise<ExchangeRate[]> {
  if (useMockApi) {
    return getMockTodayExchangeRates();
  }
  // 오늘의 환율 목록을 백엔드 API에서 가져온다.
  // Fetches today's exchange-rate list from the backend API.
  return request(() => httpClient.get<ExchangeRate[]>(exchangeRatePaths.today));
}

export async function searchExchangeRates(keyword: string): Promise<ExchangeRate[]> {
  if (useMockApi) {
    return searchMockExchangeRates(keyword);
  }
  const backendResults = await request(() =>
    httpClient.get<ExchangeRate[]>(exchangeRatePaths.search, {
      params: { keyword },
    }),
  );
  if (backendResults.length > 0) {
    return backendResults;
  }

  const value = keyword.trim().toLowerCase();
  const allRates = await getTodayExchangeRates();
  return allRates.filter((rate) =>
    [
      rate.curUnit,
      rate.normalizedCurUnit,
      rate.curName,
      getEnglishCurrencyName(rate.normalizedCurUnit, rate.curName),
    ].some((field) => field.toLowerCase().includes(value)),
  );
}

export async function getExchangeRateDetail(
  curUnit: string,
  date?: string,
): Promise<ExchangeRate> {
  if (useMockApi) {
    return getMockExchangeRateDetail(curUnit);
  }
  return request(() =>
    httpClient.get<ExchangeRate>(exchangeRatePaths.detail(curUnit), {
      params: date ? { date } : undefined,
    }),
  );
}

export async function getExchangeHistory(curUnit: string): Promise<ExchangeRateHistory[]> {
  if (useMockApi) {
    return getMockExchangeHistory(curUnit);
  }
  // 최근 7일 그래프는 days query parameter 없이 고정 history API만 호출한다.
  // The latest 7-day chart calls only the fixed history API without a days query parameter.
  return request(() => httpClient.get<ExchangeRateHistory[]>(exchangeRatePaths.history(curUnit)));
}

export async function calculateExchangeRate(
  body: ExchangeCalculateRequest,
): Promise<ExchangeCalculateResponse> {
  if (useMockApi) {
    return calculateMockExchangeRate(body);
  }
  return request(() => httpClient.post<ExchangeCalculateResponse>(exchangeRatePaths.calculate, body));
}

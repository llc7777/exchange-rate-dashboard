import { httpClient, request, useMockApi } from './httpClient';
import type { ExchangeSyncResponse } from '../types/exchange';

export const adminExchangeRatePaths = {
  sync: '/admin/exchange-rates/sync',
};

interface SyncExchangeRatesOptions {
  date?: string;
  force?: boolean;
}

interface SyncLatestAvailableOptions {
  force?: boolean;
  lookbackDays?: number;
}

export async function syncExchangeRates({
  date,
  force = true,
}: SyncExchangeRatesOptions = {}): Promise<ExchangeSyncResponse> {
  if (useMockApi) {
    return {
      baseDate: new Date().toISOString().slice(0, 10),
      skipped: false,
      savedCount: 8,
      message: 'Mock exchange-rate data synchronized.',
    };
  }

  // 메인 화면 진입 시 백엔드 동기화 API를 호출해 최신 데이터를 저장한다.
  // Calls the backend sync API on home-page entry so the latest data is stored.
  return request(() =>
    httpClient.post<ExchangeSyncResponse>(adminExchangeRatePaths.sync, undefined, {
      params: {
        ...(date ? { date } : {}),
        force,
      },
    }),
  );
}

export async function syncLatestAvailableExchangeRates({
  force = true,
  lookbackDays = 7,
}: SyncLatestAvailableOptions = {}): Promise<ExchangeSyncResponse> {
  let lastResponse: ExchangeSyncResponse | null = null;

  for (let dayOffset = 0; dayOffset < lookbackDays; dayOffset += 1) {
    const date = toDateString(dayOffset);
    const response = await syncExchangeRates({ date, force });
    lastResponse = response;

    if (response.savedCount > 0 || response.skipped) {
      return response;
    }
  }

  return (
    lastResponse ?? {
      baseDate: toDateString(0),
      skipped: false,
      savedCount: 0,
      message: 'No exchange-rate data returned.',
    }
  );
}

function toDateString(dayOffset: number) {
  const date = new Date();
  date.setDate(date.getDate() - dayOffset);
  return date.toISOString().slice(0, 10);
}

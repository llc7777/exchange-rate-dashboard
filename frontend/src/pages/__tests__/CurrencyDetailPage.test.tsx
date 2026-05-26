import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CurrencyDetailPage } from '../CurrencyDetailPage';
import type { ExchangeRate } from '../../types/exchange';
import { getKoreanPublicHolidayMap } from '../../api/holidayApi';
import { getExchangeRateDetail } from '../../api/exchangeRateApi';

const { useDetailMock, useHistoryMock } = vi.hoisted(() => ({
  useDetailMock: vi.fn(),
  useHistoryMock: vi.fn(),
}));

vi.mock('../../hooks/useExchangeRateDetail', () => ({
  useExchangeRateDetail: (curUnit: string, date?: string, options?: unknown) =>
    useDetailMock(curUnit, date, options),
}));

vi.mock('../../hooks/useExchangeHistory', () => ({
  useExchangeHistory: (curUnit: string, options?: unknown) => useHistoryMock(curUnit, options),
}));

vi.mock('../../hooks/useFavorites', () => ({
  useFavorites: () => ({ toggleFavorite: vi.fn(), error: null }),
}));

vi.mock('../../api/holidayApi', () => ({
  getKoreanPublicHolidayMap: vi.fn(),
}));

vi.mock('../../api/exchangeRateApi', () => ({
  getExchangeRateDetail: vi.fn(),
}));

vi.mock('../../components/exchange/ExchangeHistoryChart', () => ({
  ExchangeHistoryChart: ({ history }: { history: unknown[] }) =>
    history.length === 0 ? (
      <p>No history data is stored for this currency.</p>
    ) : (
      <div data-testid="history-chart">{history.length}</div>
    ),
}));

function detail(): ExchangeRate {
  return {
    id: 1,
    curUnit: 'USD',
    normalizedCurUnit: 'USD',
    curName: 'United States Dollar',
    ttb: 1340,
    tts: 1360,
    dealBasR: 1350,
    bkpr: 1350,
    yyEfeeR: 0,
    tenDdEfeeR: 0,
    kftcDealBasR: 1350,
    kftcBkpr: 1350,
    baseDate: '2026-05-22',
    changeAmount: 0,
    changeRate: 0,
    favorite: false,
  };
}

function eurDetail(): ExchangeRate {
  return {
    ...detail(),
    id: 2,
    curUnit: 'EUR',
    normalizedCurUnit: 'EUR',
    curName: 'Euro',
    ttb: 1720,
    tts: 1760,
    dealBasR: 1740,
    bkpr: 1740,
    kftcDealBasR: 1740,
    kftcBkpr: 1740,
    changeAmount: 20,
    changeRate: 1.16,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/currencies/USD']}>
      <Routes>
        <Route path="/currencies/:curUnit" element={<CurrencyDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CurrencyDetailPage', () => {
  beforeEach(() => {
    useDetailMock.mockReset();
    useHistoryMock.mockReset();
    window.localStorage.clear();
    vi.mocked(getExchangeRateDetail).mockReset();
    vi.mocked(getExchangeRateDetail).mockResolvedValue(detail());
    vi.mocked(getKoreanPublicHolidayMap).mockReset();
    vi.mocked(getKoreanPublicHolidayMap).mockResolvedValue({
      '2026-05-05': {
        date: '2026-05-05',
        localName: 'Children Day',
        name: "Children's Day",
        countryCode: 'KR',
        fixed: false,
        global: true,
        counties: null,
        launchYear: null,
        types: ['Public'],
      },
    });
    useDetailMock.mockReturnValue({
      detail: detail(),
      loading: false,
      error: null,
      syncError: null,
      refresh: vi.fn(),
    });
    useHistoryMock.mockReturnValue({
      history: [
        { baseDate: '2026-05-18', dealBasR: 1340 },
        { baseDate: '2026-05-19', dealBasR: 1350 },
      ],
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
  });

  it('renders detail information and loads history for the currency', () => {
    renderPage();

    expect(screen.getAllByText('United States Dollar').length).toBeGreaterThan(0);
    expect(useHistoryMock).toHaveBeenCalledWith('USD', { reloadKey: '2026-05-22' });
  });

  it('recalls detail API when an available date is selected', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Select 2026-05-20' }));

    expect(useDetailMock).toHaveBeenLastCalledWith('USD', '2026-05-20', {
      syncBeforeLoad: true,
      reloadKey: false,
    });
  });

  it('shows empty view when history is empty', () => {
    useHistoryMock.mockReturnValue({
      history: [],
      loading: false,
      error: null,
      refresh: vi.fn(),
    });

    renderPage();

    expect(screen.getByText('No history data is stored for this currency.')).toBeInTheDocument();
  });

  it('blocks weekends and Korean holidays on the frontend', async () => {
    renderPage();

    await waitFor(() => expect(getKoreanPublicHolidayMap).toHaveBeenCalledWith(2026));

    expect(screen.getByRole('button', { name: '2026-05-23 unavailable: Weekend' })).toBeDisabled();
    expect(screen.getByRole('button', { name: "2026-05-05 unavailable: Children's Day" })).toBeDisabled();
  });

  it('converts detail values with the stored base currency', async () => {
    window.localStorage.setItem('exchangeRate.baseCurrency', 'USD');
    useDetailMock.mockReturnValue({
      detail: eurDetail(),
      loading: false,
      error: null,
      syncError: null,
      refresh: vi.fn(),
    });
    vi.mocked(getExchangeRateDetail).mockResolvedValue({
      ...detail(),
      dealBasR: 1500,
      changeAmount: 0,
      changeRate: 0,
    });

    renderPage();

    await waitFor(() =>
      expect(getExchangeRateDetail).toHaveBeenCalledWith('USD', '2026-05-22'),
    );
    expect(screen.getByText('Values show EUR per 1 USD.')).toBeInTheDocument();
    expect(screen.getByText('1 USD equals')).toBeInTheDocument();
  });
});

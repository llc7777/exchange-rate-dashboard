import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HomePage } from '../HomePage';
import type { ExchangeRate } from '../../types/exchange';

const { useExchangeRatesMock, toggleFavoriteMock } = vi.hoisted(() => ({
  useExchangeRatesMock: vi.fn(),
  toggleFavoriteMock: vi.fn(),
}));

vi.mock('../../hooks/useExchangeRates', () => ({
  useExchangeRates: (keyword: string) => useExchangeRatesMock(keyword),
}));

vi.mock('../../hooks/useFavorites', () => ({
  useFavorites: () => ({
    toggleFavorite: toggleFavoriteMock,
    error: null,
  }),
}));

function rate(code: string): ExchangeRate {
  return {
    id: 1,
    curUnit: code,
    normalizedCurUnit: code,
    curName: `${code} currency`,
    ttb: 1,
    tts: 1,
    dealBasR: 1350,
    bkpr: 1350,
    yyEfeeR: 0,
    tenDdEfeeR: 0,
    kftcDealBasR: 1350,
    kftcBkpr: 1350,
    baseDate: '2026-05-24',
    changeAmount: 0,
    changeRate: 0,
    favorite: false,
  };
}

describe('HomePage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useExchangeRatesMock.mockReset();
    toggleFavoriteMock.mockReset();
  });

  it('renders today exchange-rate list', () => {
    useExchangeRatesMock.mockReturnValue({
      rates: [rate('USD')],
      loading: false,
      error: null,
      refresh: vi.fn(),
    });

    render(<HomePage />, { wrapper: MemoryRouter });

    expect(
      screen.getByText('주말과 공휴일에는 환율이 고시되지 않습니다. 아래 변동률은 최신 영업일 환율을 직전 영업일 환율과 비교해 계산됩니다.'),
    ).toBeInTheDocument();
    expect(screen.getByText('United States Dollar')).toBeInTheDocument();
  });

  it('shows search result after keyword input', async () => {
    useExchangeRatesMock.mockReturnValue({
      rates: [rate('JPY')],
      loading: false,
      error: null,
      refresh: vi.fn(),
    });

    render(<HomePage />, { wrapper: MemoryRouter });

    expect(await screen.findByText('Japanese Yen')).toBeInTheDocument();
  });

  it('keeps the selected base currency when searching', async () => {
    const allRates = [rate('USD'), rate('JPY')];
    const searchedRates = [rate('JPY')];
    useExchangeRatesMock.mockImplementation((keyword: string) => ({
      rates: keyword.trim() ? searchedRates : allRates,
      loading: false,
      error: null,
      refresh: vi.fn(),
    }));

    render(<HomePage />, { wrapper: MemoryRouter });

    const baseSelect = screen.getByLabelText('Base currency') as HTMLSelectElement;
    await waitFor(() => expect(baseSelect).toHaveValue('KRW'));
    fireEvent.change(baseSelect, { target: { value: 'USD' } });
    fireEvent.change(screen.getByLabelText('Search currencies'), {
      target: { value: 'jpy' },
    });

    expect(baseSelect).toHaveValue('USD');
    expect(screen.getByRole('button', { name: 'Open JPY detail' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open USD detail' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Search currencies'), {
      target: { value: '' },
    });
    expect(baseSelect).toHaveValue('USD');
  });

  it('restores the selected base currency from browser storage', async () => {
    window.localStorage.setItem('exchangeRate.baseCurrency', 'USD');
    useExchangeRatesMock.mockReturnValue({
      rates: [rate('USD'), rate('JPY')],
      loading: false,
      error: null,
      refresh: vi.fn(),
    });

    render(<HomePage />, { wrapper: MemoryRouter });

    await waitFor(() =>
      expect(screen.getByLabelText('Base currency')).toHaveValue('USD'),
    );
  });

  it('shows empty state', () => {
    useExchangeRatesMock.mockReturnValue({
      rates: [],
      loading: false,
      error: null,
      refresh: vi.fn(),
    });

    render(<HomePage />, { wrapper: MemoryRouter });

    expect(screen.getByText('No exchange-rate data is stored.')).toBeInTheDocument();
  });

  it('shows error state', () => {
    useExchangeRatesMock.mockReturnValue({
      rates: [],
      loading: false,
      error: 'API failed',
      refresh: vi.fn(),
    });

    render(<HomePage />, { wrapper: MemoryRouter });

    expect(screen.getByText('API failed')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    useExchangeRatesMock.mockReturnValue({
      rates: [],
      loading: true,
      error: null,
      refresh: vi.fn(),
    });

    render(<HomePage />, { wrapper: MemoryRouter });

    expect(screen.getByText('Loading exchange rates...')).toBeInTheDocument();
  });
});

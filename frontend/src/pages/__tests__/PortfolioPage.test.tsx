import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PortfolioPage } from '../PortfolioPage';
import type { PortfolioChangeStatus, PortfolioDashboard } from '../../types/portfolio';

const {
  createAccountMock,
  deleteAccountMock,
  deleteMock,
  refreshMock,
  searchExchangeRatesMock,
  useAuthMock,
  usePortfolioMock,
} = vi.hoisted(() => ({
  createAccountMock: vi.fn(),
  deleteAccountMock: vi.fn(),
  deleteMock: vi.fn(),
  refreshMock: vi.fn(),
  searchExchangeRatesMock: vi.fn(),
  useAuthMock: vi.fn(),
  usePortfolioMock: vi.fn(),
}));

vi.mock('../../api/portfolioApi', () => ({
  createPortfolioAccount: createAccountMock,
  deletePortfolioAccount: deleteAccountMock,
  deletePortfolioTransaction: deleteMock,
  depositPortfolioCash: vi.fn(),
  getExchangeRateForBuy: vi.fn(),
  getExchangeRateForSell: vi.fn(),
}));

vi.mock('../../api/exchangeRateApi', () => ({
  searchExchangeRates: searchExchangeRatesMock,
}));

vi.mock('../../hooks/usePortfolio', () => ({
  usePortfolio: (portfolioId: number | null, enabled: boolean) => usePortfolioMock(portfolioId, enabled),
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}));

function dashboard(status: PortfolioChangeStatus = 'UP'): PortfolioDashboard {
  const amount = status === 'UP' ? 10000 : status === 'DOWN' ? -8500 : 0;
  const rate = status === 'UP' ? 1 : status === 'DOWN' ? -0.85 : 0;
  return {
    account: {
      id: 7,
      name: 'USD Portfolio',
      investmentCurrency: 'USD',
      cashBalance: 500000,
      totalDeposited: 1000000,
      createdAt: '2026-05-20T09:00:00',
      updatedAt: '2026-05-20T09:00:00',
    },
    summary: {
      investmentCurrency: 'USD',
      cashBalance: 500000,
      totalDeposited: 1000000,
      investedCost: 90000,
      currencyValue: 510000,
      totalAssetValue: 1010000,
      profitLoss: amount,
      profitLossRate: rate,
      changeStatus: status,
      positionCount: 1,
      baseDate: '2026-05-22',
    },
    positions: [
      {
        investmentCurrency: 'USD',
        curUnit: 'EUR',
        normalizedCurUnit: 'EUR',
        curName: 'Euro',
        holdingForeignAmount: 100,
        averageBuyRate: 900,
        investedCost: 90000,
        currentRate: 1000,
        currentValue: 100000,
        profitLoss: amount,
        profitLossRate: rate,
        changeStatus: status,
        baseDate: '2026-05-22',
      },
    ],
    recentTransactions: [
      {
        id: 1,
        curUnit: 'EUR',
        normalizedCurUnit: 'EUR',
        curName: 'Euro',
        transactionType: 'BUY',
        transactionDate: '2026-05-20',
        foreignAmount: 100,
        exchangeRate: 900,
        unitFactor: 1,
        amount: 90000,
        memo: 'first buy',
        createdAt: '2026-05-20T10:00:00',
        updatedAt: '2026-05-20T10:00:00',
      },
    ],
  };
}

describe('PortfolioPage', () => {
  beforeEach(() => {
    createAccountMock.mockReset();
    deleteAccountMock.mockReset();
    deleteMock.mockReset();
    refreshMock.mockReset();
    searchExchangeRatesMock.mockReset();
    usePortfolioMock.mockReset();
    useAuthMock.mockReset();
    useAuthMock.mockReturnValue({
      user: { id: 1, email: 'demo@example.com', name: 'Demo User' },
      isAuthenticated: true,
      loading: false,
    });
    usePortfolioMock.mockReturnValue({
      accounts: [dashboard().account],
      dashboard: dashboard(),
      loading: false,
      error: null,
      refresh: refreshMock,
    });
    searchExchangeRatesMock.mockResolvedValue([
      {
        id: 0,
        curUnit: 'KRW',
        normalizedCurUnit: 'KRW',
        curName: 'Korean Won',
        ttb: 1,
        tts: 1,
        dealBasR: 1,
        bkpr: 1,
        yyEfeeR: 0,
        tenDdEfeeR: 0,
        kftcDealBasR: 1,
        kftcBkpr: 1,
        baseDate: '2026-05-22',
        changeAmount: 0,
        changeRate: 0,
        favorite: false,
      },
    ]);
  });

  it('renders summary, positions, recent transactions, and position Sell button', () => {
    render(<PortfolioPage />);

    expect(screen.getByText('Total asset value')).toBeInTheDocument();
    expect(screen.getByText('1,010,000 USD')).toBeInTheDocument();
    expect(screen.getByText('Investment currency:')).toBeInTheDocument();
    expect(screen.getByText('Positions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sell EUR' })).toBeInTheDocument();
    expect(screen.getByText('Recent transactions')).toBeInTheDocument();
    expect(screen.getByText('first buy')).toBeInTheDocument();
  });

  it('renders account creation form when account does not exist', async () => {
    const user = userEvent.setup();
    usePortfolioMock.mockReturnValue({
      accounts: [],
      dashboard: {
        account: null,
        summary: {
          investmentCurrency: null,
          cashBalance: 0,
          totalDeposited: 0,
          investedCost: 0,
          currencyValue: 0,
          totalAssetValue: 0,
          profitLoss: 0,
          profitLossRate: 0,
          changeStatus: 'NO_CHANGE',
          positionCount: 0,
          baseDate: null,
        },
        positions: [],
        recentTransactions: [],
      },
      loading: false,
      error: null,
      refresh: refreshMock,
    });
    createAccountMock.mockResolvedValue({});

    render(<PortfolioPage />);

    await user.type(screen.getByLabelText('Investment currency'), 'KRW');
    await user.click(await screen.findByRole('button', { name: /KRW/i }));
    await user.type(screen.getByLabelText('Initial deposit'), '1000000');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(createAccountMock).toHaveBeenCalledWith({
      name: null,
      investmentCurrency: 'KRW',
      initialDepositAmount: 1000000,
      memo: null,
    }));
  });

  it('renders empty states when there are no positions or transactions', () => {
    usePortfolioMock.mockReturnValue({
      accounts: [dashboard().account],
      dashboard: {
        ...dashboard('NO_CHANGE'),
        positions: [],
        recentTransactions: [],
        summary: {
          ...dashboard('NO_CHANGE').summary,
          cashBalance: 0,
          totalDeposited: 0,
          investedCost: 0,
          currencyValue: 0,
          totalAssetValue: 0,
          positionCount: 0,
          baseDate: null,
        },
      },
      loading: false,
      error: null,
      refresh: refreshMock,
    });

    render(<PortfolioPage />);

    expect(
      screen.getByText('No positions yet. Use the Buy button in this portfolio to add your first position.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('No transactions yet. Deposit cash and buy a currency to start tracking.'),
    ).toBeInTheDocument();
  });

  it('uses an in-app modal when deleting a portfolio', async () => {
    const user = userEvent.setup();
    deleteAccountMock.mockResolvedValue(undefined);

    render(<PortfolioPage />);

    await user.click(screen.getByRole('button', { name: 'Delete portfolio' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete "USD Portfolio"?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete permanently' }));

    await waitFor(() => expect(deleteAccountMock).toHaveBeenCalledWith(7));
    expect(refreshMock).toHaveBeenCalled();
  });
});

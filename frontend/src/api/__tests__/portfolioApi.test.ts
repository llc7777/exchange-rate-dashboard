import { beforeEach, describe, expect, it, vi } from 'vitest';

const { deleteMock, getMock, postMock } = vi.hoisted(() => ({
  deleteMock: vi.fn(),
  getMock: vi.fn(),
  postMock: vi.fn(),
}));

vi.mock('../httpClient', () => ({
  useMockApi: false,
  httpClient: {
    delete: deleteMock,
    get: getMock,
    post: postMock,
  },
  request: async <T>(callback: () => Promise<{ data: T }>) => {
    const response = await callback();
    return response.data;
  },
}));

import {
  buyCurrency,
  createPortfolioAccount,
  deletePortfolioAccount,
  depositPortfolioCash,
  getExchangeRateForBuy,
  getExchangeRateForSell,
  getPortfolioDashboard,
  getPortfolioAccounts,
  getPortfolioPositions,
  getPortfolioTransactions,
  portfolioPaths,
  sellCurrency,
} from '../portfolioApi';

describe('portfolioApi', () => {
  beforeEach(() => {
    deleteMock.mockReset();
    getMock.mockReset();
    postMock.mockReset();
    deleteMock.mockResolvedValue({ data: undefined });
    getMock.mockResolvedValue({ data: {} });
    postMock.mockResolvedValue({ data: {} });
  });

  it('uses account create API path', async () => {
    await createPortfolioAccount({
      name: 'Main USD',
      investmentCurrency: 'USD',
      initialDepositAmount: 100000,
      memo: 'initial deposit',
    });

    expect(postMock).toHaveBeenCalledWith('/portfolio/account', {
      name: 'Main USD',
      investmentCurrency: 'USD',
      initialDepositAmount: 100000,
      memo: 'initial deposit',
    });
  });

  it('uses dashboard and positions API paths', async () => {
    await getPortfolioAccounts();
    await getPortfolioDashboard(7);
    await getPortfolioPositions(7);

    expect(getMock).toHaveBeenCalledWith('/portfolio/accounts');
    expect(getMock).toHaveBeenCalledWith('/portfolio', { params: { portfolioId: 7 } });
    expect(getMock).toHaveBeenCalledWith('/portfolio/positions', { params: { portfolioId: 7 } });
  });

  it('uses account delete API path', async () => {
    await deletePortfolioAccount(7);

    expect(deleteMock).toHaveBeenCalledWith('/portfolio/accounts/7');
  });

  it('uses transactions search query', async () => {
    await getPortfolioTransactions({
      portfolioId: 7,
      curUnit: 'USD',
      transactionType: 'BUY',
      fromDate: '2026-05-01',
      toDate: '2026-05-24',
      page: 1,
      size: 20,
    });

    expect(getMock).toHaveBeenCalledWith('/portfolio/transactions', {
      params: {
        portfolioId: 7,
        curUnit: 'USD',
        transactionType: 'BUY',
        fromDate: '2026-05-01',
        toDate: '2026-05-24',
        page: 1,
        size: 20,
      },
    });
  });

  it('sends deposit request body in currency-neutral camelCase', async () => {
    await depositPortfolioCash({
      portfolioId: 7,
      amount: 1000000,
      memo: 'cash deposit',
    });

    expect(postMock).toHaveBeenCalledWith('/portfolio/deposits', {
      portfolioId: 7,
      amount: 1000000,
      memo: 'cash deposit',
    });
  });

  it('sends buy request body without exchangeRate', async () => {
    await buyCurrency({
      portfolioId: 7,
      curUnit: 'USD',
      transactionDate: '2026-05-20',
      foreignAmount: 100,
      memo: 'first buy',
    });

    expect(postMock).toHaveBeenCalledWith('/portfolio/buy', {
      portfolioId: 7,
      curUnit: 'USD',
      transactionDate: '2026-05-20',
      foreignAmount: 100,
      memo: 'first buy',
    });
    expect(postMock.mock.calls[0][1]).not.toHaveProperty('exchangeRate');
  });

  it('sends sell request body without exchangeRate or transactionDate', async () => {
    await sellCurrency({
      portfolioId: 7,
      curUnit: 'USD',
      foreignAmount: 50,
      memo: null,
    });

    expect(postMock).toHaveBeenCalledWith('/portfolio/sell', {
      portfolioId: 7,
      curUnit: 'USD',
      foreignAmount: 50,
      memo: null,
    });
    expect(postMock.mock.calls[0][1]).not.toHaveProperty('exchangeRate');
    expect(postMock.mock.calls[0][1]).not.toHaveProperty('transactionDate');
  });

  it('uses buy and sell rate API paths', async () => {
    await getExchangeRateForBuy('JPY', '2026-05-22');
    await getExchangeRateForSell('JPY');

    expect(portfolioPaths.buyRate('JPY')).toBe('/exchange-rates/JPY/rate');
    expect(portfolioPaths.sellRate('JPY')).toBe('/exchange-rates/JPY/latest-rate');
    expect(getMock).toHaveBeenCalledWith('/exchange-rates/JPY/rate', {
      params: { date: '2026-05-22' },
    });
    expect(getMock).toHaveBeenCalledWith('/exchange-rates/JPY/latest-rate');
  });
});

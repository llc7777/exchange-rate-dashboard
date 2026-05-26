import { httpClient, request, useMockApi } from './httpClient';
import {
  buyMockCurrency,
  deleteMockPortfolioTransaction,
  depositMockPortfolioCash,
  getMockExchangeRateForBuy,
  getMockExchangeRateForSell,
  getMockPortfolioDashboard,
  getMockPortfolioPosition,
  getMockPortfolioPositions,
  getMockPortfolioSummary,
  getMockPortfolioTransactions,
  createMockPortfolioAccount,
  sellMockCurrency,
} from './mockApi';
import type {
  ExchangeRateForTransaction,
  PortfolioAccount,
  PortfolioAccountCreateRequest,
  PortfolioBuyRequest,
  PortfolioDashboard,
  PortfolioDepositRequest,
  PortfolioPosition,
  PortfolioSellRequest,
  PortfolioSummary,
  PortfolioTransaction,
  PortfolioTransactionPage,
  PortfolioTransactionType,
} from '../types/portfolio';

export const portfolioPaths = {
  dashboard: '/portfolio',
  account: '/portfolio/account',
  accounts: '/portfolio/accounts',
  accountById: (portfolioId: number) => `/portfolio/accounts/${portfolioId}`,
  summary: '/portfolio/summary',
  positions: '/portfolio/positions',
  position: (curUnit: string) => `/portfolio/positions/${encodeURIComponent(curUnit)}`,
  transactions: '/portfolio/transactions',
  transaction: (transactionId: number) => `/portfolio/transactions/${transactionId}`,
  deposit: '/portfolio/deposits',
  buy: '/portfolio/buy',
  sell: '/portfolio/sell',
  buyRate: (curUnit: string) => `/exchange-rates/${encodeURIComponent(curUnit)}/rate`,
  sellRate: (curUnit: string) => `/exchange-rates/${encodeURIComponent(curUnit)}/latest-rate`,
};

export interface PortfolioTransactionQuery {
  portfolioId?: number;
  curUnit?: string;
  transactionType?: PortfolioTransactionType;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}

function portfolioIdParams(portfolioId?: number | null) {
  return portfolioId ? { portfolioId } : {};
}

export async function createPortfolioAccount(
  body: PortfolioAccountCreateRequest,
): Promise<PortfolioAccount> {
  if (useMockApi) {
    return createMockPortfolioAccount(body);
  }
  return request(() => httpClient.post<PortfolioAccount>(portfolioPaths.account, body));
}

export async function getPortfolioAccounts(): Promise<PortfolioAccount[]> {
  if (useMockApi) {
    const dashboard = await getMockPortfolioDashboard();
    return dashboard.account ? [dashboard.account] : [];
  }
  return request(() => httpClient.get<PortfolioAccount[]>(portfolioPaths.accounts));
}

export async function deletePortfolioAccount(portfolioId: number): Promise<void> {
  if (useMockApi) {
    return;
  }
  await request(() => httpClient.delete<void>(portfolioPaths.accountById(portfolioId)));
}

export async function getPortfolioDashboard(portfolioId?: number | null): Promise<PortfolioDashboard> {
  if (useMockApi) {
    return getMockPortfolioDashboard();
  }
  return request(() =>
    httpClient.get<PortfolioDashboard>(portfolioPaths.dashboard, {
      params: portfolioIdParams(portfolioId),
    }),
  );
}

export async function getPortfolioSummary(portfolioId?: number | null): Promise<PortfolioSummary> {
  if (useMockApi) {
    return getMockPortfolioSummary();
  }
  return request(() =>
    httpClient.get<PortfolioSummary>(portfolioPaths.summary, {
      params: portfolioIdParams(portfolioId),
    }),
  );
}

export async function getPortfolioPositions(portfolioId?: number | null): Promise<PortfolioPosition[]> {
  if (useMockApi) {
    return getMockPortfolioPositions();
  }
  return request(() =>
    httpClient.get<PortfolioPosition[]>(portfolioPaths.positions, {
      params: portfolioIdParams(portfolioId),
    }),
  );
}

export async function getPortfolioPosition(
  curUnit: string,
  portfolioId?: number | null,
): Promise<PortfolioPosition> {
  if (useMockApi) {
    return getMockPortfolioPosition(curUnit);
  }
  return request(() =>
    httpClient.get<PortfolioPosition>(portfolioPaths.position(curUnit), {
      params: portfolioIdParams(portfolioId),
    }),
  );
}

export async function getPortfolioTransactions(
  params: PortfolioTransactionQuery = {},
): Promise<PortfolioTransactionPage> {
  if (useMockApi) {
    return getMockPortfolioTransactions(params);
  }
  return request(() =>
    httpClient.get<PortfolioTransactionPage>(portfolioPaths.transactions, { params }),
  );
}

export async function depositPortfolioCash(body: PortfolioDepositRequest): Promise<PortfolioAccount> {
  if (useMockApi) {
    return depositMockPortfolioCash(body);
  }
  return request(() => httpClient.post<PortfolioAccount>(portfolioPaths.deposit, body));
}

export async function buyCurrency(body: PortfolioBuyRequest): Promise<PortfolioTransaction> {
  if (useMockApi) {
    return buyMockCurrency(body);
  }
  return request(() => httpClient.post<PortfolioTransaction>(portfolioPaths.buy, body));
}

export async function sellCurrency(body: PortfolioSellRequest): Promise<PortfolioTransaction> {
  if (useMockApi) {
    return sellMockCurrency(body);
  }
  return request(() => httpClient.post<PortfolioTransaction>(portfolioPaths.sell, body));
}

export async function deletePortfolioTransaction(transactionId: number): Promise<void> {
  if (useMockApi) {
    return deleteMockPortfolioTransaction(transactionId);
  }
  await request(() => httpClient.delete<void>(portfolioPaths.transaction(transactionId)));
}

export async function getExchangeRateForBuy(
  curUnit: string,
  date: string,
): Promise<ExchangeRateForTransaction> {
  if (useMockApi) {
    return getMockExchangeRateForBuy(curUnit, date);
  }
  return request(() =>
    httpClient.get<ExchangeRateForTransaction>(portfolioPaths.buyRate(curUnit), {
      params: { date },
    }),
  );
}

export async function getExchangeRateForSell(curUnit: string): Promise<ExchangeRateForTransaction> {
  if (useMockApi) {
    return getMockExchangeRateForSell(curUnit);
  }
  return request(() => httpClient.get<ExchangeRateForTransaction>(portfolioPaths.sellRate(curUnit)));
}

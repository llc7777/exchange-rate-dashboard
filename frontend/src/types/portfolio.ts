export type PortfolioTransactionType = 'BUY' | 'SELL' | 'DEPOSIT';
export type PortfolioChangeStatus = 'UP' | 'DOWN' | 'NO_CHANGE';

export interface PortfolioAccountCreateRequest {
  name?: string | null;
  investmentCurrency: string;
  initialDepositAmount: number;
  memo?: string | null;
}

export interface PortfolioDepositRequest {
  portfolioId: number;
  amount: number;
  memo?: string | null;
}

export interface PortfolioBuyRequest {
  portfolioId: number;
  curUnit: string;
  transactionDate: string;
  foreignAmount: number;
  memo?: string | null;
}

export interface PortfolioSellRequest {
  portfolioId: number;
  curUnit: string;
  foreignAmount: number;
  memo?: string | null;
}

export interface PortfolioAccount {
  id: number;
  name: string;
  investmentCurrency: string;
  cashBalance: number;
  totalDeposited: number;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioTransaction {
  id: number;
  curUnit: string | null;
  normalizedCurUnit: string | null;
  curName: string;
  transactionType: PortfolioTransactionType;
  transactionDate: string;
  foreignAmount: number | null;
  exchangeRate: number | null;
  unitFactor: number | null;
  amount: number;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioPosition {
  investmentCurrency: string;
  curUnit: string;
  normalizedCurUnit: string;
  curName: string;
  holdingForeignAmount: number;
  averageBuyRate: number;
  investedCost: number;
  currentRate: number;
  currentValue: number;
  profitLoss: number;
  profitLossRate: number;
  changeStatus: PortfolioChangeStatus;
  baseDate: string;
}

export interface PortfolioSummary {
  investmentCurrency: string | null;
  cashBalance: number;
  totalDeposited: number;
  investedCost: number;
  currencyValue: number;
  totalAssetValue: number;
  profitLoss: number;
  profitLossRate: number;
  changeStatus: PortfolioChangeStatus;
  positionCount: number;
  baseDate: string | null;
}

export interface PortfolioDashboard {
  account: PortfolioAccount | null;
  summary: PortfolioSummary;
  positions: PortfolioPosition[];
  recentTransactions: PortfolioTransaction[];
}

export interface ExchangeRateForTransaction {
  curUnit: string;
  normalizedCurUnit: string;
  curName: string;
  baseDate: string;
  dealBasR: number;
  unitFactor: number;
}

export interface PortfolioTransactionPage {
  content: PortfolioTransaction[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

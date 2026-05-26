import type {
  ExchangeCalculateRequest,
  ExchangeCalculateResponse,
  ExchangeRate,
  ExchangeRateHistory,
} from '../types/exchange';
import type { AuthLoginRequest, AuthRegisterRequest, AuthResponse, AuthUser } from '../types/auth';
import type { FavoriteCurrency } from '../types/favorite';
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
} from '../types/portfolio';

const delay = () => new Promise((resolve) => window.setTimeout(resolve, 120));

let mockRates: ExchangeRate[] = [
  rate(1, 'USD', 'United States Dollar', 1360.15, 2.15, 0.16, true),
  rate(2, 'JPY(100)', 'Japanese Yen', 918.3, -1.8, -0.2, false),
  rate(3, 'EUR', 'Euro', 1478.42, 0, 0, false),
  rate(4, 'CNH', 'Chinese Yuan', 188.72, 0.34, 0.18, false),
  rate(5, 'GBP', 'British Pound', 1732.21, 5.5, 0.32, true),
  rate(6, 'AUD', 'Australian Dollar', 902.44, -3.1, -0.34, false),
  rate(7, 'CAD', 'Canadian Dollar', 995.81, 1.2, 0.12, false),
  rate(8, 'KRW', 'Korean Won', 1, 0, 0, false),
];

let mockPortfolioAccount: PortfolioAccount | null = null;
let mockPortfolioTransactions: PortfolioTransaction[] = [];

let mockUser: AuthUser = {
  id: 1,
  email: 'demo@example.com',
  name: 'Demo User',
};

let mockPassword = 'password!123';

function rate(
  id: number,
  curUnit: string,
  curName: string,
  dealBasR: number,
  changeAmount: number,
  changeRate: number,
  favorite: boolean,
): ExchangeRate {
  const normalizedCurUnit = curUnit.includes('(') ? curUnit.slice(0, curUnit.indexOf('(')) : curUnit;
  return {
    id,
    curUnit,
    normalizedCurUnit,
    curName,
    ttb: dealBasR - 6,
    tts: dealBasR + 6,
    dealBasR,
    bkpr: dealBasR,
    yyEfeeR: 0,
    tenDdEfeeR: 0,
    kftcDealBasR: dealBasR,
    kftcBkpr: dealBasR,
    baseDate: '2026-05-24',
    changeAmount,
    changeRate,
    favorite,
  };
}

function findRate(curUnit: string) {
  const normalized = normalize(curUnit);
  return mockRates.find((item) => item.normalizedCurUnit === normalized || item.curUnit === curUnit);
}

function normalize(curUnit: string) {
  const upper = curUnit.trim().toUpperCase();
  return upper.includes('(') ? upper.slice(0, upper.indexOf('(')) : upper;
}

function getMockUnitFactor(curUnit: string) {
  return curUnit.toUpperCase().includes('(100)') ? 100 : 1;
}

function toFavorite(rate: ExchangeRate): FavoriteCurrency {
  return {
    curUnit: rate.curUnit,
    normalizedCurUnit: rate.normalizedCurUnit,
    curName: rate.curName,
    ttb: rate.ttb,
    tts: rate.tts,
    dealBasR: rate.dealBasR,
    changeAmount: rate.changeAmount,
    changeRate: rate.changeRate,
    baseDate: rate.baseDate,
  };
}

function nowIso() {
  return new Date().toISOString();
}

function ensureMockPortfolio() {
  if (!mockPortfolioAccount) {
    throw new Error('Portfolio account not found.');
  }
  return mockPortfolioAccount;
}

function setTransactions(transactions: PortfolioTransaction[]) {
  mockPortfolioTransactions = transactions;
}

function rateForTransaction(curUnit: string, date?: string): ExchangeRateForTransaction {
  const found = findRate(curUnit);
  if (!found) {
    throw new Error('Exchange rate not found.');
  }
  return {
    curUnit: found.curUnit,
    normalizedCurUnit: found.normalizedCurUnit,
    curName: found.curName,
    baseDate: date || found.baseDate,
    dealBasR: found.dealBasR,
    unitFactor: getMockUnitFactor(found.curUnit),
  };
}

export async function getMockTodayExchangeRates(): Promise<ExchangeRate[]> {
  await delay();
  return [...mockRates];
}

export async function searchMockExchangeRates(keyword: string): Promise<ExchangeRate[]> {
  await delay();
  const value = keyword.trim().toLowerCase();
  if (!value) {
    return [...mockRates];
  }
  return mockRates.filter((rate) =>
    [rate.curUnit, rate.normalizedCurUnit, rate.curName].some((field) =>
      field.toLowerCase().includes(value),
    ),
  );
}

export async function getMockExchangeRateDetail(curUnit: string): Promise<ExchangeRate> {
  await delay();
  const found = findRate(curUnit);
  if (!found) {
    throw new Error('Exchange rate not found.');
  }
  return found;
}

export async function getMockExchangeHistory(curUnit: string): Promise<ExchangeRateHistory[]> {
  await delay();
  const base = findRate(curUnit)?.dealBasR ?? 1000;
  const normalized = normalize(curUnit);
  const length = normalized === 'AUD' ? 3 : normalized === 'CAD' ? 9 : 7;
  return Array.from({ length }, (_, index) => ({
    baseDate: `2026-05-${String(18 + index).padStart(2, '0')}`,
    dealBasR: Number((base - (length - index) * 1.7).toFixed(2)),
  }));
}

export async function calculateMockExchangeRate(
  request: ExchangeCalculateRequest,
): Promise<ExchangeCalculateResponse> {
  await delay();
  const fromRate = findRate(request.fromCurrency)?.dealBasR ?? 1;
  const toRate = findRate(request.toCurrency)?.dealBasR ?? 1;
  const appliedRate = request.fromCurrency === 'KRW' ? 1 / toRate : fromRate / toRate;
  return {
    ...request,
    convertedAmount: Number((request.amount * appliedRate).toFixed(4)),
    appliedRate: Number(appliedRate.toFixed(8)),
  };
}

export async function getMockFavorites(): Promise<FavoriteCurrency[]> {
  await delay();
  return mockRates.filter((rate) => rate.favorite).map(toFavorite);
}

export async function addMockFavorite(curUnit: string): Promise<FavoriteCurrency> {
  await delay();
  const found = findRate(curUnit);
  if (!found) {
    throw new Error('Exchange rate not found.');
  }
  mockRates = mockRates.map((rate) =>
    rate.normalizedCurUnit === found.normalizedCurUnit ? { ...rate, favorite: true } : rate,
  );
  return toFavorite({ ...found, favorite: true });
}

export async function deleteMockFavorite(curUnit: string): Promise<void> {
  await delay();
  const normalized = normalize(curUnit);
  mockRates = mockRates.map((rate) =>
    rate.normalizedCurUnit === normalized ? { ...rate, favorite: false } : rate,
  );
}

export async function getMockExchangeRateForBuy(
  curUnit: string,
  date: string,
): Promise<ExchangeRateForTransaction> {
  await delay();
  return rateForTransaction(curUnit, date);
}

export async function getMockExchangeRateForSell(curUnit: string): Promise<ExchangeRateForTransaction> {
  await delay();
  return rateForTransaction(curUnit);
}

export async function createMockPortfolioAccount(
  request: PortfolioAccountCreateRequest,
): Promise<PortfolioAccount> {
  await delay();
  if (mockPortfolioAccount) {
    throw new Error('Portfolio account already exists.');
  }
  const now = nowIso();
  const investmentCurrency = normalize(request.investmentCurrency);
  mockPortfolioAccount = {
    id: Date.now(),
    name: request.name?.trim() || `${investmentCurrency} Portfolio`,
    investmentCurrency,
    cashBalance: request.initialDepositAmount,
    totalDeposited: request.initialDepositAmount,
    createdAt: now,
    updatedAt: now,
  };
  mockPortfolioTransactions = [{
    id: Date.now() + 1,
    curUnit: investmentCurrency,
    normalizedCurUnit: investmentCurrency,
    curName: `${investmentCurrency} Deposit`,
    transactionType: 'DEPOSIT',
    transactionDate: new Date().toISOString().slice(0, 10),
    foreignAmount: 0,
    exchangeRate: 1,
    unitFactor: 1,
    amount: request.initialDepositAmount,
    memo: request.memo ?? null,
    createdAt: now,
    updatedAt: now,
  }];
  return mockPortfolioAccount;
}

export async function getMockPortfolioDashboard(): Promise<PortfolioDashboard> {
  await delay();
  if (!mockPortfolioAccount) {
    return {
      account: null,
      summary: buildMockSummary(null, []),
      positions: [],
      recentTransactions: [],
    };
  }
  const positions = buildMockPositions();
  return {
    account: mockPortfolioAccount,
    summary: buildMockSummary(mockPortfolioAccount, positions),
    positions,
    recentTransactions: [...mockPortfolioTransactions].sort((left, right) => right.id - left.id).slice(0, 10),
  };
}

export async function getMockPortfolioSummary(): Promise<PortfolioSummary> {
  await delay();
  return buildMockSummary(mockPortfolioAccount, mockPortfolioAccount ? buildMockPositions() : []);
}

export async function getMockPortfolioPositions(): Promise<PortfolioPosition[]> {
  await delay();
  ensureMockPortfolio();
  return buildMockPositions();
}

export async function getMockPortfolioPosition(curUnit: string): Promise<PortfolioPosition> {
  await delay();
  const normalized = normalize(curUnit);
  const found = buildMockPositions().find((position) => position.normalizedCurUnit === normalized);
  if (!found) {
    throw new Error('Portfolio position not found.');
  }
  return found;
}

export async function getMockPortfolioTransactions(_params?: unknown): Promise<PortfolioTransactionPage> {
  await delay();
  const content = [...mockPortfolioTransactions].sort((left, right) => right.id - left.id);
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    number: 0,
    size: content.length,
  };
}

export async function depositMockPortfolioCash(request: PortfolioDepositRequest): Promise<PortfolioAccount> {
  await delay();
  const account = ensureMockPortfolio();
  account.cashBalance += request.amount;
  account.totalDeposited += request.amount;
  account.updatedAt = nowIso();
  setTransactions([
    {
      id: Date.now(),
      curUnit: account.investmentCurrency,
      normalizedCurUnit: account.investmentCurrency,
      curName: `${account.investmentCurrency} Deposit`,
      transactionType: 'DEPOSIT',
      transactionDate: new Date().toISOString().slice(0, 10),
      foreignAmount: 0,
      exchangeRate: 1,
      unitFactor: 1,
      amount: request.amount,
      memo: request.memo ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    ...mockPortfolioTransactions,
  ]);
  return account;
}

export async function buyMockCurrency(request: PortfolioBuyRequest): Promise<PortfolioTransaction> {
  await delay();
  const account = ensureMockPortfolio();
  const rate = rateForTransaction(request.curUnit, request.transactionDate);
  const investmentRate = account.investmentCurrency === 'KRW'
    ? { dealBasR: 1, unitFactor: 1 }
    : rateForTransaction(account.investmentCurrency, request.transactionDate);
  const paymentAmount =
    ((request.foreignAmount * rate.dealBasR) / rate.unitFactor) /
    (investmentRate.dealBasR / investmentRate.unitFactor);
  if (account.cashBalance < paymentAmount) {
    throw new Error('Cash balance is insufficient.');
  }
  account.cashBalance -= paymentAmount;
  account.updatedAt = nowIso();
  const created: PortfolioTransaction = {
    id: Date.now(),
    curUnit: rate.curUnit,
    normalizedCurUnit: rate.normalizedCurUnit,
    curName: rate.curName,
    transactionType: 'BUY',
    transactionDate: rate.baseDate,
    foreignAmount: request.foreignAmount,
    exchangeRate: rate.dealBasR / (investmentRate.dealBasR / investmentRate.unitFactor),
    unitFactor: rate.unitFactor,
    amount: paymentAmount,
    memo: request.memo ?? null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  setTransactions([created, ...mockPortfolioTransactions]);
  return created;
}

export async function sellMockCurrency(request: PortfolioSellRequest): Promise<PortfolioTransaction> {
  await delay();
  const account = ensureMockPortfolio();
  const rate = rateForTransaction(request.curUnit);
  const holding = buildMockPositions().find((position) => position.normalizedCurUnit === rate.normalizedCurUnit)
    ?.holdingForeignAmount ?? 0;
  if (holding < request.foreignAmount) {
    throw new Error('Sell amount cannot exceed the current holding amount.');
  }
  const investmentRate = account.investmentCurrency === 'KRW'
    ? { dealBasR: 1, unitFactor: 1 }
    : rateForTransaction(account.investmentCurrency, rate.baseDate);
  const proceedsAmount =
    ((request.foreignAmount * rate.dealBasR) / rate.unitFactor) /
    (investmentRate.dealBasR / investmentRate.unitFactor);
  account.cashBalance += proceedsAmount;
  account.updatedAt = nowIso();
  const created: PortfolioTransaction = {
    id: Date.now(),
    curUnit: rate.curUnit,
    normalizedCurUnit: rate.normalizedCurUnit,
    curName: rate.curName,
    transactionType: 'SELL',
    transactionDate: rate.baseDate,
    foreignAmount: request.foreignAmount,
    exchangeRate: rate.dealBasR / (investmentRate.dealBasR / investmentRate.unitFactor),
    unitFactor: rate.unitFactor,
    amount: proceedsAmount,
    memo: request.memo ?? null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  setTransactions([created, ...mockPortfolioTransactions]);
  return created;
}

export async function deleteMockPortfolioTransaction(transactionId: number): Promise<void> {
  await delay();
  setTransactions(mockPortfolioTransactions.filter((transaction) => transaction.id !== transactionId));
}

function buildMockPositions(): PortfolioPosition[] {
  const account = ensureMockPortfolio();
  const byCurrency = new Map<string, PortfolioTransaction[]>();
  mockPortfolioTransactions
    .filter((transaction) => transaction.transactionType !== 'DEPOSIT' && transaction.normalizedCurUnit)
    .forEach((transaction) => {
      const normalized = transaction.normalizedCurUnit as string;
      byCurrency.set(normalized, [...(byCurrency.get(normalized) ?? []), transaction]);
    });

  return Array.from(byCurrency.entries())
    .map(([normalizedCurUnit, transactions]) => {
      const found = findRate(normalizedCurUnit);
      if (!found) {
        return null;
      }
      const holding = transactions.reduce(
        (sum, item) =>
          item.transactionType === 'BUY'
            ? sum + (item.foreignAmount ?? 0)
            : sum - (item.foreignAmount ?? 0),
        0,
      );
      if (holding <= 0) {
        return null;
      }
      const buyCost = transactions
        .filter((item) => item.transactionType === 'BUY')
        .reduce((sum, item) => sum + item.amount, 0);
      const buyAmount = transactions
        .filter((item) => item.transactionType === 'BUY')
        .reduce((sum, item) => sum + (item.foreignAmount ?? 0), 0);
      const unitFactor = getMockUnitFactor(found.curUnit);
      const averageBuyRate = buyAmount === 0 ? 0 : (buyCost * unitFactor) / buyAmount;
      const investedCost = (holding * averageBuyRate) / unitFactor;
      const investmentRate = account.investmentCurrency === 'KRW'
        ? { dealBasR: 1, unitFactor: 1 }
        : rateForTransaction(account.investmentCurrency, found.baseDate);
      const currentValue =
        ((holding * found.dealBasR) / unitFactor) /
        (investmentRate.dealBasR / investmentRate.unitFactor);
      const profit = currentValue - investedCost;
      const profitRate = investedCost === 0 ? 0 : (profit / investedCost) * 100;
      return {
        investmentCurrency: account.investmentCurrency,
        curUnit: found.curUnit,
        normalizedCurUnit,
        curName: found.curName,
        holdingForeignAmount: holding,
        averageBuyRate,
        investedCost,
        currentRate: found.dealBasR,
        currentValue,
        profitLoss: profit,
        profitLossRate: profitRate,
        changeStatus: profit > 0 ? 'UP' : profit < 0 ? 'DOWN' : 'NO_CHANGE',
        baseDate: found.baseDate,
      } satisfies PortfolioPosition;
    })
    .filter((position): position is PortfolioPosition => Boolean(position));
}

function buildMockSummary(
  account: PortfolioAccount | null,
  positions: PortfolioPosition[],
): PortfolioSummary {
  const investedCost = positions.reduce((sum, position) => sum + position.investedCost, 0);
  const currencyValue = positions.reduce((sum, position) => sum + position.currentValue, 0);
  const cashBalance = account?.cashBalance ?? 0;
  const totalDeposited = account?.totalDeposited ?? 0;
  const totalAssetValue = cashBalance + currencyValue;
  const profitLoss = totalAssetValue - totalDeposited;
  const profitLossRate = totalDeposited === 0 ? 0 : (profitLoss / totalDeposited) * 100;
  return {
    investmentCurrency: account?.investmentCurrency ?? null,
    cashBalance,
    totalDeposited,
    investedCost,
    currencyValue,
    totalAssetValue,
    profitLoss,
    profitLossRate,
    changeStatus: profitLoss > 0 ? 'UP' : profitLoss < 0 ? 'DOWN' : 'NO_CHANGE',
    positionCount: positions.length,
    baseDate: positions[0]?.baseDate ?? null,
  };
}

export async function registerMockUser(request: AuthRegisterRequest): Promise<AuthResponse> {
  await delay();
  mockUser = {
    id: Date.now(),
    email: request.email.trim().toLowerCase(),
    name: request.name.trim(),
  };
  mockPassword = request.password;
  return toAuthResponse(mockUser);
}

export async function loginMockUser(request: AuthLoginRequest): Promise<AuthResponse> {
  await delay();
  if (request.email.trim().toLowerCase() !== mockUser.email || request.password !== mockPassword) {
    throw new Error('Invalid email or password.');
  }
  return toAuthResponse(mockUser);
}

export async function getMockCurrentUser(): Promise<AuthUser> {
  await delay();
  return mockUser;
}

function toAuthResponse(user: AuthUser): AuthResponse {
  return {
    accessToken: 'mock-access-token',
    tokenType: 'Bearer',
    user,
  };
}

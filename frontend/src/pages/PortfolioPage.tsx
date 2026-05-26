import { type FormEvent, useEffect, useState } from 'react';

import {
  createPortfolioAccount,
  deletePortfolioAccount,
  deletePortfolioTransaction,
} from '../api/portfolioApi';
import { searchExchangeRates } from '../api/exchangeRateApi';
import { toAppApiError } from '../api/httpClient';
import { AuthFeaturePanel } from '../components/auth/AuthFeaturePanel';
import { Button } from '../components/common/Button';
import { EmptyView } from '../components/common/EmptyView';
import { ErrorView } from '../components/common/ErrorView';
import { LoadingView } from '../components/common/LoadingView';
import { Modal } from '../components/common/Modal';
import { BuyModal } from '../components/portfolio/BuyModal';
import { CurrencySearchForPortfolio } from '../components/portfolio/CurrencySearchForPortfolio';
import { DepositForm } from '../components/portfolio/DepositForm';
import { PortfolioPositionList } from '../components/portfolio/PortfolioPositionList';
import { PortfolioSummaryCard } from '../components/portfolio/PortfolioSummaryCard';
import { PortfolioTransactionList } from '../components/portfolio/PortfolioTransactionList';
import { SellModal } from '../components/portfolio/SellModal';
import { useAuth } from '../hooks/useAuth';
import { usePortfolio } from '../hooks/usePortfolio';
import type { ExchangeRate } from '../types/exchange';
import type { PortfolioPosition } from '../types/portfolio';
import { getEnglishCurrencyName } from '../utils/currencyName';

interface PendingBuy {
  curUnit: string;
  curName: string;
}

export function PortfolioPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const { accounts, dashboard, loading, error, refresh } = usePortfolio(
    selectedPortfolioId,
    isAuthenticated && !authLoading,
  );
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingBuy, setPendingBuy] = useState<PendingBuy | null>(null);
  const [pendingSell, setPendingSell] = useState<PortfolioPosition | null>(null);
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const account = dashboard?.account ?? null;
  const investmentCurrency = account?.investmentCurrency ?? '';
  const cashBalance = dashboard?.summary.cashBalance ?? 0;
  const selectedStorageKey = user ? `portfolio:selected:${user.id}` : null;

  useEffect(() => {
    if (!selectedStorageKey) {
      setSelectedPortfolioId(null);
      return;
    }
    const storedValue = window.localStorage.getItem(selectedStorageKey);
    setSelectedPortfolioId(storedValue ? Number(storedValue) : null);
  }, [selectedStorageKey]);

  useEffect(() => {
    if (!selectedStorageKey || accounts.length === 0) {
      return;
    }
    const selectedExists = accounts.some((candidate) => candidate.id === selectedPortfolioId);
    if (!selectedPortfolioId || !selectedExists) {
      const fallbackId = accounts[0].id;
      setSelectedPortfolioId(fallbackId);
      window.localStorage.setItem(selectedStorageKey, String(fallbackId));
    }
  }, [accounts, selectedPortfolioId, selectedStorageKey]);

  async function handleCreateAccount(
    name: string | null,
    investmentCurrency: string,
    initialDepositAmount: number,
    memo: string | null,
  ) {
    setCreateError(null);
    try {
      const createdAccount = await createPortfolioAccount({
        name,
        investmentCurrency,
        initialDepositAmount,
        memo,
      });
      setSelectedPortfolioId(createdAccount.id);
      if (selectedStorageKey) {
        window.localStorage.setItem(selectedStorageKey, String(createdAccount.id));
      }
      await refresh(createdAccount.id);
    } catch (error) {
      setCreateError(toAppApiError(error).message);
    }
  }

  async function handleDelete(transactionId: number) {
    setDeleteError(null);
    try {
      await deletePortfolioTransaction(transactionId);
      await refresh();
    } catch (error) {
      setDeleteError(toAppApiError(error).message);
    }
  }

  async function confirmDeleteAccount() {
    if (!account) {
      return;
    }

    setDeleteError(null);
    setDeletingAccount(true);
    try {
      await deletePortfolioAccount(account.id);
      if (selectedStorageKey) {
        window.localStorage.removeItem(selectedStorageKey);
      }
      setSelectedPortfolioId(null);
      setDeleteAccountModalOpen(false);
      await refresh();
    } catch (error) {
      setDeleteError(toAppApiError(error).message);
    } finally {
      setDeletingAccount(false);
    }
  }

  function handleSelectPortfolio(portfolioId: number) {
    setSelectedPortfolioId(portfolioId);
    if (selectedStorageKey) {
      window.localStorage.setItem(selectedStorageKey, String(portfolioId));
    }
  }

  function openBuyFromRate(rate: ExchangeRate) {
    setPendingBuy({
      curUnit: rate.normalizedCurUnit,
      curName: getEnglishCurrencyName(rate.normalizedCurUnit, rate.curName),
    });
  }

  function openBuyForPosition(curUnit: string, curName: string) {
    setPendingBuy({
      curUnit,
      curName: getEnglishCurrencyName(curUnit, curName),
    });
  }

  if (authLoading) {
    return <LoadingView label="Checking login session..." />;
  }

  if (!isAuthenticated) {
    return (
      <AuthFeaturePanel
        title="Log in to use portfolios"
        description="Portfolio tracking is available after login. Register to create multiple simulated portfolios, choose an investment currency, and track buy/sell profit or loss."
      />
    );
  }

  return (
    <section className="grid gap-5">
      <div>
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <p className="mt-2 text-sm text-muted">
          Create multiple simulated portfolios, choose an investment currency for each one, then buy or sell currencies only from this page.
        </p>
      </div>

      {loading ? <LoadingView label="Loading portfolio..." /> : null}
      {error ? <ErrorView message={error} onRetry={refresh} /> : null}
      {createError ? <ErrorView message={createError} /> : null}
      {deleteError ? <ErrorView message={deleteError} /> : null}

      {accounts.length > 0 ? (
        <section className="rounded-app border border-line bg-panel p-5 shadow-sm">
          <label className="grid gap-1 text-sm font-semibold md:max-w-sm">
            Active portfolio
            <select
              value={account?.id ?? selectedPortfolioId ?? ''}
              onChange={(event) => handleSelectPortfolio(Number(event.target.value))}
              className="rounded-app border border-line bg-panel px-3 py-2"
            >
              {accounts.map((portfolioAccount) => (
                <option key={portfolioAccount.id} value={portfolioAccount.id}>
                  {portfolioAccount.name} - {portfolioAccount.investmentCurrency}
                </option>
              ))}
            </select>
          </label>
          {account ? (
            <div className="mt-3">
              <Button type="button" variant="danger" onClick={() => setDeleteAccountModalOpen(true)}>
                Delete portfolio
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}

      {!loading && !account ? (
        <>
          <PortfolioAccountCreateForm onCreate={handleCreateAccount} />
          <EmptyView message="Create a portfolio account first. Choose its investment currency and initial deposit." />
        </>
      ) : null}

      {dashboard && account && !loading ? (
        <>
          <PortfolioAccountCreateForm
            compact
            onCreate={handleCreateAccount}
          />
          <PortfolioSummaryCard summary={dashboard.summary} />
          <DepositForm
            portfolioId={account.id}
            cashBalance={cashBalance}
            investmentCurrency={investmentCurrency}
            onSuccess={refresh}
          />
          <CurrencySearchForPortfolio
            disabled={cashBalance <= 0}
            investmentCurrency={investmentCurrency}
            onBuy={openBuyFromRate}
          />
          <PortfolioPositionList
            positions={dashboard.positions}
            investmentCurrency={investmentCurrency}
            onBuy={openBuyForPosition}
            onSell={setPendingSell}
          />
          <PortfolioTransactionList
            transactions={dashboard.recentTransactions}
            investmentCurrency={investmentCurrency}
            onDelete={handleDelete}
          />
        </>
      ) : null}

      {pendingBuy && account ? (
        <BuyModal
          open={Boolean(pendingBuy)}
          portfolioId={account.id}
          targetCurrency={pendingBuy.curUnit}
          targetCurrencyName={pendingBuy.curName}
          investmentCurrency={investmentCurrency}
          cashBalance={cashBalance}
          onClose={() => setPendingBuy(null)}
          onSuccess={refresh}
        />
      ) : null}

      {pendingSell && account ? (
        <SellModal
          open={Boolean(pendingSell)}
          portfolioId={account.id}
          investmentCurrency={investmentCurrency}
          position={pendingSell}
          onClose={() => setPendingSell(null)}
          onSuccess={refresh}
        />
      ) : null}

      {account ? (
        <DeletePortfolioModal
          open={deleteAccountModalOpen}
          portfolioName={account.name}
          deleting={deletingAccount}
          onClose={() => {
            if (!deletingAccount) {
              setDeleteAccountModalOpen(false);
            }
          }}
          onConfirm={confirmDeleteAccount}
        />
      ) : null}
    </section>
  );
}

interface DeletePortfolioModalProps {
  open: boolean;
  portfolioName: string;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

function DeletePortfolioModal({
  open,
  portfolioName,
  deleting,
  onClose,
  onConfirm,
}: DeletePortfolioModalProps) {
  return (
    <Modal open={open} title="Delete portfolio" onClose={onClose}>
      <div className="grid gap-4">
        <div className="rounded-app border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Delete "{portfolioName}"?</p>
          <p className="mt-1">
            This will permanently delete the portfolio and all of its transactions.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" disabled={deleting} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="danger" disabled={deleting} onClick={onConfirm}>
            {deleting ? 'Deleting...' : 'Delete permanently'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface PortfolioAccountCreateFormProps {
  onCreate: (
    name: string | null,
    investmentCurrency: string,
    initialDepositAmount: number,
    memo: string | null,
  ) => void | Promise<void>;
  compact?: boolean;
}

function PortfolioAccountCreateForm({ onCreate, compact = false }: PortfolioAccountCreateFormProps) {
  const [name, setName] = useState('');
  const [investmentCurrency, setInvestmentCurrency] = useState('');
  const [currencyKeyword, setCurrencyKeyword] = useState('');
  const [currencyResults, setCurrencyResults] = useState<ExchangeRate[]>([]);
  const [currencyLoading, setCurrencyLoading] = useState(false);
  const [currencyError, setCurrencyError] = useState<string | null>(null);
  const [initialDepositAmount, setInitialDepositAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const keyword = currencyKeyword.trim();
    if (!keyword) {
      setCurrencyResults([]);
      setCurrencyLoading(false);
      setCurrencyError(null);
      return;
    }

    const timerId = window.setTimeout(() => {
      setCurrencyLoading(true);
      setCurrencyError(null);
      searchExchangeRates(keyword)
        .then((rates) => {
          const normalizedKeyword = keyword.toLowerCase();
          const krwRate: ExchangeRate = {
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
            baseDate: new Date().toISOString().slice(0, 10),
            changeAmount: 0,
            changeRate: 0,
            favorite: false,
          };
          const shouldIncludeKrw = ['krw', 'won', 'korean won', 'korea'].some((value) =>
            value.includes(normalizedKeyword) || normalizedKeyword.includes(value),
          );
          const uniqueRates = new Map<string, ExchangeRate>();
          if (shouldIncludeKrw) {
            uniqueRates.set('KRW', krwRate);
          }
          for (const rate of rates) {
            uniqueRates.set(rate.normalizedCurUnit, rate);
          }
          setCurrencyResults([...uniqueRates.values()]);
        })
        .catch((error) => {
          setCurrencyError(toAppApiError(error).message);
          setCurrencyResults([]);
        })
        .finally(() => setCurrencyLoading(false));
    }, 250);

    return () => window.clearTimeout(timerId);
  }, [currencyKeyword]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(initialDepositAmount);
    if (!investmentCurrency) {
      setValidationError('Select an investment currency.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setValidationError('Initial deposit amount must be greater than zero.');
      return;
    }
    setSaving(true);
    setValidationError(null);
    try {
      await onCreate(name.trim() || null, investmentCurrency, amount, memo.trim() || null);
      setName('');
      setInvestmentCurrency('');
      setCurrencyKeyword('');
      setCurrencyResults([]);
      setInitialDepositAmount('');
      setMemo('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-app border border-line bg-panel p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-bold">{compact ? 'Create another portfolio' : 'Create portfolio account'}</h2>
        <p className="text-sm text-muted">
          The investment currency is the base currency used for cash, valuation, and profit/loss.
        </p>
      </div>
      <form className="mt-4 grid gap-3 md:grid-cols-[1fr_1.4fr_1fr_1fr_auto]" onSubmit={handleSubmit}>
        <label className="grid gap-1 text-sm font-semibold">
          Portfolio name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-app border border-line bg-panel px-3 py-2"
            placeholder="Travel fund"
          />
        </label>
        <div className="grid gap-1 text-sm font-semibold">
          Investment currency
          <input
            aria-label="Investment currency"
            value={currencyKeyword}
            onChange={(event) => setCurrencyKeyword(event.target.value)}
            className="rounded-app border border-line bg-panel px-3 py-2"
            placeholder={investmentCurrency ? `Selected ${investmentCurrency}` : 'Search KRW, USD, yen...'}
          />
          {investmentCurrency ? (
            <p className="text-xs text-muted">
              Selected: <strong className="text-text">{investmentCurrency}</strong>
            </p>
          ) : null}
          {currencyLoading ? <p className="text-xs text-muted">Searching currencies...</p> : null}
          {currencyError ? <p className="text-xs text-[var(--color-up)]">{currencyError}</p> : null}
          {currencyResults.length > 0 ? (
            <div className="grid max-h-44 gap-1 overflow-y-auto rounded-app border border-line bg-surface p-2">
              {currencyResults.map((rate) => (
                <button
                  key={rate.normalizedCurUnit}
                  type="button"
                  className={`rounded-app px-3 py-2 text-left text-sm hover:bg-panel ${
                    investmentCurrency === rate.normalizedCurUnit ? 'bg-panel font-bold text-primary' : ''
                  }`}
                  onClick={() => {
                    setInvestmentCurrency(rate.normalizedCurUnit);
                    setCurrencyKeyword(`${rate.normalizedCurUnit} - ${getEnglishCurrencyName(rate.normalizedCurUnit, rate.curName)}`);
                    setCurrencyResults([]);
                  }}
                >
                  <span className="font-semibold">{rate.normalizedCurUnit}</span>
                  <span className="ml-2 text-muted">
                    {getEnglishCurrencyName(rate.normalizedCurUnit, rate.curName)}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <label className="grid gap-1 text-sm font-semibold">
          Initial deposit
          <input
            type="number"
            min="0"
            step="1"
            value={initialDepositAmount}
            onChange={(event) => setInitialDepositAmount(event.target.value)}
            className="rounded-app border border-line bg-panel px-3 py-2"
            placeholder="100000"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Memo
          <input
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            className="rounded-app border border-line bg-panel px-3 py-2"
            placeholder="Optional"
          />
        </label>
        <div className="flex items-end">
          <Button type="submit" disabled={saving} className="w-full md:w-auto">
            {saving ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
      {validationError ? <div className="mt-3"><ErrorView message={validationError} /></div> : null}
    </section>
  );
}

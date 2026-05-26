import type { PortfolioSummary } from '../../types/portfolio';
import { formatRate } from '../../utils/numberFormat';
import { PortfolioChangeBadge } from './PortfolioChangeBadge';

interface PortfolioSummaryCardProps {
  summary: PortfolioSummary;
}

export function PortfolioSummaryCard({ summary }: PortfolioSummaryCardProps) {
  const currency = summary.investmentCurrency ?? '';
  return (
    <section className="rounded-app border border-line bg-panel p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Total asset value</p>
          <h1 className="text-3xl font-bold">
            {formatRate(summary.totalAssetValue)} {currency}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Cash {formatRate(summary.cashBalance)} {currency} - {summary.positionCount} positions
          </p>
          {currency ? (
            <p className="mt-1 text-sm text-muted">
              Investment currency: <strong className="text-text">{currency}</strong>
            </p>
          ) : null}
          <p className="mt-1 text-xs text-muted">
            Investment cash is excluded from market movement. It does not affect the up/down badge.
          </p>
        </div>
        <PortfolioChangeBadge
          amount={summary.profitLoss}
          rate={summary.profitLossRate}
          status={summary.changeStatus}
          currency={currency}
        />
      </div>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-app bg-surface p-3">
          <dt className="text-xs text-muted">Total deposited</dt>
          <dd className="font-semibold">{formatRate(summary.totalDeposited)} {currency}</dd>
        </div>
        <div className="rounded-app bg-surface p-3">
          <dt className="text-xs text-muted">Invested cost</dt>
          <dd className="font-semibold">{formatRate(summary.investedCost)} {currency}</dd>
        </div>
        <div className="rounded-app bg-surface p-3">
          <dt className="text-xs text-muted">Currency value</dt>
          <dd className="font-semibold">{formatRate(summary.currencyValue)} {currency}</dd>
        </div>
        <div className="rounded-app bg-surface p-3">
          <dt className="text-xs text-muted">Base date</dt>
          <dd className="font-semibold">{summary.baseDate ?? '-'}</dd>
        </div>
      </dl>
    </section>
  );
}

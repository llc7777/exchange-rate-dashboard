import type { PortfolioChangeStatus } from '../../types/portfolio';
import { formatPercent, formatRate } from '../../utils/numberFormat';

interface PortfolioChangeBadgeProps {
  amount: number;
  rate: number;
  status: PortfolioChangeStatus;
  currency?: string;
}

export function PortfolioChangeBadge({
  amount,
  rate,
  status,
  currency = 'KRW',
}: PortfolioChangeBadgeProps) {
  const isUp = status === 'UP';
  const isDown = status === 'DOWN';
  const className = isUp
    ? 'border-[var(--color-up)]/20 bg-red-50 text-[var(--color-up)]'
    : isDown
      ? 'border-[var(--color-down)]/20 bg-blue-50 text-[var(--color-down)]'
      : 'border-line bg-surface text-muted';
  const prefix = isUp ? '+' : '';
  const label =
    status === 'NO_CHANGE'
      ? 'No change'
      : `${prefix}${formatRate(amount)} ${currency} (${prefix}${formatPercent(rate)})`;

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

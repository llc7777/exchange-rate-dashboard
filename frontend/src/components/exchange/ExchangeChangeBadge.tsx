import { formatPercent, formatRate } from '../../utils/numberFormat';
import { getRateChangeDirection, getRateChangeLabel } from '../../utils/rateChange';

interface ExchangeChangeBadgeProps {
  changeAmount: number;
  changeRate: number;
}

const directionClassNames = {
  up: 'border-red-200 bg-red-50 text-[var(--color-up)]',
  down: 'border-blue-200 bg-blue-50 text-[var(--color-down)]',
  flat: 'border-gray-200 bg-gray-50 text-[var(--color-flat)]',
};

export function ExchangeChangeBadge({ changeAmount, changeRate }: ExchangeChangeBadgeProps) {
  const direction = getRateChangeDirection(changeRate);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${directionClassNames[direction]}`}
    >
      <span>{getRateChangeLabel(changeRate)}</span>
      <span>{formatRate(changeAmount)}</span>
      <span>({formatPercent(changeRate)})</span>
    </span>
  );
}

import type { ExchangeRate } from '../../types/exchange';
import { EmptyView } from '../common/EmptyView';
import { ExchangeRateBar } from './ExchangeRateBar';

interface ExchangeRateListProps {
  rates: ExchangeRate[];
  onToggleFavorite: (rate: ExchangeRate) => void;
  emptyMessage?: string;
  scrollable?: boolean;
  rateLabel?: string;
}

export function ExchangeRateList({
  rates,
  onToggleFavorite,
  emptyMessage,
  scrollable = false,
  rateLabel,
}: ExchangeRateListProps) {
  if (rates.length === 0) {
    return <EmptyView message={emptyMessage ?? 'No exchange rates found.'} />;
  }

  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>Showing {rates.length} currencies</span>
        <span>Scroll to view all</span>
      </div>
      <div
        className={`grid gap-3 pr-1 ${
          scrollable ? 'max-h-[calc(100vh-310px)] overflow-y-auto' : ''
        }`}
      >
        {rates.map((rate) => (
          <ExchangeRateBar
            key={`${rate.curUnit}-${rate.baseDate}`}
            rate={rate}
            onToggleFavorite={onToggleFavorite}
            rateLabel={rateLabel}
          />
        ))}
      </div>
    </section>
  );
}

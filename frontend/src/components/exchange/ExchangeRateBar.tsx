import { useNavigate } from 'react-router-dom';

import type { ExchangeRate } from '../../types/exchange';
import { getDisplayCurrency } from '../../utils/currency';
import { getEnglishCurrencyName } from '../../utils/currencyName';
import { formatRate } from '../../utils/numberFormat';
import { ExchangeChangeBadge } from './ExchangeChangeBadge';
import { FavoriteButton } from './FavoriteButton';

interface ExchangeRateBarProps {
  rate: ExchangeRate;
  onToggleFavorite: (rate: ExchangeRate) => void;
  onOpenDetail?: (curUnit: string) => void;
  rateLabel?: string;
}

export function ExchangeRateBar({
  rate,
  onToggleFavorite,
  onOpenDetail,
  rateLabel = 'Deal base rate',
}: ExchangeRateBarProps) {
  const navigate = useNavigate();

  function openDetail() {
    if (onOpenDetail) {
      onOpenDetail(rate.normalizedCurUnit);
      return;
    }
    navigate(`/currencies/${encodeURIComponent(rate.normalizedCurUnit)}`);
  }

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Open ${rate.normalizedCurUnit} detail`}
      className="grid cursor-pointer grid-cols-[auto_1fr] gap-3 rounded-app border border-line bg-panel p-4 shadow-sm transition hover:border-primary hover:shadow-app sm:grid-cols-[auto_1fr_auto]"
      onClick={openDetail}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openDetail();
        }
      }}
    >
      {rate.normalizedCurUnit === 'KRW' ? (
        <div className="h-20 w-10" aria-hidden="true" />
      ) : (
        <div className="grid justify-items-center gap-2">
          <FavoriteButton favorite={rate.favorite} onClick={() => onToggleFavorite(rate)} />
        </div>
      )}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-base">{rate.normalizedCurUnit}</strong>
          <span className="text-xs font-medium text-muted">{getDisplayCurrency(rate)}</span>
        </div>
        <p className="truncate text-sm text-muted">
          {getEnglishCurrencyName(rate.normalizedCurUnit, rate.curName)}
        </p>
        <p className="mt-1 text-xs text-muted">Base date {rate.baseDate}</p>
      </div>
      <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 sm:col-span-1 sm:flex-col sm:items-end">
        <div className="text-right">
          <p className="text-xs text-muted">{rateLabel}</p>
          <p className="text-lg font-bold">{formatRate(rate.dealBasR)}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ExchangeChangeBadge changeAmount={rate.changeAmount} changeRate={rate.changeRate} />
        </div>
      </div>
    </article>
  );
}

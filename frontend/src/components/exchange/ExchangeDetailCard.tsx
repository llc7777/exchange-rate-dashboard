import type { ExchangeRate } from '../../types/exchange';
import { getEnglishCurrencyName } from '../../utils/currencyName';
import { formatRate } from '../../utils/numberFormat';
import { ExchangeChangeBadge } from './ExchangeChangeBadge';
import { FavoriteButton } from './FavoriteButton';

interface ExchangeDetailCardProps {
  rate: ExchangeRate;
  onToggleFavorite: () => void;
  baseCurrency?: string;
  rateLabel?: string;
}

const fields: Array<[keyof ExchangeRate, string]> = [
  ['curUnit', 'Currency code'],
  ['normalizedCurUnit', 'Normalized currency code'],
  ['curName', 'Country / currency name'],
  ['baseDate', 'Base date'],
  ['ttb', 'Telegraphic transfer buying'],
  ['tts', 'Telegraphic transfer selling'],
  ['dealBasR', 'Deal base rate'],
  ['bkpr', 'Book price'],
];

export function ExchangeDetailCard({
  rate,
  onToggleFavorite,
  baseCurrency = 'KRW',
  rateLabel = 'Deal base rate',
}: ExchangeDetailCardProps) {
  const usesKrwBase = baseCurrency === 'KRW';

  return (
    <section className="rounded-app border border-line bg-panel p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Currency detail</p>
          <h1 className="text-2xl font-bold">{rate.normalizedCurUnit}</h1>
          <p className="text-sm text-muted">
            {getEnglishCurrencyName(rate.normalizedCurUnit, rate.curName)}
          </p>
        </div>
        <div className="grid justify-items-center gap-2">
          <FavoriteButton favorite={rate.favorite} onClick={onToggleFavorite} />
        </div>
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div>
          <p className="text-xs text-muted">Deal base rate</p>
          <p className="text-xs text-muted">{rateLabel}</p>
          <p className="text-2xl font-bold">{formatRate(rate.dealBasR)}</p>
          {!usesKrwBase ? (
            <p className="mt-1 text-xs text-muted">
              Values show {rate.normalizedCurUnit} per 1 {baseCurrency}.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExchangeChangeBadge changeAmount={rate.changeAmount} changeRate={rate.changeRate} />
          <span className="text-xs font-medium text-muted">
            Compared with previous business day
          </span>
        </div>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        {fields.map(([key, label]) => {
          const value = rate[key];
          const text =
            key === 'curName'
              ? getEnglishCurrencyName(rate.normalizedCurUnit, rate.curName)
              : typeof value === 'number'
                ? formatRate(value)
                : String(value);
          return (
            <div key={key} className="rounded-app border border-line bg-surface p-3">
              <dt className="text-xs font-semibold text-muted">{label}</dt>
              <dd className="mt-1 break-words text-sm font-semibold">{text}</dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

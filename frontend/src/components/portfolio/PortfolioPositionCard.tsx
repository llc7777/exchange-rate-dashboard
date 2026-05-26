import type { PortfolioPosition } from '../../types/portfolio';
import { getEnglishCurrencyName } from '../../utils/currencyName';
import { formatAmount, formatRate } from '../../utils/numberFormat';
import { getUnitFactor } from '../../utils/currency';
import { convertAppliedRateToDisplayUnit, formatRateUnit, getDisplayRateUnit } from '../../utils/portfolioRate';
import { BuySellButtonGroup } from './BuySellButtonGroup';
import { PortfolioChangeBadge } from './PortfolioChangeBadge';

interface PortfolioPositionCardProps {
  position: PortfolioPosition;
  investmentCurrency: string;
  onBuy: (curUnit: string, curName: string) => void;
  onSell: (position: PortfolioPosition) => void;
}

export function PortfolioPositionCard({
  position,
  investmentCurrency,
  onBuy,
  onSell,
}: PortfolioPositionCardProps) {
  const calculationUnitFactor = getUnitFactor(position.curUnit);
  const displayUnit = getDisplayRateUnit(
    {
      unitFactor: calculationUnitFactor,
      normalizedCurUnit: position.normalizedCurUnit,
    },
    position.currentRate,
  );
  const displayAverageBuyRate = convertAppliedRateToDisplayUnit(
    position.averageBuyRate,
    {
      dealBasR: position.averageBuyRate,
      unitFactor: calculationUnitFactor,
      normalizedCurUnit: position.normalizedCurUnit,
    },
    displayUnit.unitFactor,
  );
  const displayCurrentRate = convertAppliedRateToDisplayUnit(
    position.currentRate,
    {
      dealBasR: position.currentRate,
      unitFactor: calculationUnitFactor,
      normalizedCurUnit: position.normalizedCurUnit,
    },
    displayUnit.unitFactor,
  );

  return (
    <article className="rounded-app border border-line bg-panel p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <strong>{position.normalizedCurUnit}</strong>
          <p className="text-sm text-muted">
            {getEnglishCurrencyName(position.normalizedCurUnit, position.curName)}
          </p>
          <p className="text-xs text-muted">Base date {position.baseDate}</p>
        </div>
        <BuySellButtonGroup
          curUnit={position.normalizedCurUnit}
          onBuy={() => onBuy(position.normalizedCurUnit, position.curName)}
          onSell={() => onSell(position)}
        />
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs text-muted">Holding</dt>
          <dd className="font-semibold">{formatAmount(position.holdingForeignAmount)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Average buy rate</dt>
          <dd className="font-semibold">
            {formatRate(displayAverageBuyRate)} {investmentCurrency} {formatRateUnit(displayUnit)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Current rate</dt>
          <dd className="font-semibold">
            {formatRate(displayCurrentRate)} {investmentCurrency} {formatRateUnit(displayUnit)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Current value</dt>
          <dd className="font-semibold">{formatRate(position.currentValue)} {investmentCurrency}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Profit / loss</dt>
          <dd className="mt-1">
            <PortfolioChangeBadge
              amount={position.profitLoss}
              rate={position.profitLossRate}
              status={position.changeStatus}
              currency={investmentCurrency}
            />
          </dd>
        </div>
      </dl>
    </article>
  );
}

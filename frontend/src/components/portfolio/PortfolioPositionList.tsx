import type { PortfolioPosition } from '../../types/portfolio';
import { EmptyView } from '../common/EmptyView';
import { PortfolioPositionCard } from './PortfolioPositionCard';

interface PortfolioPositionListProps {
  positions: PortfolioPosition[];
  investmentCurrency: string;
  onBuy: (curUnit: string, curName: string) => void;
  onSell: (position: PortfolioPosition) => void;
}

export function PortfolioPositionList({
  positions,
  investmentCurrency,
  onBuy,
  onSell,
}: PortfolioPositionListProps) {
  if (positions.length === 0) {
    return (
      <EmptyView message="No positions yet. Use the Buy button in this portfolio to add your first position." />
    );
  }

  return (
    <section className="grid gap-3">
      <h2 className="text-lg font-bold">Positions</h2>
      {positions.map((position) => (
        <PortfolioPositionCard
          key={position.normalizedCurUnit}
          position={position}
          investmentCurrency={investmentCurrency}
          onBuy={onBuy}
          onSell={onSell}
        />
      ))}
    </section>
  );
}

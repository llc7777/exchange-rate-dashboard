import { Button } from '../common/Button';

interface BuySellButtonGroupProps {
  curUnit: string;
  onBuy?: () => void;
  onSell?: () => void;
}

export function BuySellButtonGroup({ curUnit, onBuy, onSell }: BuySellButtonGroupProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="secondary"
        aria-label={`Buy ${curUnit}`}
        className="min-h-9 px-3 py-1.5"
        disabled={!onBuy}
        onClick={(event) => {
          event.stopPropagation();
          onBuy?.();
        }}
      >
        Buy
      </Button>
      <Button
        type="button"
        variant="secondary"
        aria-label={`Sell ${curUnit}`}
        className="min-h-9 px-3 py-1.5"
        disabled={!onSell}
        onClick={(event) => {
          event.stopPropagation();
          onSell?.();
        }}
      >
        Sell
      </Button>
    </div>
  );
}

import { Calculator } from 'lucide-react';

import { Button } from '../common/Button';

export function ExchangeCalculatorButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="primary" aria-label="Open exchange calculator" onClick={onClick}>
      <Calculator size={18} aria-hidden="true" />
      Calculator
    </Button>
  );
}

import { Outlet } from 'react-router-dom';
import { useState } from 'react';

import { useExchangeRates } from '../../hooks/useExchangeRates';
import { ExchangeCalculatorModal } from '../calculator/ExchangeCalculatorModal';
import { Header } from './Header';

export function AppLayout() {
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const { rates } = useExchangeRates('');

  return (
    <div className="min-h-screen bg-surface">
      <Header onOpenCalculator={() => setCalculatorOpen(true)} />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
      <ExchangeCalculatorModal
        open={calculatorOpen}
        rates={rates}
        onClose={() => setCalculatorOpen(false)}
      />
    </div>
  );
}

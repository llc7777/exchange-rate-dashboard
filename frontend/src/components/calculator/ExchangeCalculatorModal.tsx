import { useMemo, useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';

import { useExchangeCalculator } from '../../hooks/useExchangeCalculator';
import type { ExchangeRate } from '../../types/exchange';
import { uniqueCurrencies } from '../../utils/currency';
import { formatAmount, formatRate } from '../../utils/numberFormat';
import { Button } from '../common/Button';
import { ErrorView } from '../common/ErrorView';
import { Modal } from '../common/Modal';
import { CurrencySearchModal } from './CurrencySearchModal';
import { CurrencySelector } from './CurrencySelector';

interface ExchangeCalculatorModalProps {
  open: boolean;
  rates: ExchangeRate[];
  onClose: () => void;
}

export function ExchangeCalculatorModal({ open, rates, onClose }: ExchangeCalculatorModalProps) {
  const currencies = useMemo(() => uniqueCurrencies(rates), [rates]);
  const [amount, setAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('KRW');
  const [selector, setSelector] = useState<'from' | 'to' | null>(null);
  const { result, loading, error, calculate } = useExchangeCalculator();

  function submit() {
    void calculate(fromCurrency, toCurrency, Number(amount));
  }

  return (
    <>
      <Modal open={open} title="Exchange calculator" onClose={onClose}>
        <div className="grid gap-4">
          <label className="block text-sm font-semibold">
            Amount
            <input
              type="number"
              value={amount}
              min="0"
              step="0.01"
              onChange={(event) => setAmount(event.target.value)}
              className="mt-2 w-full rounded-app border border-line px-3 py-2"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <CurrencySelector
              id="from-currency"
              label="From"
              value={fromCurrency}
              onOpen={() => setSelector('from')}
            />
            <Button
              type="button"
              variant="secondary"
              aria-label="Swap currencies"
              className="sm:mb-0"
              onClick={() => {
                setFromCurrency(toCurrency);
                setToCurrency(fromCurrency);
              }}
            >
              <ArrowRightLeft size={18} aria-hidden="true" />
            </Button>
            <CurrencySelector
              id="to-currency"
              label="To"
              value={toCurrency}
              onOpen={() => setSelector('to')}
            />
          </div>

          {error ? <ErrorView message={error} /> : null}

          <Button type="button" onClick={submit} disabled={loading}>
            {loading ? 'Calculating...' : 'Calculate'}
          </Button>

          {result ? (
            <div className="rounded-app border border-line bg-surface p-4">
              <p className="text-sm text-muted">Result</p>
              <p className="mt-1 text-2xl font-bold">
                {formatAmount(result.convertedAmount)} {result.toCurrency}
              </p>
              <p className="mt-2 text-sm text-muted">
                {formatAmount(result.amount)} {result.fromCurrency} at rate{' '}
                {formatRate(result.appliedRate)}
              </p>
            </div>
          ) : null}
        </div>
      </Modal>

      <CurrencySearchModal
        open={selector !== null}
        title={selector === 'from' ? 'Select source currency' : 'Select target currency'}
        currencies={currencies}
        onClose={() => setSelector(null)}
        onSelect={(currency) => {
          if (selector === 'from') {
            setFromCurrency(currency);
          } else {
            setToCurrency(currency);
          }
        }}
      />
    </>
  );
}

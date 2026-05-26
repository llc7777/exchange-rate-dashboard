import { useMemo, useState } from 'react';

import type { ExchangeRate } from '../../types/exchange';
import { getDisplayCurrency } from '../../utils/currency';
import { getEnglishCurrencyName } from '../../utils/currencyName';
import { Modal } from '../common/Modal';

interface CurrencySearchModalProps {
  open: boolean;
  title: string;
  currencies: ExchangeRate[];
  onClose: () => void;
  onSelect: (currency: string) => void;
}

export function CurrencySearchModal({
  open,
  title,
  currencies,
  onClose,
  onSelect,
}: CurrencySearchModalProps) {
  const [keyword, setKeyword] = useState('');
  const filtered = useMemo(() => {
    const value = keyword.trim().toLowerCase();
    if (!value) {
      return currencies;
    }
    return currencies.filter((currency) =>
      [
        currency.curUnit,
        currency.normalizedCurUnit,
        currency.curName,
        getEnglishCurrencyName(currency.normalizedCurUnit, currency.curName),
      ].some((field) => field.toLowerCase().includes(value)),
    );
  }, [currencies, keyword]);

  return (
    <Modal open={open} title={title} onClose={onClose}>
      <label className="block text-sm font-semibold">
        Search
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          className="mt-2 w-full rounded-app border border-line px-3 py-2"
          placeholder="USD, Japanese Yen, KRW"
        />
      </label>
      <div className="mt-4 grid max-h-80 gap-2 overflow-auto">
        {filtered.map((currency) => (
          <button
            key={currency.normalizedCurUnit}
            type="button"
            className="rounded-app border border-line p-3 text-left hover:border-primary hover:bg-surface"
            onClick={() => {
              onSelect(currency.normalizedCurUnit);
              onClose();
            }}
          >
            <span className="font-semibold">{currency.normalizedCurUnit}</span>
            <span className="ml-2 text-xs text-muted">{getDisplayCurrency(currency)}</span>
            <p className="text-sm text-muted">
              {getEnglishCurrencyName(currency.normalizedCurUnit, currency.curName)}
            </p>
          </button>
        ))}
      </div>
    </Modal>
  );
}

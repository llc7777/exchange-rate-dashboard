import type { ExchangeRate } from '../../types/exchange';
import { getEnglishCurrencyName } from '../../utils/currencyName';

interface BaseCurrencySelectorProps {
  value: string;
  currencies: ExchangeRate[];
  onChange: (value: string) => void;
}

export function BaseCurrencySelector({ value, currencies, onChange }: BaseCurrencySelectorProps) {
  const hasSelectedCurrency = currencies.some(
    (currency) => currency.normalizedCurUnit === value,
  );
  const options = hasSelectedCurrency
    ? currencies
    : [
        {
          id: -1,
          curUnit: value,
          normalizedCurUnit: value,
          curName: value,
          ttb: 1,
          tts: 1,
          dealBasR: 1,
          bkpr: 1,
          yyEfeeR: 0,
          tenDdEfeeR: 0,
          kftcDealBasR: 1,
          kftcBkpr: 1,
          baseDate: '',
          changeAmount: 0,
          changeRate: 0,
          favorite: false,
        },
        ...currencies,
      ];

  return (
    <label className="block text-sm font-semibold">
      Base currency
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-app border border-line bg-panel px-3 py-3 text-sm"
      >
        {options.map((currency) => (
          <option key={currency.normalizedCurUnit} value={currency.normalizedCurUnit}>
            {currency.normalizedCurUnit} -{' '}
            {getEnglishCurrencyName(currency.normalizedCurUnit, currency.curName)}
          </option>
        ))}
      </select>
    </label>
  );
}

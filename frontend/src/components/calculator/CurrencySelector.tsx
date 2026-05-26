import { ChevronDown } from 'lucide-react';

interface CurrencySelectorProps {
  id: string;
  label: string;
  value: string;
  onOpen: () => void;
}

export function CurrencySelector({ id, label, value, onOpen }: CurrencySelectorProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">
        {label}
      </label>
      <button
        id={id}
        type="button"
        className="flex w-full items-center justify-between rounded-app border border-line bg-panel px-3 py-2 text-left"
        onClick={onOpen}
      >
        <span className="font-semibold">{value}</span>
        <ChevronDown size={18} className="text-muted" aria-hidden="true" />
      </button>
    </div>
  );
}

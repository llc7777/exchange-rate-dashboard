import { Search } from 'lucide-react';

interface ExchangeSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function ExchangeSearchBar({ value, onChange }: ExchangeSearchBarProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-text">Search currencies</span>
      <div className="flex items-center gap-2 rounded-app border border-line bg-panel px-4 py-3 shadow-sm">
        <Search size={20} className="shrink-0 text-muted" aria-hidden="true" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search by code or currency name"
          className="w-full bg-transparent text-base outline-none placeholder:text-muted"
        />
      </div>
    </label>
  );
}

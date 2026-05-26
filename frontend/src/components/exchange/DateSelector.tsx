interface DateSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
}

export function DateSelector({ value, onChange, error }: DateSelectorProps) {
  return (
    <label className="block text-sm font-semibold">
      Detail date
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'detail-date-error' : undefined}
        className="mt-2 w-full rounded-app border border-line bg-panel px-3 py-2 text-sm"
      />
      {error ? (
        <span id="detail-date-error" className="mt-2 block text-xs font-medium text-[var(--color-up)]">
          {error}
        </span>
      ) : null}
    </label>
  );
}

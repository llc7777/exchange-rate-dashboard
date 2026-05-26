import { SearchX } from 'lucide-react';

export function EmptyView({ message = 'No data found.' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-app border border-dashed border-line bg-panel p-8 text-center text-muted">
      <SearchX size={24} aria-hidden="true" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

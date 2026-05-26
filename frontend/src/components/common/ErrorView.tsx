import { AlertCircle } from 'lucide-react';

import { Button } from './Button';

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-app border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <div className="flex items-center gap-2">
        <AlertCircle size={18} aria-hidden="true" />
        <span>{message}</span>
      </div>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}

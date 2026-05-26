export function LoadingView({ label = 'Loading data...' }: { label?: string }) {
  return (
    <div className="rounded-app border border-line bg-panel p-6 text-center text-sm text-muted">
      {label}
    </div>
  );
}

import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="rounded-app border border-line bg-panel p-8 text-center shadow-sm">
      <p className="text-sm font-semibold text-muted">404</p>
      <h1 className="mt-2 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-sm text-muted">The requested page does not exist.</p>
      <Link
        to="/"
        className="mt-5 inline-flex min-h-10 items-center justify-center rounded-app bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-strong)]"
      >
        Go home
      </Link>
    </section>
  );
}

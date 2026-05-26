import { Link } from 'react-router-dom';

interface AuthFeaturePanelProps {
  title: string;
  description?: string;
}

export function AuthFeaturePanel({
  title,
  description = 'Create an account to save favorite currencies.',
}: AuthFeaturePanelProps) {
  return (
    <section className="rounded-app border border-line bg-panel p-5 shadow-sm">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-2 text-sm text-muted">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to="/login"
          className="inline-flex min-h-10 items-center justify-center rounded-app bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-strong)]"
        >
          Log in
        </Link>
        <Link
          to="/register"
          className="inline-flex min-h-10 items-center justify-center rounded-app border border-line bg-panel px-4 py-2 text-sm font-semibold hover:bg-surface"
        >
          Register
        </Link>
      </div>
    </section>
  );
}

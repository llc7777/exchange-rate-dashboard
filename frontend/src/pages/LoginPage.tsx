import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Button } from '../components/common/Button';
import { ErrorView } from '../components/common/ErrorView';
import { useAuth } from '../hooks/useAuth';

interface LoginLocationState {
  from?: string;
  message?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const state = location.state as LoginLocationState | null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(state?.message ?? null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setMessage('Email and password are required.');
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      await login({ email, password });
      navigate(state?.from ?? '/', { replace: true });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto grid max-w-md gap-4">
      <div>
        <h1 className="text-2xl font-bold">Log in</h1>
        <p className="mt-1 text-sm text-muted">
          Log in to save favorite currencies.
        </p>
      </div>

      {message ? <ErrorView message={message} /> : null}

      <form onSubmit={submit} className="grid gap-4 rounded-app border border-line bg-panel p-5 shadow-sm">
        <label className="block text-sm font-semibold">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            className="mt-2 w-full rounded-app border border-line px-3 py-2"
          />
        </label>
        <label className="block text-sm font-semibold">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="mt-2 w-full rounded-app border border-line px-3 py-2"
          />
        </label>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Log in'}
        </Button>
      </form>

      <p className="text-sm text-muted">
        New here?{' '}
        <Link to="/register" className="font-semibold text-primary">
          Create an account
        </Link>
      </p>
    </section>
  );
}

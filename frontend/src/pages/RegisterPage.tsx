import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '../components/common/Button';
import { ErrorView } from '../components/common/ErrorView';
import { useAuth } from '../hooks/useAuth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SPECIAL_CHARACTER_PATTERN = /[^A-Za-z0-9]/;

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationMessage = getRegistrationValidationMessage(name, email, password);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      navigate('/', { replace: true });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto grid max-w-md gap-4">
      <div>
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-muted">
          Register to unlock saved favorite currencies.
        </p>
      </div>

      {message ? <ErrorView message={message} /> : null}

      <form onSubmit={submit} className="grid gap-4 rounded-app border border-line bg-panel p-5 shadow-sm">
        <label className="block text-sm font-semibold">
          Name
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            className="mt-2 w-full rounded-app border border-line px-3 py-2"
          />
        </label>
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
            autoComplete="new-password"
            className="mt-2 w-full rounded-app border border-line px-3 py-2"
          />
          <span className="mt-1 block text-xs font-normal text-muted">
            Use at least 8 characters and include one special character.
          </span>
        </label>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Register'}
        </Button>
      </form>

      <p className="text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary">
          Log in
        </Link>
      </p>
    </section>
  );
}

function getRegistrationValidationMessage(name: string, email: string, password: string) {
  if (!name.trim()) {
    return 'Name is required.';
  }
  if (!email.trim()) {
    return 'Email is required.';
  }
  if (!EMAIL_PATTERN.test(email.trim())) {
    return 'Email must be a valid email address.';
  }
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < 8 || !SPECIAL_CHARACTER_PATTERN.test(password)) {
    return 'Password must be at least 8 characters and include at least one special character.';
  }
  return null;
}

import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BriefcaseBusiness, LogIn, LogOut, UserPlus } from 'lucide-react';

import { ExchangeCalculatorButton } from '../calculator/ExchangeCalculatorButton';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  onOpenCalculator: () => void;
}

export function Header({ onOpenCalculator }: HeaderProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="border-b border-line bg-panel">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-lg font-bold tracking-normal">
            Exchange Rates
          </Link>
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Main navigation">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `rounded-app px-3 py-2 text-sm font-semibold ${isActive ? 'bg-surface text-primary' : 'text-muted hover:text-text'}`
              }
            >
              Today
            </NavLink>
            <NavLink
              to="/portfolio"
              className={({ isActive }) =>
                `rounded-app px-3 py-2 text-sm font-semibold ${isActive ? 'bg-surface text-primary' : 'text-muted hover:text-text'}`
              }
            >
              Portfolio
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <span className="hidden max-w-40 truncate text-sm font-semibold text-muted sm:inline">
                {user?.name}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-app border border-line bg-panel px-3 py-2 text-sm font-semibold hover:bg-surface"
              >
                <LogOut size={18} aria-hidden="true" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden min-h-10 items-center justify-center gap-2 rounded-app border border-line bg-panel px-3 py-2 text-sm font-semibold hover:bg-surface sm:inline-flex"
              >
                <LogIn size={18} aria-hidden="true" />
                Login
              </Link>
              <Link
                to="/register"
                className="hidden min-h-10 items-center justify-center gap-2 rounded-app border border-line bg-panel px-3 py-2 text-sm font-semibold hover:bg-surface sm:inline-flex"
              >
                <UserPlus size={18} aria-hidden="true" />
                Register
              </Link>
            </>
          )}
          <Link
            to="/portfolio"
            aria-label="Open portfolio"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-app border border-line bg-panel px-4 py-2 text-sm font-semibold hover:bg-surface sm:hidden"
          >
            <BriefcaseBusiness size={18} aria-hidden="true" />
            Portfolio
          </Link>
          <ExchangeCalculatorButton onClick={onOpenCalculator} />
        </div>
      </div>
    </header>
  );
}

import type { AuthUser } from '../types/auth';

const ACCESS_TOKEN_KEY = 'exchangeRate.accessToken';
const AUTH_USER_KEY = 'exchangeRate.authUser';

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function getStoredAccessToken(): string | null {
  if (!canUseStorage()) {
    return null;
  }
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredAuthUser(): AuthUser | null {
  if (!canUseStorage()) {
    return null;
  }
  const raw = window.localStorage.getItem(AUTH_USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function storeAuth(accessToken: string, user: AuthUser) {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
}

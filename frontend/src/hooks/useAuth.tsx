import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getCurrentUser, loginUser, registerUser } from '../api/authApi';
import { toAppApiError } from '../api/httpClient';
import type { AuthLoginRequest, AuthRegisterRequest, AuthUser } from '../types/auth';
import {
  clearStoredAuth,
  getStoredAccessToken,
  getStoredAuthUser,
  storeAuth,
} from '../utils/authStorage';

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (request: AuthLoginRequest) => Promise<void>;
  register: (request: AuthRegisterRequest) => Promise<void>;
  logout: () => void;
}

const defaultAuthContext: AuthContextValue = {
  user: null,
  accessToken: null,
  loading: false,
  isAuthenticated: false,
  login: async () => {
    throw new Error('AuthProvider is not mounted.');
  },
  register: async () => {
    throw new Error('AuthProvider is not mounted.');
  },
  logout: () => undefined,
};

const AuthContext = createContext<AuthContextValue>(defaultAuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredAuthUser());
  const [accessToken, setAccessToken] = useState<string | null>(() => getStoredAccessToken());
  const [loading, setLoading] = useState(() => Boolean(getStoredAccessToken()));

  useEffect(() => {
    let active = true;
    const storedToken = getStoredAccessToken();
    if (!storedToken) {
      setLoading(false);
      return () => {
        active = false;
      };
    }
    const token = storedToken;

    async function verifyStoredSession() {
      try {
        // 저장된 토큰이 아직 유효한지 백엔드에서 확인한다.
        // Verifies with the backend that the stored token is still valid.
        const currentUser = await getCurrentUser();
        if (active) {
          setUser(currentUser);
          setAccessToken(token);
          storeAuth(token, currentUser);
        }
      } catch {
        clearStoredAuth();
        if (active) {
          setUser(null);
          setAccessToken(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void verifyStoredSession();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (request: AuthLoginRequest) => {
    try {
      const response = await loginUser(request);
      storeAuth(response.accessToken, response.user);
      setAccessToken(response.accessToken);
      setUser(response.user);
    } catch (error) {
      const message = toAppApiError(error).message;
      throw new Error(message);
    }
  }, []);

  const register = useCallback(async (request: AuthRegisterRequest) => {
    try {
      const response = await registerUser(request);
      storeAuth(response.accessToken, response.user);
      setAccessToken(response.accessToken);
      setUser(response.user);
    } catch (error) {
      const message = toAppApiError(error).message;
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      loading,
      isAuthenticated: Boolean(accessToken && user),
      login,
      register,
      logout,
    }),
    [accessToken, loading, login, logout, register, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

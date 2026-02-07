import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../lib/api';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  MeResponse,
  User,
} from '../types/auth';

type AuthCtx = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  signup: (payload: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('auth.user');
    return raw ? (JSON.parse(raw) as User) : null;
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('auth.token'),
  );
  const [loading, setLoading] = useState<boolean>(true);

  const persist = (u: User, t: string) => {
    setUser(u);
    setToken(t);
    localStorage.setItem('auth.user', JSON.stringify(u));
    localStorage.setItem('auth.token', t);
  };

  const login = async (payload: LoginRequest) => {
    const { data } = await api.post<AuthResponse>('/api/auth/login', payload);
    if (!data.success) throw new Error(data.message || 'Login failed');
    persist(data.user, data.token);
  };

  const signup = async (payload: RegisterRequest) => {
    const { data } = await api.post<AuthResponse>(
      '/api/auth/register',
      payload,
    );
    if (!data.success) throw new Error(data.message || 'Registration failed');
    persist(data.user, data.token);
  };

  const refreshMe = async () => {
    if (!localStorage.getItem('auth.token')) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get<MeResponse>('/api/auth/me');
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('auth.user', JSON.stringify(data.user));
      } else {
        logout();
      }
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth.user');
    localStorage.removeItem('auth.token');
  };

  useEffect(() => {
    void refreshMe();
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, signup, logout, refreshMe }),
    [user, token, loading],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

//force rebuild

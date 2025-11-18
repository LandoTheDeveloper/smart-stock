
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  LoginRequest,
  RegisterRequest,
  User,
} from "../types/auth";

type AuthCtx = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  signup: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

// Simple hard-coded user for dev mode
const DEV_USER: User = {
  id: "dev-user",
  email: "dev@example.com",
  name: "Dev User",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // Start LOGGED OUT for now
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading] = useState<boolean>(false);

  const login = async (_payload: LoginRequest) => {
    // Pretend login succeeded
    setUser(DEV_USER);
    setToken("dev-token");
  };

  const signup = async (_payload: RegisterRequest) => {
    // Pretend signup succeeded
    setUser(DEV_USER);
    setToken("dev-token");
  };

  const refreshMe = async () => {
    // No-op in dev mode
    return;
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
  };

  const value = useMemo(
    () => ({ user, token, loading, login, signup, logout, refreshMe }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};


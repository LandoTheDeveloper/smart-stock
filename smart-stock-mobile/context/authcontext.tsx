import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, setAuthToken } from "../lib/api";

type User = {
  id: string;
  email: string;
  name: string;
  role?: string;
} | null;

type LoginPayload = {
  email: string;
  password: string;
};

type SignupPayload = {
  email: string;
  password: string;
  name: string;
};

type AuthContextValue = {
  user: User;
  token: string | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  avatar: string;
  setAvatar: (value: string) => void;
  displayName: string;
  setDisplayName: (value: string) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [avatar, setAvatar] = useState<string>("AppleAvatar.png");
  const [displayName, setDisplayName] = useState<string>("User");

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const storedUser = await AsyncStorage.getItem(USER_KEY);

        if (storedToken) {
          setTokenState(storedToken);
          setAuthToken(storedToken);
        }
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setDisplayName(parsedUser?.name || "User");
        }

        // Optionally refresh /me if token exists
        if (storedToken) {
          await refreshMe();
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.error("Error loading auth:", e);
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(USER_KEY);
        setTokenState(null);
        setAuthToken(null);
        setUser(null);
        setDisplayName("User");
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistSession = async (newToken: string, userData: any) => {
    setTokenState(newToken);
    setAuthToken(newToken);
    setUser(userData);
    setDisplayName(userData?.name || "User");

    await AsyncStorage.setItem(TOKEN_KEY, newToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
  };

  const login = async ({ email, password }: LoginPayload) => {
    const res = await api.post("/api/auth/login", { email, password });

    // Web expects: { success, message, user, token }
    const data = res.data;
    if (!data?.success) throw new Error(data?.message || "Login failed");

    await persistSession(data.token, data.user);
  };

  const signup = async ({ email, password, name }: SignupPayload) => {
    const res = await api.post("/api/auth/register", { email, password, name });

    const data = res.data;
    if (!data?.success) throw new Error(data?.message || "Registration failed");

    await persistSession(data.token, data.user);
  };

  const refreshMe = async () => {
    try {
      const res = await api.get("/api/auth/me");
      const data = res.data;
      if (data?.success) {
        setUser(data.user);
        setDisplayName(data.user?.name || "User");
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
      } else {
        await logout();
      }
    } catch {
      await logout();
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    setTokenState(null);
    setAuthToken(null);
    setUser(null);
    setDisplayName("User");
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
        refreshMe,
        avatar,
        setAvatar,
        displayName,
        setDisplayName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


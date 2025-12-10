import React, {
  createContext,
  useContext,
  useState,
  useEffect,
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
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile state
  const [avatar, setAvatar] = useState<string>("AppleAvatar.png");
  const [displayName, setDisplayName] = useState<string>("User");

  // Load stored auth on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setAuthToken(storedToken);
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setDisplayName(parsedUser.name || "User");
      }
    } catch (error) {
      console.error("Error loading stored auth:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ email, password }: LoginPayload) => {
    const response = await api.post("/api/auth/login", { email, password });

    if (!response.data.success) {
      throw new Error(response.data.message || "Login failed");
    }

    const { token: newToken, user: userData } = response.data;

    // Store token and user
    await AsyncStorage.setItem(TOKEN_KEY, newToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));

    setToken(newToken);
    setAuthToken(newToken);
    setUser(userData);
    setDisplayName(userData.name || "User");
  };

  const signup = async ({ email, password, name }: SignupPayload) => {
    const response = await api.post("/api/auth/register", { email, password, name });

    if (!response.data.success) {
      throw new Error(response.data.message || "Registration failed");
    }

    const { token: newToken, user: userData } = response.data;

    // Store token and user
    await AsyncStorage.setItem(TOKEN_KEY, newToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));

    setToken(newToken);
    setAuthToken(newToken);
    setUser(userData);
    setDisplayName(userData.name || "User");
  };

  const logout = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    setToken(null);
    setAuthToken(null);
    setUser(null);
    setDisplayName("User");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        signup,
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
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

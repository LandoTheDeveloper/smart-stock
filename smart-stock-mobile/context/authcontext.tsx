import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

type User = {
  email: string;
} | null;

type LoginPayload = {
  email: string;
  password: string;
};

type AuthContextValue = {
  user: User;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  avatar: string;
  setAvatar: (value: string) => void;
  displayName: string;
  setDisplayName: (value: string) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);

  // Profile state
  const [avatar, setAvatar] = useState<string>("AppleAvatar.png");
  const [displayName, setDisplayName] = useState<string>("User");

  const login = async ({ email }: LoginPayload) => {
    // In dev: just set a fake user
    setUser({ email });
  };

  const logout = async () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
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


import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { clearToken, storeToken, type Officer } from "../api/client";

interface AuthValue {
  user: Officer | null;
  signIn: (token: string, officer: Officer) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children, initialUser }: { children: ReactNode; initialUser: Officer | null }) {
  const [user, setUser] = useState<Officer | null>(initialUser);
  const value = useMemo<AuthValue>(() => ({
    user,
    signIn: async (token, officer) => {
      await storeToken(token);
      setUser(officer);
    },
    signOut: async () => {
      await clearToken();
      setUser(null);
    },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider.");
  return value;
}
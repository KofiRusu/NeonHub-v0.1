import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import apiClient from "../lib/apiClient";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  // Fetch current user on mount
  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiClient.get<{ user: User }>("/auth/me");
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await apiClient.post<{ user: User }>("/auth/login", { email, password });
    setUser(data.user);
    router.push('/dashboard');
  };

  const register = async (name: string, email: string, password: string) => {
    const { data } = await apiClient.post<{ user: User }>("/auth/register", { name, email, password });
    setUser(data.user);
    router.push('/dashboard');
  };

  const logout = async () => {
    await apiClient.post("/auth/logout");
    setUser(null);
    router.push('/auth/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext; 
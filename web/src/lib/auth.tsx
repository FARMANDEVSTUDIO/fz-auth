'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthState {
  apiUrl: string;
  appId: string;
  adminKey: string;
}

interface AuthContextType {
  auth: AuthState | null;
  login: (apiUrl: string, appId: string, adminKey: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  auth: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('fz-auth-session');
    if (saved) {
      try { setAuth(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  function login(apiUrl: string, appId: string, adminKey: string) {
    const state = { apiUrl, appId, adminKey };
    localStorage.setItem('fz-auth-session', JSON.stringify(state));
    setAuth(state);
  }

  function logout() {
    localStorage.removeItem('fz-auth-session');
    setAuth(null);
  }

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

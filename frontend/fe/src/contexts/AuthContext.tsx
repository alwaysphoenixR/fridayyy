import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSummary } from '../types/api';
import { setAccessToken } from '../api/client';

interface AuthContextType {
  user: UserSummary | null;
  isAuthenticated: boolean;
  login: (user: UserSummary, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSummary | null>(() => {
    try {
      const storedUser = localStorage.getItem('friday_user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      localStorage.removeItem('friday_user');
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!user);

  useEffect(() => {
    // Note: We don't store the accessToken in localStorage for security (XSS).
    // The refresh token is in an HttpOnly cookie.
    // The accessToken is held in memory by the apiClient via setAccessToken.
    // However, on a hard refresh, the memory token is lost.
    // The apiClient's 401 interceptor will fetch a new one, but to initially boot the app:
    // We should ideally call a `/auth/me` or `/auth/refresh-token` on mount if user is populated.
    // For now, if there's a user in localStorage, we assume authenticated until an API call fails with 401.
  }, []);

  const login = (newUser: UserSummary, token: string) => {
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('friday_user', JSON.stringify(newUser));
    setAccessToken(token);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('friday_user');
    setAccessToken(null);
    // Note: The actual /auth/logout API call should be made by the caller before triggering this context logout
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

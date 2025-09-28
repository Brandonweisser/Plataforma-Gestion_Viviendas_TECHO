import React, { createContext, useState, useEffect } from "react";
import { decodeJwt } from "../utils/validation";
import { normalizeRole } from "../utils/roles";

// Provide safe defaults so that accidental usage outside the provider
// doesn't immediately throw due to destructuring undefined. We still log a warning.
export const AuthContext = createContext({
  user: null,
  role: null,
  isAuthenticated: false,
  loading: true,
  login: () => console.warn("AuthContext.login called outside provider"),
  logout: () => console.warn("AuthContext.logout called outside provider"),
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const savedUserRaw = localStorage.getItem("user");
  const savedToken = localStorage.getItem("token");

  if (savedToken && !savedUserRaw) {
    const decoded = decodeJwt(savedToken);
    if (decoded) {
      const rebuilt = { token: savedToken, role: decoded.role };
      setUser(rebuilt);
      localStorage.setItem("user", JSON.stringify(rebuilt));
    }
  }

  if (savedUserRaw) {
    try {
      const parsed = JSON.parse(savedUserRaw);
      if (parsed.role) parsed.role = normalizeRole(parsed.role);
      if (parsed.rol) parsed.role = normalizeRole(parsed.rol);
      setUser(parsed);
    } catch (_) {
      localStorage.removeItem("user");
    }
  }

  //  Esto faltaba
  setLoading(false);
}, []);

  const login = (userData) => {
    const normalized = { ...userData };
    if (normalized.rol && !normalized.role) normalized.role = normalized.rol;
    normalized.role = normalizeRole(normalized.role);
    setUser(normalized);
    localStorage.setItem("user", JSON.stringify(normalized));
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setLoading(false);
  };

  const isAuthenticated = !!user;
  const role = user?.role || user?.rol || null;

  return (
  <AuthContext.Provider value={{ user, role, isAuthenticated, login, logout, loading }}>
    {children}
  </AuthContext.Provider>
);
}
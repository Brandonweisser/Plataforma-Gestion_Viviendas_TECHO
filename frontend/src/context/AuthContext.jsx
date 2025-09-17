import React, { createContext, useState, useEffect } from "react";
import { decodeJwt } from "../utils/validation";
import { normalizeRole } from "../utils/roles";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUserRaw = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    if (savedToken && !savedUserRaw) {
      // Intentar reconstruir desde token solo (mínimo role)
      const decoded = decodeJwt(savedToken);
      if (decoded) {
        const rebuilt = { token: savedToken, role: decoded.role };
        setUser(rebuilt);
        localStorage.setItem("user", JSON.stringify(rebuilt));
        return;
      }
    }
    if (savedUserRaw) {
      try {
        const parsed = JSON.parse(savedUserRaw);
        // Normalizar role
        if (parsed.role) parsed.role = normalizeRole(parsed.role);
        if (parsed.rol) parsed.role = normalizeRole(parsed.rol);
        setUser(parsed);
      } catch (_) {
        // Corrupto => limpiar
        localStorage.removeItem("user");
      }
    }
  }, []);

  const login = (userData) => {
    const normalized = { ...userData };
    if (normalized.rol && !normalized.role) normalized.role = normalized.rol;
    normalized.role = normalizeRole(normalized.role);
    setUser(normalized);
    localStorage.setItem("user", JSON.stringify(normalized));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const isAuthenticated = !!user;
  const role = user?.role || user?.rol || null;

  return (
    <AuthContext.Provider value={{ user, role, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

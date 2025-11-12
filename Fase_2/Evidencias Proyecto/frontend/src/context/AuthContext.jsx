import React, { createContext, useState, useEffect } from "react";
import { decodeJwt } from "../utils/validation";
import { normalizeRole } from "../utils/roles";

// Provide safe defaults so that accidental usage outside the provider
// doesn't immediately throw due to destructuring undefined. We still log a warning.
export const AuthContext = createContext({
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => console.warn("AuthContext.login called outside provider"),
  logout: () => console.warn("AuthContext.logout called outside provider")
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log(' AuthProvider - Estado actual del usuario:', user);
  console.log(' AuthProvider - isLoading:', isLoading);

  useEffect(() => {
    console.log('AuthProvider - Iniciando verificación de autenticación...');
    const savedUserRaw = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    
    console.log('AuthProvider - savedUserRaw:', savedUserRaw);
    console.log('AuthProvider - savedToken presente:', !!savedToken);
    console.log('AuthProvider - savedToken (primeros 20):', savedToken?.substring(0, 20) + '...');
    
    try {
      if (savedToken && !savedUserRaw) {
        console.log('AuthProvider - Intentando reconstruir desde token...');
        // Intentar reconstruir desde token solo (mínimo role)
        const decoded = decodeJwt(savedToken);
        console.log('AuthProvider - Token decodificado:', decoded);
        if (decoded) {
          const now = Math.floor(Date.now() / 1000);
          if (decoded.exp && decoded.exp < now) {
            console.warn('AuthProvider - Token expirado al reconstruir. Limpiando.');
            localStorage.removeItem('token');
          } else {
            const rebuilt = { token: savedToken, role: decoded.role };
            console.log('AuthProvider - Usuario reconstruido:', rebuilt);
            setUser(rebuilt);
            localStorage.setItem("user", JSON.stringify(rebuilt));
          }
        } else {
          console.log('AuthProvider - No se pudo decodificar el token');
        }
      } else if (savedUserRaw) {
        console.log('AuthProvider - Cargando usuario desde localStorage...');
        try {
          const parsed = JSON.parse(savedUserRaw);
          console.log('AuthProvider - Usuario parseado:', parsed);
          // Normalizar role
          if (parsed.role) parsed.role = normalizeRole(parsed.role);
          if (parsed.rol) parsed.role = normalizeRole(parsed.rol);
          
          // 🆕 Si no hay role, intentar reconstruir desde el token
          if (!parsed.role && savedToken) {
            console.log('AuthProvider - Role faltante, reconstruyendo desde token...');
            const decoded = decodeJwt(savedToken);
            if (decoded?.role || decoded?.rol) {
              parsed.role = normalizeRole(decoded.role || decoded.rol);
              console.log('AuthProvider - Role reconstruido:', parsed.role);
              // Actualizar localStorage con el role corregido
              localStorage.setItem("user", JSON.stringify(parsed));
            }
          }
          
          // Validar expiración si existe token
          const saved = localStorage.getItem('token');
          if (saved) {
            const decoded = decodeJwt(saved);
            const now = Math.floor(Date.now() / 1000);
            if (decoded?.exp && decoded.exp < now) {
              console.warn('AuthProvider - Token expirado al cargar usuario. Limpiando sesión.');
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              setUser(null);
            } else {
              console.log('AuthProvider - Usuario normalizado:', parsed);
              setUser(parsed);
            }
          } else {
            console.log('AuthProvider - Usuario normalizado (sin token extra):', parsed);
            setUser(parsed);
          }
        } catch (error) {
          console.error('AuthProvider - Error parseando usuario:', error);
          // Corrupto => limpiar
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        }
      } else {
        console.log('AuthProvider - No hay usuario guardado en localStorage');
      }
    } finally {
      console.log('AuthProvider - Carga inicial completada, estableciendo isLoading = false');
      setIsLoading(false);
    }
  }, []);

  const login = (userData) => {
    console.log('AuthContext - Ejecutando login con datos:', userData);
    const normalized = { ...userData };
    if (normalized.rol && !normalized.role) normalized.role = normalized.rol;
    normalized.role = normalizeRole(normalized.role);
    console.log('AuthContext - Datos normalizados:', normalized);
    setUser(normalized);
    localStorage.setItem("user", JSON.stringify(normalized));
    console.log('AuthContext - Usuario logueado exitosamente');
  };

  const logout = () => {
    console.log('AuthContext - Ejecutando logout...');
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    console.log('AuthContext - Logout completado');
  };

  const isAuthenticated = !!user;
  const role = user?.role || user?.rol || null;

  console.log('AuthContext - Estado final:');
  console.log('  - isLoading:', isLoading);
  console.log('  - isAuthenticated:', isAuthenticated);
  console.log('  - role:', role);
  console.log('  - user:', user);

  return (
    <AuthContext.Provider value={{ user, role, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

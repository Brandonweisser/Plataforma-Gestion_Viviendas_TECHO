import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Recupera sesión guardada
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (userData) => {
    console.log("🔄 AuthContext - Saving user data:", userData); // Debug
    console.log("🔄 AuthContext - User role specifically:", userData?.rol); // Debug específico
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

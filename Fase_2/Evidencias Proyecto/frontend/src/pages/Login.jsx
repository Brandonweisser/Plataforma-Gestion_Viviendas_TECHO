import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardPathFor } from "../utils/roles";
import { login as loginApi, getMe } from "../services/api";
import { collectLoginValidation, decodeJwt } from "../utils/validation";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    // Validaciones cliente antes de llamar API
    const validationErrors = collectLoginValidation({ email, password });
    if (validationErrors.length) {
      setError(validationErrors[0]);
      return; // No continuar si hay error
    }
    setIsLoading(true);
    
    try {
      // 1. Hacer login y obtener token
  const loginData = await loginApi({ email, password });
      console.log("🔐 Login response:", loginData); // Debug
      localStorage.setItem("token", loginData.token);
  // Decodificar rol inmediatamente (optimiza UX si /api/me falla)
  const decoded = decodeJwt(loginData.token);
      
      // 2. Obtener información del usuario
      try {
        const userData = await getMe();
        console.log("👤 User data from /api/me:", userData); // Debug
        console.log("👤 Specific user role:", userData.data?.rol); // Debug específico del rol
        
        // 3. Guardar en el contexto con datos completos
        const userToSave = {
          email: email,
          token: loginData.token,
          role: decoded?.role || userData.data?.rol,
          ...userData.data
        };
        console.log("💾 Saving to context:", userToSave); // Debug
        login(userToSave);
        // Guardamos el rol efectivo para usar en la redirección
        var effectiveRole = userToSave.role;
      } catch (userError) {
        console.error("❌ Error getting user data:", userError); // Debug
        console.error("❌ Error details:", userError.message); // Debug
        console.error("❌ Error status:", userError.status); // Debug
        // En lugar de fallback, mostramos el error para debuggear
  throw new Error(`No se pudieron obtener los datos del usuario: ${userError.message}`);
      }
      
    // 4. Redirigir según rol
  const target = dashboardPathFor(effectiveRole || decoded?.role);
    navigate(target);
    } catch (err) {
      console.error("🚨 Login error:", err); // Debug
      setError(err.message || "Error de conexión con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="flex flex-col justify-center w-full max-w-md bg-white rounded-r-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">
          Plataforma Gestión de Viviendas
        </h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="ejemplo@correo.com"
              required
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none pr-12"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-2 text-sm text-blue-600 hover:underline focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 ${
              isLoading 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700"
            } text-white rounded-lg font-semibold shadow-md transition`}
          >
            {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>
        <button
            type="button"
            onClick={() => navigate("/registro")}
            className="w-full mt-2 py-2 px-4 bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 rounded-lg font-semibold shadow-sm transition"
          >
            Crear cuenta
          </button>
        <p className="text-center text-sm text-gray-600 mt-6">
          ¿Olvidaste tu contraseña?{" "}
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-blue-600 hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </p>
      </div>
      <div className="hidden md:flex flex-1 items-center justify-center">
        <img
          src="https://cl.techo.org/wp-content/uploads/sites/9/2021/11/Thumbnail-1024x538.png"
          alt="Vivienda"
          className="object-cover h-full w-full rounded-l-2xl"
        />
      </div>
    </div>
  );
}
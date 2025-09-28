import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser, getMe } from "../services/api";
import { collectRegisterValidation, decodeJwt } from "../utils/validation";
import { AuthContext } from "../context/AuthContext";
import { dashboardPathFor } from "../utils/roles";

export default function Registro() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rut, setRut] = useState("");
  const [direccion, setDireccion] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const validationErrors = collectRegisterValidation({ name, email, password, confirm, rut });
    if (validationErrors.length) {
      setError(validationErrors[0]);
      return;
    }

    setLoading(true);
    try {
      // 1. Registrar usuario
      const data = await registerUser({ name, email, password, rut, direccion });
      
      if (data.token) {
        // 2. Guardar token
        localStorage.setItem("token", data.token);
        const decoded = decodeJwt(data.token);
        // 3. Obtener información del usuario y actualizar contexto
        let effectiveRole = decoded?.role;
        try {
          const userData = await getMe();
          effectiveRole = decoded?.role || userData.data?.rol;
          login({
            email: email,
            name: name,
            role: effectiveRole,
            rut: rut,
            direccion: direccion,
            ...userData.data
          });
        } catch (userError) {
          // Si no podemos obtener los datos del usuario, usamos datos básicos
          login({
            email: email,
            name: name,
            token: data.token,
            role: effectiveRole,
            rut: rut,
            direccion: direccion
          });
        }
        const target = dashboardPathFor(effectiveRole);
        navigate(target);
      } else {
        navigate("/");
      }
    } catch (err) {
      if (err.status === 409) {
        setError(err.message || "El correo o RUT ya está registrado");
      } else {
        setError(err.message || "Error de conexión con el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="flex flex-col justify-center w-full max-w-md bg-white rounded-r-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">
          Registro de Beneficiario
        </h1>
        <p className="text-sm text-gray-600 text-center mb-4">
          Regístrate para acceder a la plataforma de gestión de tu vivienda
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="reg-name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              id="reg-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Tu nombre"
              required
            />
          </div>
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="ejemplo@correo.com"
              required
            />
          </div>
          <div>
            <label htmlFor="reg-rut" className="block text-sm font-medium text-gray-700 mb-1">
              RUT <span className="text-red-500">*</span>
            </label>
            <input
              id="reg-rut"
              type="text"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              className="form-input w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="12345678-9"
              required
            />
          </div>
          <div>
            <label htmlFor="reg-direccion" className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input
              id="reg-direccion"
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className="form-input w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Tu dirección (opcional)"
            />
          </div>
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none pr-12"
                placeholder="••••••••"
                required
                minLength={6}
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
          <div>
            <label htmlFor="reg-confirm" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                id="reg-confirm"
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="form-input w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none pr-12"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-2 top-2 text-sm text-blue-600 hover:underline focus:outline-none"
                tabIndex={-1}
              >
                {showConfirm ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-lg font-semibold shadow-md transition text-white ${
              loading
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Creando..." : "Crear cuenta"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-full mt-2 py-2 px-4 bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 rounded-lg font-semibold shadow-sm transition"
        >
          Ya tengo cuenta
        </button>
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
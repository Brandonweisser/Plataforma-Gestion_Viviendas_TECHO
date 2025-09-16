import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser, getMe } from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function Registro() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      // 1. Registrar usuario
      const data = await registerUser({ name, email, password });
      
      if (data.token) {
        // 2. Guardar token
        localStorage.setItem("token", data.token);
        
        // 3. Obtener información del usuario y actualizar contexto
        try {
          const userData = await getMe();
          login({
            email: email,
            name: name,
            ...userData.data
          });
        } catch (userError) {
          // Si no podemos obtener los datos del usuario, usamos datos básicos
          login({
            email: email,
            name: name,
            token: data.token
          });
        }
        
        navigate("/home");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="flex flex-col justify-center w-full max-w-md bg-white rounded-r-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">
          Crear cuenta
        </h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Tu nombre"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="ejemplo@correo.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none pr-12"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none pr-12"
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
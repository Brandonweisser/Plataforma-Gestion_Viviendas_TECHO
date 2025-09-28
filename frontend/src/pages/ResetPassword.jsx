import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { resetPassword } from "../services/api";
import { validatePasswordBasic } from "../utils/validation";

export default function ResetPassword() {
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("No se encontró el correo electrónico. Por favor, vuelve a solicitar el código.");
      return;
    }

    if (!code.trim()) {
      setError("El código de verificación es requerido");
      return;
    }

    if (code.trim().length !== 6) {
      setError("El código debe tener 6 dígitos");
      return;
    }

    const passwordValidation = validatePasswordBasic(newPassword);
    if (!passwordValidation.ok) {
      setError(passwordValidation.message);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ 
        email, 
        code: code.trim(), 
        newPassword 
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-blue-100 to-blue-300">
        <div className="flex flex-col justify-center w-full max-w-md bg-white rounded-r-2xl shadow-xl p-8 mx-auto">
          <div className="text-center">
            <div className="mb-4">
              <svg 
                className="mx-auto h-12 w-12 text-green-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-blue-700 mb-4">
              ¡Contraseña actualizada!
            </h1>
            <p className="text-gray-600 mb-6">
              Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            <button
              onClick={() => navigate("/")}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md transition"
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="flex flex-col justify-center w-full max-w-md bg-white rounded-r-2xl shadow-xl p-8 mx-auto">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">
          Restablecer contraseña
        </h1>
        
        <p className="text-gray-600 text-center mb-6">
          Ingresa el código que recibiste por correo y tu nueva contraseña.
          {email && (
            <><br /><strong>Correo:</strong> {email}</>
          )}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="reset-code" className="block text-sm font-medium text-gray-700 mb-1">
              Código de verificación
            </label>
            <input
              id="reset-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="form-input w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-center text-xl tracking-wider"
              placeholder="123456"
              maxLength="6"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Ingresa el código de 6 dígitos</p>
          </div>

          <div>
            <label htmlFor="reset-password" className="block text-sm font-medium text-gray-700 mb-1">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                id="reset-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-input w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none pr-12"
                placeholder="••••••••"
                required
                minLength="6"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2 text-sm text-blue-600 hover:underline focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="reset-confirm" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar nueva contraseña
            </label>
            <div className="relative">
              <input
                id="reset-confirm"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none pr-12"
                placeholder="••••••••"
                required
                minLength="6"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
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
            {loading ? "Actualizando..." : "Actualizar contraseña"}
          </button>
        </form>

        <div className="mt-6 space-y-2">
          <Link
            to="/forgot-password"
            className="block w-full py-2 px-4 bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 rounded-lg font-semibold shadow-sm transition text-center"
          >
            Solicitar nuevo código
          </Link>
          <Link
            to="/"
            className="block text-center text-sm text-blue-600 hover:underline"
          >
            Volver al login
          </Link>
        </div>
      </div>
    </div>
  );
}
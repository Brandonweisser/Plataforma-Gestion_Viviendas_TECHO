import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { forgotPassword } from "../services/api";
import { isValidEmail } from "../utils/validation";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!email.trim()) {
      setError("El correo electrónico es requerido");
      return;
    }
    
    if (!isValidEmail(email)) {
      setError("El correo electrónico no es válido");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword({ email: email.trim() });
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
              ¡Código enviado!
            </h1>
            <p className="text-gray-600 mb-6">
              Si el correo existe en nuestro sistema, recibirás un código de recuperación.
              <br />
              <strong>Revisa tu bandeja de entrada y spam.</strong>
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/reset-password", { state: { email } })}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md transition"
              >
                Ingresar código
              </button>
              <Link
                to="/"
                className="block w-full py-2 px-4 bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 rounded-lg font-semibold shadow-sm transition text-center"
              >
                Volver al login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="flex flex-col justify-center w-full max-w-md bg-white rounded-r-2xl shadow-xl p-8 mx-auto">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">
          Recuperar contraseña
        </h1>
        
        <p className="text-gray-600 text-center mb-6">
          Ingresa tu correo electrónico y te enviaremos un código para restablecer tu contraseña.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="ejemplo@correo.com"
              required
            />
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
            {loading ? "Enviando..." : "Enviar código"}
          </button>
        </form>

        <div className="mt-6 space-y-2">
          <Link
            to="/"
            className="block w-full py-2 px-4 bg-white text-blue-600 border border-blue-600 hover:bg-blue-50 rounded-lg font-semibold shadow-sm transition text-center"
          >
            Volver al login
          </Link>
          <Link
            to="/registro"
            className="block text-center text-sm text-blue-600 hover:underline"
          >
            ¿No tienes cuenta? Regístrate
          </Link>
        </div>
      </div>
    </div>
  );
}
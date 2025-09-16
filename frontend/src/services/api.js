// Servicio API centralizado para el frontend
const BASE_URL = import.meta?.env?.VITE_API_URL || 'http://localhost:3001';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    const message = data.message || `Error HTTP ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export async function registerUser({ name, email, password, rol }) {
  // El backend acepta name o nombre; enviamos ambos por claridad
  return request('/api/register', {
    method: 'POST',
    body: JSON.stringify({ name, nombre: name, email, password, rol }),
  });
}

export async function login({ email, password }) {
  return request('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe() {
  const token = localStorage.getItem('token');
  return request('/api/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

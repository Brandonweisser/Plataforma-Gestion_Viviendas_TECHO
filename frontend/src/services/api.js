// Servicio API centralizado para el frontend
// Create React App uses REACT_APP_* env vars; fallback to localhost for dev
const BASE_URL = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL
  : 'http://localhost:3001';

function getToken() {
  try { return localStorage.getItem('token'); } catch { return null }
}

function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function request(path, options = {}) {
  const mergedHeaders = {
    'Content-Type': 'application/json',
    ...authHeaders(),
    ...(options.headers || {})
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers: mergedHeaders });
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
  return request('/api/me');
}

// ---------------- Beneficiario ----------------
export const beneficiarioApi = {
  vivienda() {
    return request('/api/beneficiario/vivienda');
  },
  recepcionResumen() {
    return request('/api/beneficiario/recepcion');
  },
  recepcionItems() {
    return request('/api/beneficiario/recepcion/items');
  },
  crearRecepcion() {
    return request('/api/beneficiario/recepcion', { method: 'POST', body: JSON.stringify({}) });
  },
  guardarRecepcionItems(items) {
    return request('/api/beneficiario/recepcion/items', { method: 'POST', body: JSON.stringify({ items }) });
  },
  enviarRecepcion() {
    return request('/api/beneficiario/recepcion/enviar', { method: 'POST', body: JSON.stringify({}) });
  },
  listarIncidencias(limit = 50) {
    return request(`/api/beneficiario/incidencias?limit=${encodeURIComponent(limit)}&includeMedia=1`);
  },
  crearIncidencia({ descripcion, categoria }) {
    return request('/api/beneficiario/incidencias', { method: 'POST', body: JSON.stringify({ descripcion, categoria }) });
  },
  async listarMediaIncidencia(id) {
    return request(`/api/beneficiario/incidencias/${id}/media`)
  },
  async subirMediaIncidencia(id, files) {
    const form = new FormData()
    ;(files || []).forEach(f => form.append('files', f))
    const res = await fetch(`${BASE_URL}/api/beneficiario/incidencias/${id}/media`, {
      method: 'POST',
      headers: { ...authHeaders() },
      body: form
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data.success === false) {
      const message = data.message || `Error HTTP ${res.status}`
      const error = new Error(message)
      error.status = res.status
      error.data = data
      throw error
    }
    return data
  }
}

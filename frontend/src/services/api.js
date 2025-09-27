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
  const token = getToken();
  console.log('🔐 API Request - Path:', path);
  console.log('🔐 API Request - Token presente:', !!token);
  console.log('🔐 API Request - Token (primeros 20):', token?.substring(0, 20) + '...');
  
  const mergedHeaders = {
    'Content-Type': 'application/json',
    ...authHeaders(),
    ...(options.headers || {})
  };
  
  console.log('📡 API Request - URL completa:', `${BASE_URL}${path}`);
  console.log('📡 API Request - Headers:', mergedHeaders);
  
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers: mergedHeaders });
  console.log('📡 API Response - Status:', res.status, res.statusText);
  
  const data = await res.json().catch(() => ({}));
  console.log('📡 API Response - Data:', data);
  
  if (!res.ok || data.success === false) {
    const message = data.message || `Error HTTP ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    console.error('❌ API Error:', error);
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
  listarIncidencias(limit = 50, offset = 0, extraQuery = '') {
    const qs = `limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}&includeMedia=1` + (extraQuery ? `&${extraQuery}` : '');
    return request(`/api/beneficiario/incidencias?${qs}`);
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
  },
  // ---- POSVENTA ----
  posventaGetForm() {
    return request('/api/beneficiario/posventa/form')
  },
  posventaCrearForm() {
    return request('/api/beneficiario/posventa/form', { method: 'POST', body: JSON.stringify({}) })
  },
  posventaGuardarItems(items) {
    // Backend ahora espera un array de objetos existentes con {id, ok, severidad, comentario, crear_incidencia}
    return request('/api/beneficiario/posventa/form/items', { method: 'POST', body: JSON.stringify({ items }) })
  },
  posventaEnviar() {
    return request('/api/beneficiario/posventa/form/enviar', { method: 'POST', body: JSON.stringify({}) })
  },
  async posventaSubirFotoItem(itemId, file) {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE_URL}/api/beneficiario/posventa/form/items/${itemId}/foto`, {
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

// ---------------- Técnico ----------------
export const tecnicoApi = {
  listarIncidencias({ limit = 50, offset = 0, estado, categoria, prioridad, search, asignacion = 'all', includeMedia = true } = {}) {
    const params = new URLSearchParams()
    params.set('limit', limit)
    params.set('offset', offset)
    if (includeMedia) params.set('includeMedia', '1')
    if (estado) params.set('estado', estado)
    if (categoria) params.set('categoria', categoria)
    if (prioridad) params.set('prioridad', prioridad)
    if (search) params.set('search', search)
    if (asignacion) params.set('asignacion', asignacion)
    return request(`/api/tecnico/incidencias?${params.toString()}`)
  },
  detalleIncidencia(id) {
    return request(`/api/tecnico/incidencias/${id}`)
  },
  asignarIncidencia(id) {
    return request(`/api/tecnico/incidencias/${id}/asignar`, { method: 'POST', body: JSON.stringify({}) })
  },
  cambiarEstadoIncidencia(id, nuevo_estado, comentario) {
    return request(`/api/tecnico/incidencias/${id}/estado`, { method: 'POST', body: JSON.stringify({ nuevo_estado, comentario }) })
  },
  historialIncidencia(id) {
    return request(`/api/incidencias/${id}/historial`)
  }
}

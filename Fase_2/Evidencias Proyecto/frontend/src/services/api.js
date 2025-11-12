// Servicio API centralizado para el frontend
// Create React App uses REACT_APP_* env vars; fallback to localhost for dev
import { getToken } from './token'
const BASE_URL = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL
  : 'http://localhost:3001';

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

export async function registerUser({ name, email, password, rut, direccion }) {
  // El backend acepta name o nombre; enviamos ambos por claridad
  return request('/api/register', {
    method: 'POST',
    body: JSON.stringify({ name, nombre: name, email, password, rut, direccion }),
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

// Funciones para recuperación de contraseña
export async function forgotPassword({ email }) {
  return request('/api/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword({ email, code, newPassword }) {
  return request('/api/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, code, newPassword }),
  });
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
  crearIncidencia({ descripcion, categoria, garantia_tipo }) {
    return request('/api/beneficiario/incidencias', { method: 'POST', body: JSON.stringify({ descripcion, categoria, garantia_tipo }) });
  },
  validarIncidencia(id, { conforme, comentario }) {
    return request(`/api/beneficiario/incidencias/${id}/validar`, { method: 'POST', body: JSON.stringify({ conforme, comentario }) })
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
  },
  posventaListarPlanos() {
    return request('/api/beneficiario/posventa/planos')
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
  planosFormularioPosventa(id) {
    return request(`/api/tecnico/posventa/form/${id}/planos`)
  },
  detalleIncidencia(id) {
    return request(`/api/tecnico/incidencias/${id}`)
  },
  asignarIncidencia(id) {
    // Auto-asignarse la incidencia
    return request(`/api/tecnico/incidencias/${id}/asignar-a-mi`, { method: 'POST', body: JSON.stringify({}) })
  },
  // 🆕 Asignar incidencia a otro técnico (solo supervisores)
  // payload puede ser: string (tecnico_uid) o objeto { tecnico_uid, fecha_visita_sugerida }
  asignarIncidenciaATecnico(incidenciaId, payload) {
    // Si payload es string, convertir a objeto
    const body = typeof payload === 'string' || payload === null
      ? { tecnico_uid: payload }
      : payload
    
    return request(`/api/tecnico/incidencias/${incidenciaId}/asignar`, { 
      method: 'POST', 
      body: JSON.stringify(body) 
    })
  },
  // 🆕 Listar técnicos disponibles para asignar (solo supervisores)
  listarTecnicosDisponibles() {
    return request(`/api/tecnico/tecnicos-disponibles`)
  },
  // 🆕 Obtener visitas sugeridas para hoy (técnicos de campo y supervisores)
  obtenerVisitasSugeridas(fecha = null) {
    const params = fecha ? `?fecha=${fecha}` : ''
    return request(`/api/tecnico/visitas-sugeridas${params}`)
  },
  cambiarEstadoIncidencia(id, nuevo_estado, comentario) {
    // Backend espera PUT y el campo 'estado' en el payload
    return request(`/api/tecnico/incidencias/${id}/estado`, { method: 'PUT', body: JSON.stringify({ estado: nuevo_estado, comentario }) })
  },
  historialIncidencia(id) {
    return request(`/api/incidencias/${id}/historial`)
  },
  editarIncidencia(id, { descripcion, prioridad }) {
    return request(`/api/tecnico/incidencias/${id}/editar`, { method: 'POST', body: JSON.stringify({ descripcion, prioridad }) })
  },
  comentarIncidencia(id, comentario) {
    return request(`/api/tecnico/incidencias/${id}/comentar`, { method: 'POST', body: JSON.stringify({ comentario }) })
  },
  async comentarConMedia(id, comentario, files) {
    const form = new FormData()
    form.append('comentario', comentario)
    for (const file of files) {
      form.append('files', file)
    }
    const res = await fetch(`${BASE_URL}/api/tecnico/incidencias/${id}/comentar-con-media`, { 
      method: 'POST', 
      headers: { ...authHeaders() }, 
      body: form 
    })
    const data = await res.json().catch(()=>({}))
    if (!res.ok || data.success === false) { 
      const err = new Error(data.message || 'Error agregando comentario con media')
      err.data = data
      throw err
    }
    return data
  },
  obtenerMediaComentario(comentarioId) {
    return request(`/api/tecnico/comentarios/${comentarioId}/media`)
  },
  async subirMediaIncidencia(id, file) {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE_URL}/api/tecnico/incidencias/${id}/media`, { method: 'POST', headers: { ...authHeaders() }, body: form })
    const data = await res.json().catch(()=>({}))
    if (!res.ok || data.success === false) { const err = new Error(data.message || 'Error subiendo media'); err.data = data; throw err }
    return data
  }
  ,
  dashboardStats(month) {
    const params = new URLSearchParams()
    if (month) params.set('month', month)
    return request(`/api/tecnico/dashboard/stats${params.toString() ? `?${params.toString()}` : ''}`)
  }
}

// ---------------- Administrador ----------------
export const adminApi = {
  // Gestión de usuarios
  listarUsuarios() {
    return request('/api/admin/usuarios')
  },
  crearUsuario(userData) {
    return request('/api/admin/usuarios', { method: 'POST', body: JSON.stringify(userData) })
  },
  actualizarUsuario(id, userData) {
    return request(`/api/admin/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(userData) })
  },
  eliminarUsuario(id) {
    return request(`/api/admin/usuarios/${id}`, { method: 'DELETE' })
  },
  invitarUsuario({ email, nombre, rol }) {
    return request('/api/admin/usuarios/invitar', { method: 'POST', body: JSON.stringify({ email, nombre, rol }) })
  },
  
  // Gestión de proyectos
  listarProyectos() {
    return request('/api/admin/proyectos')
  },
  crearProyecto(projectData) {
    return request('/api/admin/proyectos', { method: 'POST', body: JSON.stringify(projectData) })
  },
  actualizarProyecto(id, projectData) {
    return request(`/api/admin/proyectos/${id}`, { method: 'PUT', body: JSON.stringify(projectData) })
  },
  eliminarProyecto(id) {
    return request(`/api/admin/proyectos/${id}`, { method: 'DELETE' })
  },
  
  // Gestión de viviendas
  listarViviendas() {
    return request('/api/admin/viviendas')
  },
  crearVivienda(housingData) {
    return request('/api/admin/viviendas', { method: 'POST', body: JSON.stringify(housingData) })
  },
  actualizarVivienda(id, housingData) {
    return request(`/api/admin/viviendas/${id}`, { method: 'PUT', body: JSON.stringify(housingData) })
  },
  eliminarVivienda(id) {
    return request(`/api/admin/viviendas/${id}`, { method: 'DELETE' })
  },
  asignarVivienda(viviendaId, beneficiarioId) {
    return request(`/api/admin/viviendas/${viviendaId}/asignar`, { 
      method: 'POST', 
      body: JSON.stringify({ beneficiario_uid: beneficiarioId }) 
    })
  },
  desasignarVivienda(viviendaId) {
    return request(`/api/admin/viviendas/${viviendaId}/desasignar`, { 
      method: 'POST' 
    })
  },
  
  // Asignación de técnicos a proyectos
  asignarTecnicoProyecto(proyectoId, tecnicoId) {
    return request(`/api/admin/proyectos/${proyectoId}/tecnicos`, { 
      method: 'POST', 
      body: JSON.stringify({ tecnico_uid: tecnicoId }) 
    })
  },
  removerTecnicoProyecto(proyectoId, tecnicoId) {
    return request(`/api/admin/proyectos/${proyectoId}/tecnicos/${tecnicoId}`, { 
      method: 'DELETE' 
    })
  },
  listarTecnicosProyecto(proyectoId) {
    return request(`/api/admin/proyectos/${proyectoId}/tecnicos`)
  },
  
  // Dashboard y estadísticas
  obtenerEstadisticas() {
    return request('/api/admin/dashboard/stats')
  },
  obtenerActividad() {
    return request('/api/admin/dashboard/activity')
  },
  obtenerAnalytics({ days } = {}) {
    const params = new URLSearchParams()
    if (days) params.set('days', String(days))
    const qs = params.toString()
    return request(`/api/admin/dashboard/analytics${qs ? `?${qs}` : ''}`)
  },

  // ---- Templates de Postventa ----
  listarTemplates({ tipo_vivienda, activo } = {}) {
    const params = new URLSearchParams()
    if (tipo_vivienda) params.set('tipo_vivienda', tipo_vivienda)
    if (typeof activo !== 'undefined') params.set('activo', String(activo))
    const qs = params.toString()
    return request(`/api/admin/postventa/templates${qs ? `?${qs}` : ''}`)
  },
  crearTemplate({ nombre, tipo_vivienda }) {
    return request('/api/admin/postventa/templates', { method: 'POST', body: JSON.stringify({ nombre, tipo_vivienda }) })
  },
  actualizarTemplate(id, { nombre, activo }) {
    return request(`/api/admin/postventa/templates/${id}`, { method: 'PUT', body: JSON.stringify({ nombre, activo }) })
  },
  desactivarTemplate(id) {
    return request(`/api/admin/postventa/templates/${id}`, { method: 'DELETE' })
  },
  listarItemsTemplate(templateId) {
    return request(`/api/admin/postventa/templates/${templateId}/items`)
  },
  listarArchivosTemplate(templateId) {
    return request(`/api/admin/postventa/templates/${templateId}/files`)
  },
  eliminarArchivoTemplate(templateId, fileId) {
    return request(`/api/admin/postventa/templates/${templateId}/files/${fileId}`, { method: 'DELETE' })
  },
  convertirArchivoTemplateAPdf(templateId, fileId) {
    return request(`/api/admin/postventa/templates/${templateId}/files/${fileId}/convert-pdf`, { method: 'POST', body: JSON.stringify({}) })
  },
  async subirArchivoTemplate(templateId, file) {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE_URL}/api/admin/postventa/templates/${templateId}/files`, { method: 'POST', headers: { ...authHeaders() }, body: form })
    const data = await res.json().catch(()=>({}))
    if (!res.ok || data.success === false) { const err = new Error(data.message || 'Error subiendo archivo'); err.data = data; throw err }
    return data
  },
  agregarItemsTemplate(templateId, items) {
    return request(`/api/admin/postventa/templates/${templateId}/items`, { method: 'POST', body: JSON.stringify({ items }) })
  },
  actualizarItemTemplate(templateId, itemId, payload) {
    return request(`/api/admin/postventa/templates/${templateId}/items/${itemId}`, { method: 'PUT', body: JSON.stringify(payload) })
  },
  eliminarItemTemplate(templateId, itemId) {
    return request(`/api/admin/postventa/templates/${templateId}/items/${itemId}`, { method: 'DELETE' })
  },
  // Rooms
  listarRooms(templateId) {
    return request(`/api/admin/postventa/templates/${templateId}/rooms`)
  },
  crearRoom(templateId, { nombre, orden }) {
    return request(`/api/admin/postventa/templates/${templateId}/rooms`, { method: 'POST', body: JSON.stringify({ nombre, orden }) })
  },
  actualizarRoom(templateId, roomId, payload) {
    return request(`/api/admin/postventa/templates/${templateId}/rooms/${roomId}`, { method: 'PUT', body: JSON.stringify(payload) })
  },
  eliminarRoom(templateId, roomId) {
    return request(`/api/admin/postventa/templates/${templateId}/rooms/${roomId}`, { method: 'DELETE' })
  }

  ,
  // Gestión de constructoras
  listarConstructoras() { return request('/api/admin/constructoras') },
  crearConstructora(data) { return request('/api/admin/constructoras', { method: 'POST', body: JSON.stringify(data) }) },
  obtenerConstructora(id) { return request(`/api/admin/constructoras/${id}`) },
  actualizarConstructora(id, data) { return request(`/api/admin/constructoras/${id}`, { method: 'PUT', body: JSON.stringify(data) }) },
  eliminarConstructora(id) { return request(`/api/admin/constructoras/${id}`, { method: 'DELETE' }) },
  listarUsuariosPorConstructora(id) { return request(`/api/admin/constructoras/${id}/usuarios`) },
  asignarConstructoraUsuario(uid, constructora_id) { return request(`/api/admin/usuarios/${uid}/constructora`, { method: 'POST', body: JSON.stringify({ constructora_id }) }) },
  removerConstructoraUsuario(uid) { return request(`/api/admin/usuarios/${uid}/constructora`, { method: 'DELETE' }) },
}

// Invitaciones públicas
export const invitationApi = {
  validar(token) {
    const params = new URLSearchParams({ token })
    return request(`/api/invite/validate?${params.toString()}`)
  },
  aceptar({ token, password, nombre }) {
    return request('/api/invite/accept', { method: 'POST', body: JSON.stringify({ token, password, nombre }) })
  }
}

// Setup inicial (sin autenticación)
export const setupApi = {
  estado() {
    // No enviar token para verificar estado de setup
    return fetch(`${BASE_URL}/api/setup/estado`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }).then(res => res.json())
  },
  crearPrimerAdmin({ email, password, nombre }) {
    // No enviar token para crear primer admin
    return fetch(`${BASE_URL}/api/setup/primer-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nombre })
    }).then(async res => {
      const data = await res.json()
      if (!res.ok || data.success === false) {
        const error = new Error(data.message || 'Error creando admin')
        error.status = res.status
        throw error
      }
      return data
    })
  }
}

// Seguridad y Auditoría
export async function getSecurityDashboard() {
  return request('/api/admin/security/dashboard');
}

export async function getAuditLogs(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append('page', params.page);
  if (params.limit) searchParams.append('limit', params.limit);
  if (params.action) searchParams.append('action', params.action);
  if (params.actor_uid) searchParams.append('actor_uid', params.actor_uid);
  if (params.entity_type) searchParams.append('entity_type', params.entity_type);
  if (params.start_date) searchParams.append('start_date', params.start_date);
  if (params.end_date) searchParams.append('end_date', params.end_date);
  
  const queryString = searchParams.toString();
  return request(`/api/admin/audit-logs${queryString ? '?' + queryString : ''}`);
}

export async function getUserAuditLogs(uid, limit = 100) {
  return request(`/api/admin/audit-logs/user/${uid}?limit=${limit}`);
}

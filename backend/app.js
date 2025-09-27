import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { supabase } from './supabaseClient.js'
import dotenv from 'dotenv'
import multer from 'multer'
import { randomUUID } from 'crypto'
import { posventaPDFServiceAlternativo as posventaPDFService } from './services/PosventaPDFServiceAlternativo.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// Rate limiter para login (3 intentos por minuto por IP)
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos, inténtalo en 1 minuto.' }
})

const JWT_SECRET = process.env.JWT_SECRET
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10)
// Password policy (puede externalizarse después)
function isStrongPassword(pwd) {
  if (typeof pwd !== 'string') return false
  if (pwd.length < 8) return false
  const hasLetter = /[A-Za-z]/.test(pwd)
  const hasNumber = /[0-9]/.test(pwd)
  return hasLetter && hasNumber
}

// --- Helpers & Test Overrides -------------------------------------------------
// We allow injecting mock data-access functions through a global variable in tests
function getOverrides() {
  return global.__supabaseMock || {}
}

function normalizeRole(raw) {
  if (!raw) return null
  const map = {
    admin: 'administrador',
    administrador: 'administrador',
    tecnico: 'tecnico',
    'técnico': 'tecnico',
    beneficiario: 'beneficiario'
  }
  const k = raw.toString().toLowerCase()
  return map[k] || null
}

// Data access helpers (use real supabase unless overridden in tests)
async function findUserByEmail(emailLower) {
  const overrides = getOverrides()
  if (overrides.findUserByEmail) return overrides.findUserByEmail(emailLower)
  const { data, error } = await supabase
    .from('usuarios')
    .select('uid, nombre, email, rol, password_hash')
    .eq('email', emailLower)
    .maybeSingle()
  if (error) throw error
  return data
}

async function getLastUser() {
  const overrides = getOverrides()
  if (overrides.getLastUser) return overrides.getLastUser()
  const { data, error } = await supabase
    .from('usuarios')
    .select('uid')
    .order('uid', { ascending: false })
    .limit(1)
  if (error) throw error
  return Array.isArray(data) && data.length ? data[0] : null
}

async function insertUser(record) {
  const overrides = getOverrides()
  if (overrides.insertUser) return overrides.insertUser(record)
  const { data, error } = await supabase
    .from('usuarios')
    .insert([record])
    .select('uid, rol')
    .single()
  if (error) throw error
  return data
}

async function getUserById(uid) {
  const overrides = getOverrides()
  if (overrides.getUserById) return overrides.getUserById(uid)
  const { data, error } = await supabase
    .from('usuarios')
    .select('uid, nombre, email, rol')
    .eq('uid', uid)
    .single()
  if (error) throw error
  return data
}

// ----------------------------------------------------------------------------
// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

function verifyToken(req, res, next) {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ success: false, message: 'No autenticado' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Token inválido' })
  }
}

function authorizeRole(allowed = []) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'No autenticado' })
    const userRole = normalizeRole(req.user.role)
    const allowedNorm = allowed.map(r => normalizeRole(r)).filter(Boolean)
    if (!allowedNorm.includes(userRole)) {
      return res.status(403).json({ success: false, message: 'No autorizado' })
    }
    next()
  }
}

// Registro
app.post('/api/register', async (req, res) => {
  try {
    const nombre = req.body.nombre || req.body.name
    const { email, password, rol } = req.body
    if (!nombre || !email || !password) {
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos' })
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({ success: false, message: 'Password débil: mínimo 8 caracteres, al menos una letra y un número.' })
    }
    const emailLower = email.toLowerCase()
    const existente = await findUserByEmail(emailLower)
    if (existente) {
      return res.status(409).json({ success: false, message: 'El correo ya está registrado' })
    }
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS)
    const rolInput = (rol || '').toLowerCase()
    const rolMap = { admin: 'administrador', administrador: 'administrador', tecnico: 'tecnico', beneficiario: 'beneficiario' }
    const rolValido = rolMap[rolInput] || 'beneficiario'
    let newUid = 1
    try {
      const last = await getLastUser()
      if (last && Number.isFinite(Number(last.uid))) newUid = Number(last.uid) + 1
    } catch (_) { /* ignore */ }
  const insertado = await insertUser({ uid: newUid, nombre, email: emailLower, rol: rolValido, password_hash })
    if (!JWT_SECRET) {
      return res.status(200).json({ success: true, token: null, message: 'Usuario creado. Falta configurar JWT_SECRET' })
    }
    const token = jwt.sign({ sub: insertado.uid, role: insertado.rol }, JWT_SECRET, { expiresIn: '7d' })
    return res.json({ success: true, token })
  } catch (error) {
    console.error('Register error:', error)
    return res.status(500).json({ success: false, message: 'Error en el servidor' })
  }
})

// Login
app.post('/api/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Faltan credenciales' })
    }
    const usuario = await findUserByEmail(email.toLowerCase())
    if (!usuario) {
      return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos' })
    }
    const stored = usuario.password_hash || ''
    const ok = stored && stored.startsWith('$2') ? await bcrypt.compare(password, stored) : false
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos' })
    }
    if (!JWT_SECRET) {
      return res.status(500).json({ success: false, message: 'JWT_SECRET no configurado en el servidor' })
    }
    const token = jwt.sign({ sub: usuario.uid, role: usuario.rol }, JWT_SECRET, { expiresIn: '7d' })
    return res.json({ success: true, token })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ success: false, message: 'Error en el servidor' })
  }
})

// Me
app.get('/api/me', verifyToken, async (req, res) => {
  try {
    const userId = req.user?.sub
    const data = await getUserById(userId)
    res.json({ success: true, data })
  } catch (e) {
    console.error('❌ Error en /api/me:', e)
    res.status(500).json({ success: false, message: 'No se pudo obtener el usuario' })
  }
})

// Logout (stateless) – en futuro se puede implementar lista de revocación
app.post('/api/logout', (_req, res) => {
  // En arquitectura stateless sólo indicamos al cliente que elimine el token
  return res.json({ success: true, message: 'Sesión cerrada' })
})

// Role protected health endpoints
app.get('/api/admin/health', verifyToken, authorizeRole(['administrador']), (_req, res) => {
  res.json({ success: true, area: 'admin', status: 'ok' })
})
app.get('/api/tecnico/health', verifyToken, authorizeRole(['tecnico','administrador']), (_req, res) => {
  res.json({ success: true, area: 'tecnico', status: 'ok' })
})
app.get('/api/beneficiario/health', verifyToken, authorizeRole(['beneficiario','administrador']), (_req, res) => {
  res.json({ success: true, area: 'beneficiario', status: 'ok' })
})

// Compute incidencia priority on the server to avoid user-influenced bias
function computePriority(categoriaRaw, descripcionRaw) {
  const categoria = (categoriaRaw || '').toString().toLowerCase()
  const desc = (descripcionRaw || '').toString().toLowerCase()

  // Immediate danger to safety
  const danger = [ 'gas', 'fuego', 'incend', 'chispa', 'humo', 'corto', 'electrocut', 'explosi' ]
  if (danger.some(k => desc.includes(k))) return 'alta'
  if (categoria.includes('eléctrico') || categoria.includes('electrico')) {
    if (/(corto|chispa|humo|olor|quemado)/.test(desc)) return 'alta'
    return 'media'
  }

  // Water/plumbing
  const waterHigh = [ 'inund', 'sin agua', 'alcantarill', 'rebalse' ]
  if (waterHigh.some(k => desc.includes(k))) return 'alta'
  if (categoria.includes('plomer') || categoria.includes('agua') || /fuga|goteo|filtraci[óo]n|desag[üu]e/.test(desc)) {
    return /fuga|goteo|filtraci[óo]n/.test(desc) ? 'media' : 'media'
  }

  // Structure
  if (categoria.includes('estructura') || /techo|muro|pared|grieta|colaps/.test(desc)) {
    if (/grieta|colaps|agujero|ca[ií]do/.test(desc)) return 'alta'
    if (/techo|humedad|goteo|filtraci[óo]n/.test(desc)) return 'media'
  }

  // Sanitary critical
  if (/(bañ|sanitari|letrin)/.test(desc) && /(sin|no funciona|rebalse)/.test(desc)) return 'alta'

  // Cosmetic/minor cues → baja
  if (/(pintura|rasgu|mueble|bisagra|cerradura|puerta|ventana)/.test(desc)) return 'baja'

  // Default
  return 'media'
}

// Multer config (memory storage) for small image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }, // 5MB, max 5 files
})

// ------------------------------------------------------------
// Historial (Fase 1) helper
async function logIncidenciaEvent({ incidenciaId, actorUid, actorRol, tipo, estadoAnterior = null, estadoNuevo = null, diff = null, comentario = null, metadata = null }) {
  try {
    const payload = {
      incidencia_id: incidenciaId,
      actor_uid: actorUid || null,
      actor_rol: actorRol || null,
      tipo_evento: tipo,
      estado_anterior: estadoAnterior,
      estado_nuevo: estadoNuevo,
      datos_diff: diff ? JSON.stringify(diff) : null,
      comentario: comentario || null,
      metadata: metadata ? JSON.stringify(metadata) : null
    }
    const { error } = await supabase.from('incidencia_historial').insert([payload])
    if (error) console.warn('No se pudo registrar historial incidencia', error.message)
  } catch (e) {
    console.warn('Error inesperado registrando historial', e.message)
  }
}

// ------------------------------------------------------------
// Fase 2: Endpoints Beneficiario (lectura básica)
// 1) Obtener vivienda asignada + flags de recepción/incidencias
app.get('/api/beneficiario/vivienda', verifyToken, authorizeRole(['beneficiario','administrador']), async (req, res) => {
  try {
    const beneficiarioUid = req.user?.sub
    if (!beneficiarioUid) return res.status(401).json({ success: false, message: 'No autenticado' })

    // Vivienda del beneficiario
    const { data: viv, error: ev } = await supabase
      .from('viviendas')
      .select('id_vivienda, id_proyecto, direccion, estado, beneficiario_uid')
      .eq('beneficiario_uid', beneficiarioUid)
      .maybeSingle()
    if (ev) throw ev
    if (!viv) return res.status(404).json({ success: false, message: 'No tienes una vivienda asignada' })

    // Proyecto
    let proyecto = null
    if (viv.id_proyecto != null) {
      const { data: p, error: ep } = await supabase
        .from('proyecto')
        .select('id_proyecto, nombre, viviendas_count')
        .eq('id_proyecto', viv.id_proyecto)
        .maybeSingle()
      if (ep) throw ep
      proyecto = p
    }

    // Recepción activa (borrador/enviada)
    const { data: recepActiva, error: era } = await supabase
      .from('vivienda_recepcion')
      .select('id, estado, fecha_creada, fecha_enviada, observaciones_count')
      .eq('id_vivienda', viv.id_vivienda)
      .in('estado', ['borrador', 'enviada'])
      .order('id', { ascending: false })
      .limit(1)
    if (era) throw era

    const activa = Array.isArray(recepActiva) && recepActiva.length ? recepActiva[0] : null
    const tiene_recepcion_activa = !!activa
    // Política inicial: se pueden crear incidencias si la recepción fue enviada o revisada
    let puede_incidencias = false
    if (activa && (activa.estado === 'enviada')) puede_incidencias = true
    // También permitir si ya existe alguna recepción revisada (histórica)
    if (!puede_incidencias) {
      const { data: recRev, error: errv } = await supabase
        .from('vivienda_recepcion')
        .select('id')
        .eq('id_vivienda', viv.id_vivienda)
        .eq('estado', 'revisada')
        .limit(1)
      if (errv) throw errv
      puede_incidencias = Array.isArray(recRev) && recRev.length > 0
    }

    return res.json({
      success: true,
      data: {
        vivienda: viv,
        proyecto,
        recepcion_activa: activa,
        flags: { tiene_recepcion_activa, puede_incidencias }
      }
    })
  } catch (e) {
    console.error('GET /api/beneficiario/vivienda error:', e)
    return res.status(500).json({ success: false, message: 'Error al obtener la vivienda' })
  }
})

// 2) Obtener resumen de recepción (vista) de la vivienda del beneficiario
app.get('/api/beneficiario/recepcion', verifyToken, authorizeRole(['beneficiario','administrador']), async (req, res) => {
  try {
    const beneficiarioUid = req.user?.sub
    const { data: viv, error: ev } = await supabase
      .from('viviendas')
      .select('id_vivienda')
      .eq('beneficiario_uid', beneficiarioUid)
      .maybeSingle()
    if (ev) throw ev
    if (!viv) return res.status(404).json({ success: false, message: 'No tienes una vivienda asignada' })

    // Última recepción (de la vista resumen)
    const { data: resumen, error: er } = await supabase
      .from('vista_recepcion_resumen')
      .select('*')
      .eq('id_vivienda', viv.id_vivienda)
      .order('id', { ascending: false })
      .limit(1)
    if (er) throw er

    return res.json({ success: true, data: Array.isArray(resumen) && resumen.length ? resumen[0] : null })
  } catch (e) {
    console.error('GET /api/beneficiario/recepcion error:', e)
    return res.status(500).json({ success: false, message: 'Error al obtener la recepción' })
  }
})

// 3) Obtener ítems de la última recepción del beneficiario
app.get('/api/beneficiario/recepcion/items', verifyToken, authorizeRole(['beneficiario','administrador']), async (req, res) => {
  try {
    const beneficiarioUid = req.user?.sub
    const { data: viv, error: ev } = await supabase
      .from('viviendas')
      .select('id_vivienda')
      .eq('beneficiario_uid', beneficiarioUid)
      .maybeSingle()
    if (ev) throw ev
    if (!viv) return res.status(404).json({ success: false, message: 'No tienes una vivienda asignada' })

    // Última recepción (sin importar estado)
    const { data: receps, error: erc } = await supabase
      .from('vivienda_recepcion')
      .select('id, estado, fecha_creada, fecha_enviada, fecha_revisada, observaciones_count')
      .eq('id_vivienda', viv.id_vivienda)
      .order('id', { ascending: false })
      .limit(1)
    if (erc) throw erc

    const recepcion = Array.isArray(receps) && receps.length ? receps[0] : null
    if (!recepcion) return res.json({ success: true, data: null })

    const { data: items, error: ei } = await supabase
      .from('vivienda_recepcion_item')
      .select('id, categoria, item, ok, comentario, fotos_json, orden')
      .eq('recepcion_id', recepcion.id)
      .order('categoria', { ascending: true })
      .order('orden', { ascending: true, nullsFirst: false })
      .order('id', { ascending: true })
    if (ei) throw ei

    return res.json({ success: true, data: { recepcion, items: items || [] } })
  } catch (e) {
    console.error('GET /api/beneficiario/recepcion/items error:', e)
    return res.status(500).json({ success: false, message: 'Error al obtener los ítems de recepción' })
  }
})

// 4) Listar incidencias de la vivienda del beneficiario
app.get('/api/beneficiario/incidencias', verifyToken, authorizeRole(['beneficiario','administrador']), async (req, res) => {
  try {
    const beneficiarioUid = req.user?.sub
    const limitReq = parseInt(req.query.limit, 10)
    const limit = Number.isFinite(limitReq) ? Math.min(Math.max(limitReq, 1), 100) : 50
    const offsetReq = parseInt(req.query.offset, 10)
    const offset = Number.isFinite(offsetReq) && offsetReq >= 0 ? offsetReq : 0
    const includeMedia = String(req.query.includeMedia || '').toLowerCase() === '1'
    // Filtros opcionales
    const estadoFilter = (req.query.estado || '').toString().trim()
    const categoriaFilter = (req.query.categoria || '').toString().trim()
    const prioridadFilter = (req.query.prioridad || '').toString().trim()
    const searchRaw = (req.query.search || '').toString().trim()
    const search = searchRaw.length >= 2 ? searchRaw : ''

    const { data: viv, error: ev } = await supabase
      .from('viviendas')
      .select('id_vivienda')
      .eq('beneficiario_uid', beneficiarioUid)
      .maybeSingle()
    if (ev) throw ev
    if (!viv) return res.status(404).json({ success: false, message: 'No tienes una vivienda asignada' })

    // Construir query base con filtros (dos copias: count + data)
    let baseCount = supabase
      .from('incidencias')
      .select('id_incidencia', { count: 'exact', head: true })
      .eq('id_vivienda', viv.id_vivienda)
    let baseData = supabase
      .from('incidencias')
      .select('id_incidencia, id_vivienda, descripcion, estado, categoria, prioridad, fecha_reporte, id_usuario_tecnico')
      .eq('id_vivienda', viv.id_vivienda)

    if (estadoFilter) { baseCount = baseCount.eq('estado', estadoFilter); baseData = baseData.eq('estado', estadoFilter) }
    if (categoriaFilter) { baseCount = baseCount.eq('categoria', categoriaFilter); baseData = baseData.eq('categoria', categoriaFilter) }
    if (prioridadFilter) { baseCount = baseCount.eq('prioridad', prioridadFilter.toLowerCase()) ; baseData = baseData.eq('prioridad', prioridadFilter.toLowerCase()) }
    if (search) { baseCount = baseCount.ilike('descripcion', `%${search}%`); baseData = baseData.ilike('descripcion', `%${search}%`) }

    const { count: totalCount, error: countErr } = await baseCount
    if (countErr) throw countErr

    const { data: incs, error: ei } = await baseData
      .order('id_incidencia', { ascending: false })
      .range(offset, offset + limit - 1)
    if (ei) throw ei

    let enriched = incs || []
    if (includeMedia && Array.isArray(enriched) && enriched.length) {
      const ids = enriched.map(i => i.id_incidencia)
      // Intento esquema A (entidad/entidad_id)
      let mediaRows = null
      let mediaError = null
      let schemaVariant = 'A'
      try {
        const rA = await supabase
          .from('media')
          .select('id, entidad, entidad_id, url, metadata_json, created_at')
          .in('entidad_id', ids)
          .eq('entidad', 'incidencia')
        if (rA.error) throw rA.error
        mediaRows = rA.data
      } catch (eA) {
        mediaError = eA
        schemaVariant = 'B'
      }
      if (schemaVariant === 'B') {
        // Intento esquema B (incidencia_id, path, mime, bytes)
        try {
          const rB = await supabase
            .from('media')
            .select('id, incidencia_id, path, mime, bytes, created_at')
            .in('incidencia_id', ids)
          if (rB.error) throw rB.error
          mediaRows = (rB.data || []).map(m => {
            // Derivar URL pública a partir de path
            let url = null
            if (m.path) {
              try {
                const pub = supabase.storage.from('incidencias').getPublicUrl(m.path)
                url = pub?.data?.publicUrl || pub?.publicUrl || null
              } catch (_) { /* ignore */ }
            }
            return { id: m.id, entidad: 'incidencia', entidad_id: m.incidencia_id, url, metadata_json: { mime: m.mime, bytes: m.bytes, path: m.path }, created_at: m.created_at }
          })
        } catch (eB) {
          console.warn('media retrieval failed both variants:', mediaError?.message, eB?.message)
        }
      }
      if (Array.isArray(mediaRows)) {
        const bucketed = {}
        for (const m of mediaRows) {
          const key = m.entidad_id
            if (!bucketed[key]) bucketed[key] = []
            bucketed[key].push(m)
        }
        enriched = enriched.map(i => ({ ...i, media: bucketed[i.id_incidencia] || [] }))
      }
    }

    return res.json({ success: true, data: enriched, meta: { limit, offset, total: totalCount || 0, hasMore: (offset + enriched.length) < (totalCount || 0), filters: { estado: estadoFilter || null, categoria: categoriaFilter || null, prioridad: prioridadFilter || null, search: search || null } } })
  } catch (e) {
    console.error('GET /api/beneficiario/incidencias error:', e)
    return res.status(500).json({ success: false, message: 'Error al obtener las incidencias' })
  }
})

// ------------------------------------------------------------
// Fase 3: Crear/editar (recepción e incidencias)

// 5) Crear recepción en borrador (si no existe una activa)
app.post('/api/beneficiario/recepcion', verifyToken, authorizeRole(['beneficiario','administrador']), async (req, res) => {
  try {
    const beneficiarioUid = req.user?.sub
    const { data: viv, error: ev } = await supabase
      .from('viviendas')
      .select('id_vivienda')
      .eq('beneficiario_uid', beneficiarioUid)
      .maybeSingle()
    if (ev) throw ev
    if (!viv) return res.status(404).json({ success: false, message: 'No tienes una vivienda asignada' })

    // ¿Existe activa?
    const { data: activas, error: ea } = await supabase
      .from('vivienda_recepcion')
      .select('id, estado, fecha_creada, fecha_enviada, observaciones_count')
      .eq('id_vivienda', viv.id_vivienda)
      .in('estado', ['borrador', 'enviada'])
      .order('id', { ascending: false })
      .limit(1)
    if (ea) throw ea
    const activa = Array.isArray(activas) && activas.length ? activas[0] : null
    if (activa) return res.json({ success: true, data: activa, message: 'Ya existe una recepción activa' })

    // Crear borrador
    const { data: creada, error: ec } = await supabase
      .from('vivienda_recepcion')
      .insert([{ id_vivienda: viv.id_vivienda, beneficiario_uid: beneficiarioUid, estado: 'borrador' }])
      .select('id, estado, fecha_creada')
      .single()
    if (ec) throw ec
    return res.status(201).json({ success: true, data: creada })
  } catch (e) {
    console.error('POST /api/beneficiario/recepcion error:', e)
    return res.status(500).json({ success: false, message: 'Error al crear la recepción' })
  }
})

// 6) Guardar ítems del borrador (reemplaza todos los ítems por los enviados)
// Body esperado: { items: [{ categoria, item, ok, comentario, orden, fotos? }] }
app.post('/api/beneficiario/recepcion/items', verifyToken, authorizeRole(['beneficiario','administrador']), async (req, res) => {
  try {
    const beneficiarioUid = req.user?.sub
    const items = Array.isArray(req.body?.items) ? req.body.items : null
    if (!items) return res.status(400).json({ success: false, message: 'items requerido' })

    const { data: viv, error: ev } = await supabase
      .from('viviendas')
      .select('id_vivienda')
      .eq('beneficiario_uid', beneficiarioUid)
      .maybeSingle()
    if (ev) throw ev
    if (!viv) return res.status(404).json({ success: false, message: 'No tienes una vivienda asignada' })

    const { data: receps, error: er } = await supabase
      .from('vivienda_recepcion')
      .select('id, estado')
      .eq('id_vivienda', viv.id_vivienda)
      .eq('estado', 'borrador')
      .order('id', { ascending: false })
      .limit(1)
    if (er) throw er
    const recepcion = Array.isArray(receps) && receps.length ? receps[0] : null
    if (!recepcion) return res.status(409).json({ success: false, message: 'No hay borrador activo; crea la recepción primero' })

    // Reemplazar todos los ítems del borrador
    const { error: edel } = await supabase
      .from('vivienda_recepcion_item')
      .delete()
      .eq('recepcion_id', recepcion.id)
    if (edel) throw edel

    if (items.length > 0) {
      const rows = items.map((it) => ({
        recepcion_id: recepcion.id,
        categoria: String(it.categoria || ''),
        item: String(it.item || ''),
        ok: Boolean(it.ok),
        comentario: it.comentario ?? null,
        fotos_json: Array.isArray(it.fotos) ? it.fotos : undefined,
        orden: Number.isFinite(it.orden) ? it.orden : null
      }))
      const { error: eins } = await supabase
        .from('vivienda_recepcion_item')
        .insert(rows)
      if (eins) throw eins
    }

    return res.json({ success: true })
  } catch (e) {
    console.error('POST /api/beneficiario/recepcion/items error:', e)
    return res.status(500).json({ success: false, message: 'Error al guardar los ítems' })
  }
})

// 7) Enviar recepción (cierra borrador): calcula observaciones_count y pasa a 'enviada'
app.post('/api/beneficiario/recepcion/enviar', verifyToken, authorizeRole(['beneficiario','administrador']), async (req, res) => {
  try {
    const beneficiarioUid = req.user?.sub
    const { data: viv, error: ev } = await supabase
      .from('viviendas')
      .select('id_vivienda')
      .eq('beneficiario_uid', beneficiarioUid)
      .maybeSingle()
    if (ev) throw ev
    if (!viv) return res.status(404).json({ success: false, message: 'No tienes una vivienda asignada' })

    const { data: receps, error: er } = await supabase
      .from('vivienda_recepcion')
      .select('id, estado')
      .eq('id_vivienda', viv.id_vivienda)
      .eq('estado', 'borrador')
      .order('id', { ascending: false })
      .limit(1)
    if (er) throw er
    const recepcion = Array.isArray(receps) && receps.length ? receps[0] : null
    if (!recepcion) return res.status(409).json({ success: false, message: 'No hay borrador activo; crea la recepción primero' })

    const { count, error: eagg } = await supabase
      .from('vivienda_recepcion_item')
      .select('*', { count: 'exact', head: true })
      .eq('recepcion_id', recepcion.id)
      .eq('ok', false)
    if (eagg) throw eagg
    const observaciones = typeof count === 'number' ? count : 0

    const { data: updated, error: eupd } = await supabase
      .from('vivienda_recepcion')
      .update({ estado: 'enviada', fecha_enviada: new Date().toISOString(), observaciones_count: observaciones })
      .eq('id', recepcion.id)
      .select('id, estado, fecha_enviada, observaciones_count')
      .single()
    if (eupd) throw eupd

    return res.json({ success: true, data: updated })
  } catch (e) {
    console.error('POST /api/beneficiario/recepcion/enviar error:', e)
    return res.status(500).json({ success: false, message: 'Error al enviar la recepción' })
  }
})

// 8) Crear incidencia (si la política lo permite)
// Body esperado: { descripcion, categoria }
app.post('/api/beneficiario/incidencias', verifyToken, authorizeRole(['beneficiario','administrador']), async (req, res) => {
  try {
    const beneficiarioUid = req.user?.sub
    const { descripcion, categoria } = req.body || {}
    if (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Descripción inválida' })
    }

    const { data: viv, error: ev } = await supabase
      .from('viviendas')
      .select('id_vivienda')
      .eq('beneficiario_uid', beneficiarioUid)
      .maybeSingle()
    if (ev) throw ev
    if (!viv) return res.status(404).json({ success: false, message: 'No tienes una vivienda asignada' })

    // Política: permitir si hay recepción enviada o existe alguna revisada
    let permitido = false
    const { data: recEnv, error: e1 } = await supabase
      .from('vivienda_recepcion')
      .select('id')
      .eq('id_vivienda', viv.id_vivienda)
      .eq('estado', 'enviada')
      .limit(1)
    if (e1) throw e1
    permitido = Array.isArray(recEnv) && recEnv.length > 0
    if (!permitido) {
      const { data: recRev, error: e2 } = await supabase
        .from('vivienda_recepcion')
        .select('id')
        .eq('id_vivienda', viv.id_vivienda)
        .eq('estado', 'revisada')
        .limit(1)
      if (e2) throw e2
      permitido = Array.isArray(recRev) && recRev.length > 0
    }
    if (!permitido) return res.status(409).json({ success: false, message: 'Aún no puedes crear incidencias (recepción no enviada/revisada)' })

  // Prioridad automática por reglas sencillas (server-side)
  const prioridadAuto = computePriority(categoria, descripcion)

    // Insertar
    const nowIso = new Date().toISOString()
    const record = {
      id_vivienda: viv.id_vivienda,
      id_usuario_reporta: beneficiarioUid,
      descripcion: descripcion.trim(),
      estado: 'abierta',
      categoria: categoria || null,
      prioridad: prioridadAuto,
      prioridad_origen: prioridadAuto,
      prioridad_final: prioridadAuto,
      fecha_reporte: nowIso
    }
    const { data: nueva, error: eins } = await supabase
      .from('incidencias')
      .insert([record])
      .select('id_incidencia, id_vivienda, descripcion, estado, categoria, prioridad, fecha_reporte')
      .single()
    if (eins) throw eins

    // Registrar historial (creada)
    try {
      await logIncidenciaEvent({ incidenciaId: nueva.id_incidencia, actorUid: beneficiarioUid, actorRol: 'beneficiario', tipo: 'creada', estadoNuevo: 'abierta', diff: { prioridad: prioridadAuto } })
    } catch (_) { /* ignore historial failure */ }

    return res.status(201).json({ success: true, data: nueva })
  } catch (e) {
    console.error('POST /api/beneficiario/incidencias error:', e)
    const msg = e?.message || 'Error al crear la incidencia'
    return res.status(500).json({ success: false, message: msg })
  }
})

// Subir fotos para una incidencia del beneficiario (multipart/form-data, field: files[])
app.post('/api/beneficiario/incidencias/:id/media', verifyToken, authorizeRole(['beneficiario','administrador']), upload.array('files', 5), async (req, res) => {
  try {
    const beneficiarioUid = req.user?.sub
    const incidenciaId = parseInt(req.params.id, 10)
    if (!Number.isFinite(incidenciaId)) return res.status(400).json({ success: false, message: 'ID inválido' })

    // Validate ownership
    const { data: viv, error: ev } = await supabase
      .from('viviendas')
      .select('id_vivienda')
      .eq('beneficiario_uid', beneficiarioUid)
      .maybeSingle()
    if (ev) throw ev
    if (!viv) return res.status(404).json({ success: false, message: 'No tienes una vivienda asignada' })

    const { data: inc, error: einc } = await supabase
      .from('incidencias')
      .select('id_incidencia, id_vivienda')
      .eq('id_incidencia', incidenciaId)
      .maybeSingle()
    if (einc) throw einc
    if (!inc || inc.id_vivienda !== viv.id_vivienda) {
      return res.status(404).json({ success: false, message: 'Incidencia no encontrada' })
    }

    const files = req.files || []
    if (!files.length) return res.status(400).json({ success: false, message: 'No se adjuntaron archivos' })

    const uploaded = []
    for (const f of files) {
      const ext = (f.originalname || '').split('.').pop()?.toLowerCase() || 'jpg'
      const key = `${incidenciaId}/${randomUUID()}.${ext}`
      const { data: up, error: eup } = await supabase
        .storage
        .from('incidencias')
        .upload(key, f.buffer, { contentType: f.mimetype || 'application/octet-stream', upsert: false })
      if (eup) throw eup

      // Insert into schema variant A (entidad/url) if exists, else variant B (incidencia_id/path)
      let inserted = null
      let variantAError = null
      try {
        const pub = supabase.storage.from('incidencias').getPublicUrl(up.path)
        const url = pub?.data?.publicUrl || pub?.publicUrl || null
        const meta = { mimetype: f.mimetype, size: f.size, name: f.originalname }
        const rA = await supabase
          .from('media')
          .insert([{ entidad: 'incidencia', entidad_id: incidenciaId, url, metadata_json: meta }])
          .select('id, url, metadata_json, created_at')
          .single()
        if (rA.error) throw rA.error
        inserted = rA.data
      } catch (eA) {
        variantAError = eA
      }
      if (!inserted) {
        try {
          const rB = await supabase
            .from('media')
            .insert([{ incidencia_id: incidenciaId, path: up.path, mime: f.mimetype, bytes: f.size, uploaded_by: beneficiarioUid }])
            .select('id, incidencia_id, path, mime, bytes, created_at')
            .single()
          if (rB.error) throw rB.error
          inserted = rB.data
        } catch (eB) {
          console.error('Upload failed variant A and B:', variantAError?.message, eB?.message)
          throw eB
        }
      }
      uploaded.push(inserted)
    }

    // Historial: media agregada
    if (uploaded.length) {
      try { await logIncidenciaEvent({ incidenciaId: incidenciaId, actorUid: beneficiarioUid, actorRol: 'beneficiario', tipo: 'media_agregada', metadata: { count: uploaded.length } }) } catch (_) {}
    }
    return res.status(201).json({ success: true, data: uploaded })
  } catch (e) {
    console.error('POST /api/beneficiario/incidencias/:id/media error:', e)
    return res.status(500).json({ success: false, message: 'Error al subir archivos' })
  }
})

// Listar fotos de una incidencia del beneficiario
app.get('/api/beneficiario/incidencias/:id/media', verifyToken, authorizeRole(['beneficiario','administrador']), async (req, res) => {
  try {
    const beneficiarioUid = req.user?.sub
    const incidenciaId = parseInt(req.params.id, 10)
    if (!Number.isFinite(incidenciaId)) return res.status(400).json({ success: false, message: 'ID inválido' })

    const { data: viv, error: ev } = await supabase
      .from('viviendas')
      .select('id_vivienda')
      .eq('beneficiario_uid', beneficiarioUid)
      .maybeSingle()
    if (ev) throw ev
    if (!viv) return res.status(404).json({ success: false, message: 'No tienes una vivienda asignada' })

    const { data: inc, error: einc } = await supabase
      .from('incidencias')
      .select('id_incidencia, id_vivienda')
      .eq('id_incidencia', incidenciaId)
      .maybeSingle()
    if (einc) throw einc
    if (!inc || inc.id_vivienda !== viv.id_vivienda) {
      return res.status(404).json({ success: false, message: 'Incidencia no encontrada' })
    }

    // Try variant A
    let rows = null
    let variantAErr = null
    try {
      const rA = await supabase
        .from('media')
        .select('id, entidad, entidad_id, url, metadata_json, created_at')
        .eq('entidad', 'incidencia')
        .eq('entidad_id', incidenciaId)
        .order('id', { ascending: false })
      if (rA.error) throw rA.error
      rows = rA.data
    } catch (eA) {
      variantAErr = eA
    }
    if (!rows) {
      try {
        const rB = await supabase
          .from('media')
          .select('id, incidencia_id, path, mime, bytes, created_at')
          .eq('incidencia_id', incidenciaId)
          .order('id', { ascending: false })
        if (rB.error) throw rB.error
        rows = (rB.data || []).map(m => {
          let url = null
          if (m.path) {
            try { const pub = supabase.storage.from('incidencias').getPublicUrl(m.path); url = pub?.data?.publicUrl || pub?.publicUrl || null } catch (_) {}
          }
          return { id: m.id, entidad: 'incidencia', entidad_id: m.incidencia_id, url, metadata_json: { path: m.path, mime: m.mime, bytes: m.bytes }, created_at: m.created_at }
        })
      } catch (eB) {
        console.warn('GET media variants failed:', variantAErr?.message, eB?.message)
      }
    }
    return res.json({ success: true, data: rows || [] })
  } catch (e) {
    console.error('GET /api/beneficiario/incidencias/:id/media error:', e)
    return res.status(500).json({ success: false, message: 'Error al listar archivos' })
  }
})

// ------------------------------------------------------------
// Endpoint técnico: marcar una recepción como revisada (transición enviada -> revisada)
// Permite que el beneficiario luego pueda crear una nueva recepción (borrador) porque deja de estar activa.
app.post('/api/tecnico/recepcion/:id/revisar', verifyToken, authorizeRole(['tecnico','administrador']), async (req, res) => {
  try {
    const recepcionId = parseInt(req.params.id, 10)
    if (!Number.isFinite(recepcionId)) {
      return res.status(400).json({ success: false, message: 'ID inválido' })
    }

    // Obtener recepción
    const { data: rec, error: er } = await supabase
      .from('vivienda_recepcion')
      .select('id, estado')
      .eq('id', recepcionId)
      .maybeSingle()
    if (er) throw er
    if (!rec) return res.status(404).json({ success: false, message: 'Recepción no encontrada' })
    if (rec.estado !== 'enviada') {
      return res.status(409).json({ success: false, message: 'Solo se pueden revisar recepciones en estado enviada' })
    }

    const { data: updated, error: eupd } = await supabase
      .from('vivienda_recepcion')
      .update({ estado: 'revisada', fecha_revisada: new Date().toISOString() })
      .eq('id', recepcionId)
      .select('id, estado, fecha_revisada')
      .single()
    if (eupd) throw eupd

    return res.json({ success: true, data: updated })
  } catch (e) {
    console.error('POST /api/tecnico/recepcion/:id/revisar error:', e)
    return res.status(500).json({ success: false, message: 'Error al marcar revisada' })
  }
})

export { app, normalizeRole, isStrongPassword, loginLimiter }

// ------------------------------------------------------------
// Endpoints técnicos y de historial (añadidos al final para mantener exports arriba)
// Asignar técnico
app.post('/api/tecnico/incidencias/:id/asignar', verifyToken, authorizeRole(['tecnico','administrador']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: 'ID inválido' })
    const tecnicoUid = req.user?.sub
    const { data: inc, error: ei } = await supabase
      .from('incidencias')
      .select('id_incidencia, id_usuario_tecnico, estado')
      .eq('id_incidencia', id)
      .maybeSingle()
    if (ei) throw ei
    if (!inc) return res.status(404).json({ success: false, message: 'Incidencia no encontrada' })
    if (inc.id_usuario_tecnico === tecnicoUid) return res.json({ success: true, message: 'Ya asignada a este técnico' })
    const { error: uu } = await supabase
      .from('incidencias')
      .update({ id_usuario_tecnico: tecnicoUid, fecha_asignada: new Date().toISOString() })
      .eq('id_incidencia', id)
    if (uu) throw uu
    await logIncidenciaEvent({ incidenciaId: id, actorUid: tecnicoUid, actorRol: 'tecnico', tipo: 'asignacion', diff: { id_usuario_tecnico: tecnicoUid } })
    return res.json({ success: true })
  } catch (e) {
    console.error('POST /api/tecnico/incidencias/:id/asignar error:', e)
    return res.status(500).json({ success: false, message: 'Error asignando' })
  }
})

// Cambiar estado
app.post('/api/tecnico/incidencias/:id/estado', verifyToken, authorizeRole(['tecnico','administrador']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: 'ID inválido' })
    const { nuevo_estado, comentario } = req.body || {}
    const allowed = ['abierta','en_proceso','en_espera','resuelta','cerrada','descartada']
    if (!allowed.includes(nuevo_estado)) return res.status(400).json({ success: false, message: 'Estado no permitido' })
    const { data: inc, error: ei } = await supabase
      .from('incidencias')
      .select('id_incidencia, estado')
      .eq('id_incidencia', id)
      .maybeSingle()
    if (ei) throw ei
    if (!inc) return res.status(404).json({ success: false, message: 'Incidencia no encontrada' })
    if (inc.estado === nuevo_estado) return res.json({ success: true, message: 'Sin cambios' })
    const updateCols = { estado: nuevo_estado }
    const now = new Date().toISOString()
    if (nuevo_estado === 'en_proceso') updateCols.fecha_en_proceso = now
    if (nuevo_estado === 'resuelta') updateCols.fecha_resuelta = now
    if (nuevo_estado === 'cerrada') updateCols.fecha_cerrada = now
    const { error: ue } = await supabase
      .from('incidencias')
      .update(updateCols)
      .eq('id_incidencia', id)
    if (ue) throw ue
    await logIncidenciaEvent({ incidenciaId: id, actorUid: req.user?.sub, actorRol: 'tecnico', tipo: 'estado_cambiado', estadoAnterior: inc.estado, estadoNuevo: nuevo_estado, comentario: comentario || null })
    return res.json({ success: true })
  } catch (e) {
    console.error('POST /api/tecnico/incidencias/:id/estado error:', e)
    return res.status(500).json({ success: false, message: 'Error cambiando estado' })
  }
})

// Listado global de incidencias (técnico) con filtros y paginación
// Query params: limit, offset, estado, categoria, prioridad, search, asignacion (mine|unassigned|all), includeMedia=1
app.get('/api/tecnico/incidencias', verifyToken, authorizeRole(['tecnico','administrador']), async (req, res) => {
  try {
    const tecnicoUid = req.user?.sub
    const limitReq = parseInt(req.query.limit, 10)
    const limit = Number.isFinite(limitReq) ? Math.min(Math.max(limitReq, 1), 100) : 50
    const offsetReq = parseInt(req.query.offset, 10)
    const offset = Number.isFinite(offsetReq) && offsetReq >= 0 ? offsetReq : 0
    const includeMedia = String(req.query.includeMedia || '').toLowerCase() === '1'
    const estadoFilter = (req.query.estado || '').toString().trim()
    const categoriaFilter = (req.query.categoria || '').toString().trim()
    const prioridadFilter = (req.query.prioridad || '').toString().trim().toLowerCase()
    const searchRaw = (req.query.search || '').toString().trim()
    const search = searchRaw.length >= 2 ? searchRaw : ''
    const asignacion = (req.query.asignacion || 'all').toString()

    let baseCount = supabase
      .from('incidencias')
      .select('id_incidencia', { count: 'exact', head: true })
    let baseData = supabase
      .from('incidencias')
      .select('id_incidencia, id_vivienda, descripcion, estado, categoria, prioridad, fecha_reporte, id_usuario_tecnico')

    if (estadoFilter) { baseCount = baseCount.eq('estado', estadoFilter); baseData = baseData.eq('estado', estadoFilter) }
    if (categoriaFilter) { baseCount = baseCount.eq('categoria', categoriaFilter); baseData = baseData.eq('categoria', categoriaFilter) }
    if (prioridadFilter) { baseCount = baseCount.eq('prioridad', prioridadFilter); baseData = baseData.eq('prioridad', prioridadFilter) }
    if (search) { baseCount = baseCount.ilike('descripcion', `%${search}%`); baseData = baseData.ilike('descripcion', `%${search}%`) }
    if (asignacion === 'mine') { baseCount = baseCount.eq('id_usuario_tecnico', tecnicoUid); baseData = baseData.eq('id_usuario_tecnico', tecnicoUid) }
    else if (asignacion === 'unassigned') { baseCount = baseCount.is('id_usuario_tecnico', null); baseData = baseData.is('id_usuario_tecnico', null) }

    const { count: totalCount, error: countErr } = await baseCount
    if (countErr) throw countErr
    const { data: incs, error: eList } = await baseData
      .order('prioridad', { ascending: true }) // baja<media<alta? si queremos priorizar al revés lo cambiamos
      .order('id_incidencia', { ascending: false })
      .range(offset, offset + limit - 1)
    if (eList) throw eList

    let enriched = incs || []
    if (includeMedia && enriched.length) {
      const ids = enriched.map(i => i.id_incidencia)
      let mediaRows = null
      let mediaError = null
      let schemaVariant = 'A'
      try {
        const rA = await supabase
          .from('media')
          .select('id, entidad, entidad_id, url, metadata_json, created_at')
          .in('entidad_id', ids)
          .eq('entidad', 'incidencia')
        if (rA.error) throw rA.error
        mediaRows = rA.data
      } catch (eA) {
        mediaError = eA
        schemaVariant = 'B'
      }
      if (schemaVariant === 'B') {
        try {
          const rB = await supabase
            .from('media')
            .select('id, incidencia_id, path, mime, bytes, created_at')
            .in('incidencia_id', ids)
          if (rB.error) throw rB.error
          mediaRows = (rB.data || []).map(m => {
            let url = null
            if (m.path) {
              try { const pub = supabase.storage.from('incidencias').getPublicUrl(m.path); url = pub?.data?.publicUrl || pub?.publicUrl || null } catch(_) {}
            }
            return { id: m.id, entidad: 'incidencia', entidad_id: m.incidencia_id, url, metadata_json: { mime: m.mime, bytes: m.bytes, path: m.path }, created_at: m.created_at }
          })
        } catch (eB) {
          console.warn('media retrieval tecnico failed both variants:', mediaError?.message, eB?.message)
        }
      }
      if (Array.isArray(mediaRows)) {
        const bucketed = {}
        for (const m of mediaRows) { if (!bucketed[m.entidad_id]) bucketed[m.entidad_id] = []; bucketed[m.entidad_id].push(m) }
        enriched = enriched.map(i => ({ ...i, media: bucketed[i.id_incidencia] || [] }))
      }
    }

    return res.json({ success: true, data: enriched, meta: { limit, offset, total: totalCount || 0, hasMore: (offset + enriched.length) < (totalCount || 0) } })
  } catch (e) {
    console.error('GET /api/tecnico/incidencias error:', e)
    return res.status(500).json({ success: false, message: 'Error al listar incidencias' })
  }
})

// Detalle de incidencia para técnico (incluye media básica). Para historial usar endpoint ya existente.
app.get('/api/tecnico/incidencias/:id', verifyToken, authorizeRole(['tecnico','administrador']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: 'ID inválido' })
    const { data: inc, error: ei } = await supabase
      .from('incidencias')
      .select('id_incidencia, id_vivienda, descripcion, estado, categoria, prioridad, prioridad_origen, prioridad_final, fecha_reporte, id_usuario_tecnico')
      .eq('id_incidencia', id)
      .maybeSingle()
    if (ei) throw ei
    if (!inc) return res.status(404).json({ success: false, message: 'No encontrada' })

    // Media (variant detection)
    let mediaRows = []
    try {
      const rA = await supabase
        .from('media')
        .select('id, entidad, entidad_id, url, metadata_json, created_at')
        .eq('entidad', 'incidencia')
        .eq('entidad_id', id)
      if (rA.error) throw rA.error
      mediaRows = rA.data || []
    } catch (eA) {
      try {
        const rB = await supabase
          .from('media')
          .select('id, incidencia_id, path, mime, bytes, created_at')
          .eq('incidencia_id', id)
        if (rB.error) throw rB.error
        mediaRows = (rB.data || []).map(m => {
          let url = null
          if (m.path) { try { const pub = supabase.storage.from('incidencias').getPublicUrl(m.path); url = pub?.data?.publicUrl || pub?.publicUrl || null } catch(_) {} }
          return { id: m.id, entidad: 'incidencia', entidad_id: id, url, metadata_json: { mime: m.mime, bytes: m.bytes, path: m.path }, created_at: m.created_at }
        })
      } catch (eB) {
        console.warn('Media detail variants failed', eA?.message, eB?.message)
      }
    }

    return res.json({ success: true, data: { ...inc, media: mediaRows } })
  } catch (e) {
    console.error('GET /api/tecnico/incidencias/:id error:', e)
    return res.status(500).json({ success: false, message: 'Error obteniendo detalle' })
  }
})

// Obtener historial (beneficiario dueño o técnico/admin)
app.get('/api/incidencias/:id/historial', verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: 'ID inválido' })
    const userRole = normalizeRole(req.user?.role)
    if (userRole === 'beneficiario') {
      // Verificar que la incidencia pertenece a su vivienda
      const { data: inc, error: eI } = await supabase
        .from('incidencias')
        .select('id_incidencia, id_vivienda')
        .eq('id_incidencia', id)
        .maybeSingle()
      if (eI) throw eI
      if (!inc) return res.status(404).json({ success: false, message: 'No encontrada' })
      const { data: viv, error: eV } = await supabase
        .from('viviendas')
        .select('id_vivienda, beneficiario_uid')
        .eq('id_vivienda', inc.id_vivienda)
        .maybeSingle()
      if (eV) throw eV
      if (!viv || viv.beneficiario_uid !== req.user?.sub) return res.status(403).json({ success: false, message: 'No autorizado' })
    }
    const { data: hist, error: eh } = await supabase
      .from('incidencia_historial')
      .select('id, tipo_evento, actor_uid, actor_rol, estado_anterior, estado_nuevo, datos_diff, comentario, metadata, created_at')
      .eq('incidencia_id', id)
      .order('created_at', { ascending: false })
      .limit(200)
    if (eh) throw eh
    return res.json({ success: true, data: hist || [] })
  } catch (e) {
    console.error('GET /api/incidencias/:id/historial error:', e)
    return res.status(500).json({ success: false, message: 'Error obteniendo historial' })
  }
})

// ------------------------------------------------------------
// POSVENTA – Fase 1 (Beneficiario) MVP
// Supuestos: vivienda.estado = 'entregada' habilita el formulario (si no, permitimos mientras exista vivienda - TODO revisar estados reales)

// GET formulario posventa activo (borrador o enviada) + items
app.get('/api/beneficiario/posventa/form', verifyToken, authorizeRole(['beneficiario','administrador']), async (req, res) => {
  try {
    const beneficiarioUid = req.user?.sub
    const { data: viv, error: ev } = await supabase
      .from('viviendas')
      .select('id_vivienda, estado')
      .eq('beneficiario_uid', beneficiarioUid)
      .maybeSingle()
    if (ev) throw ev
    if (!viv) return res.status(404).json({ success: false, message: 'No tienes una vivienda asignada' })

    const { data: forms, error: ef } = await supabase
      .from('vivienda_postventa_form')
      .select('id, estado, fecha_creada, fecha_enviada, items_no_ok_count, observaciones_count, template_version')
      .eq('id_vivienda', viv.id_vivienda)
      .in('estado', ['borrador','enviada'])
      .order('id', { ascending: false })
      .limit(1)
    if (ef) throw ef
    const form = Array.isArray(forms) && forms.length ? forms[0] : null
    if (!form) return res.json({ success: true, data: null })

    const { data: items, error: ei } = await supabase
      .from('vivienda_postventa_item')
      .select('id, categoria, item, ok, severidad, comentario, fotos_json, crear_incidencia, incidencia_id, orden')
      .eq('form_id', form.id)
      .order('categoria', { ascending: true })
      .order('orden', { ascending: true, nullsFirst: true })
      .order('id', { ascending: true })
    if (ei) throw ei

    return res.json({ success: true, data: { form, items: items || [] } })
  } catch (e) {
    console.error('GET /api/beneficiario/posventa/form error:', e)
    return res.status(500).json({ success: false, message: 'Error al obtener formulario posventa' })
  }
})

// Crear nuevo formulario posventa en borrador (si no hay uno activo)
app.post('/api/beneficiario/posventa/form', verifyToken, authorizeRole(['beneficiario','administrador']), async (req, res) => {
  try {
    const beneficiarioUid = req.user?.sub
    const { data: viv, error: ev } = await supabase
      .from('viviendas')
      .select('id_vivienda, estado, tipo_vivienda')
      .eq('beneficiario_uid', beneficiarioUid)
      .maybeSingle()
    if (ev) throw ev
    if (!viv) return res.status(404).json({ success: false, message: 'No tienes una vivienda asignada' })

    // Política mínima: permitir si la vivienda existe. (TODO: limitar a estado='entregada' si corresponde)
    const { data: activos, error: ea } = await supabase
      .from('vivienda_postventa_form')
      .select('id, estado')
      .eq('id_vivienda', viv.id_vivienda)
      .in('estado', ['borrador','enviada'])
      .limit(1)
    if (ea) throw ea
    if (Array.isArray(activos) && activos.length) {
      const activo = activos[0]
      // Si es borrador y sin items, intentar repoblar
      if (activo.estado === 'borrador') {
        const { count: itemCount, error: eCnt } = await supabase
          .from('vivienda_postventa_item')
          .select('id', { count: 'exact', head: true })
          .eq('form_id', activo.id)
        if (eCnt) throw eCnt
        if (!itemCount) {
          // Resolver template y repoblar
            let templateId = null
            if (viv.tipo_vivienda) {
              const { data: tEsp, error: eT } = await supabase
                .from('postventa_template')
                .select('id')
                .eq('tipo_vivienda', viv.tipo_vivienda)
                .eq('activo', true)
                .order('version', { ascending: false })
                .limit(1)
              if (eT) throw eT
              if (Array.isArray(tEsp) && tEsp.length) templateId = tEsp[0].id
            }
            if (!templateId) {
              const { data: tGen, error: eG } = await supabase
                .from('postventa_template')
                .select('id')
                .is('tipo_vivienda', null)
                .eq('activo', true)
                .order('version', { ascending: false })
                .limit(1)
              if (eG) throw eG
              if (Array.isArray(tGen) && tGen.length) templateId = tGen[0].id
            }
            if (templateId) {
              const { data: tItems, error: eTi } = await supabase
                .from('postventa_template_item')
                .select('categoria, item, orden, severidad_sugerida')
                .eq('template_id', templateId)
                .order('orden', { ascending: true })
              if (eTi) throw eTi
              if (Array.isArray(tItems) && tItems.length) {
                const rows = tItems.map(it => ({
                  form_id: activo.id,
                  categoria: it.categoria,
                  item: it.item,
                  ok: true,
                  severidad: null,
                  comentario: null,
                  fotos_json: [],
                  crear_incidencia: true,
                  orden: it.orden ?? null
                }))
                const { error: eIns } = await supabase
                  .from('vivienda_postventa_item')
                  .insert(rows)
                if (eIns) console.error('Repopulate items error', eIns)
              }
            }
        }
      }
      return res.json({ success: true, data: activo, message: 'Ya existe un formulario activo' })
    }
    // Elegir template: primero por tipo_vivienda activo, luego genérico activo
    let templateId = null
    let itemsSeeded = 0
    if (templateId) {
      const { data: tEsp, error: eT } = await supabase
        .from('postventa_template')
        .select('id')
        .eq('tipo_vivienda', viv.tipo_vivienda)
        .eq('activo', true)
        .order('version', { ascending: false })
        .limit(1)
      if (eT) throw eT
      if (Array.isArray(tEsp) && tEsp.length) templateId = tEsp[0].id
    }
    if (!templateId) {
      const { data: tGen, error: eG } = await supabase
        .from('postventa_template')
        .select('id')
        .is('tipo_vivienda', null)
        .eq('activo', true)
        .order('version', { ascending: false })
        .limit(1)
      if (eG) throw eG
      if (Array.isArray(tGen) && tGen.length) templateId = tGen[0].id
    }

  // Crear form
  const insertForm = { id_vivienda: viv.id_vivienda, beneficiario_uid: beneficiarioUid, estado: 'borrador', template_version: 1 }
    const { data: creado, error: ec } = await supabase
      .from('vivienda_postventa_form')
      .insert([insertForm])
      .select('id, estado, fecha_creada, template_version')
      .single()
          if (!cnt) console.warn('Advertencia: no se encontraron items insertados para el formulario posventa', creado.id)
          itemsSeeded = cnt || 0

    // Poblar items desde template
    if (templateId) {
      const { data: tItems, error: eTi } = await supabase
        .from('postventa_template_item')
    if (!itemsSeeded) {
      return res.status(409).json({ success: false, message: 'No se poblaron ítems: revisa templates (genérico o por tipo_vivienda) y vuelve a intentar.' , data: { form: creado } })
    }
    return res.status(201).json({ success: true, data: { ...creado, items_seeded: itemsSeeded } })
        .order('orden', { ascending: true })
      if (eTi) throw eTi
      if (Array.isArray(tItems) && tItems.length) {
        const rows = tItems.map(it => ({
          form_id: creado.id,
          categoria: it.categoria,
          item: it.item,
          ok: true,
          severidad: null,
          comentario: null,
          fotos_json: [], // JSONB array
          crear_incidencia: true,
          orden: it.orden ?? null
        }))
        const { error: eIns } = await supabase
          .from('vivienda_postventa_item')
          .insert(rows)
        if (eIns) {
          console.error('No se pudieron insertar items template posventa', eIns)
        } else {
          // Verificación rápida de que se insertaron
          const { count: cnt, error: eCount } = await supabase
            .from('vivienda_postventa_item')
            .select('id', { count: 'exact', head: true })
            .eq('form_id', creado.id)
          if (eCount) console.warn('Error contando items posventa recién insertados', eCount.message)
          if (!cnt) console.warn('Advertencia: no se encontraron items insertados para el formulario posventa', creado.id)
        }
      }
    } else {
      console.warn('Formulario posventa creado sin templateId (no se poblaron items). Verificar templates activos.')
    }

    return res.status(201).json({ success: true, data: creado })
  } catch (e) {
    console.error('POST /api/beneficiario/posventa/form error:', e)
    return res.status(500).json({ success: false, message: 'Error al crear formulario posventa' })
  }
})

// Guardar items (reemplaza todos) – sólo en borrador
// Actualizar sólo estado (ok, severidad, comentario, crear_incidencia) de items existentes (NO agregar/quitar)
app.post('/api/beneficiario/posventa/form/items', verifyToken, authorizeRole(['beneficiario','administrador']), async (req, res) => {
  try {
    const beneficiarioUid = req.user?.sub
    const updates = Array.isArray(req.body?.items) ? req.body.items : null
    if (!updates) return res.status(400).json({ success: false, message: 'items requerido' })
    const { data: viv, error: ev } = await supabase
      .from('viviendas')
      .select('id_vivienda')
      .eq('beneficiario_uid', beneficiarioUid)
      .maybeSingle()
    if (ev) throw ev
    if (!viv) return res.status(404).json({ success: false, message: 'No tienes una vivienda asignada' })
    const { data: formRows, error: ef } = await supabase
      .from('vivienda_postventa_form')
      .select('id, estado')
      .eq('id_vivienda', viv.id_vivienda)
      .eq('estado', 'borrador')
      .limit(1)
    if (ef) throw ef
    const form = Array.isArray(formRows) && formRows.length ? formRows[0] : null
    if (!form) return res.status(409).json({ success: false, message: 'No hay formulario en borrador' })

    // Obtener ids existentes para validar
    const { data: existingItems, error: exErr } = await supabase
      .from('vivienda_postventa_item')
      .select('id')
      .eq('form_id', form.id)
    if (exErr) throw exErr
    const existingIds = new Set((existingItems || []).map(i => i.id))

    const batched = []
    for (const u of updates) {
      if (!u || !existingIds.has(u.id)) continue // ignorar items no válidos
      const row = {
        ok: typeof u.ok === 'boolean' ? u.ok : undefined,
        severidad: u.ok ? null : (u.severidad || null),
        comentario: u.comentario || null,
        crear_incidencia: u.ok ? false : (u.crear_incidencia === false ? false : true)
      }
      // Limpieza de undefined
      Object.keys(row).forEach(k => { if (row[k] === undefined) delete row[k] })
      batched.push({ id: u.id, data: row })
    }

    for (const b of batched) {
      const { error: ue } = await supabase
        .from('vivienda_postventa_item')
        .update(b.data)
        .eq('id', b.id)
      if (ue) throw ue
    }
    return res.json({ success: true, updated: batched.length })
  } catch (e) {
    console.error('POST /api/beneficiario/posventa/form/items error:', e)
    return res.status(500).json({ success: false, message: 'Error al actualizar items posventa' })
  }
})

// Subir foto para item posventa específico (similar a incidencias) field: file
app.post('/api/beneficiario/posventa/form/items/:id/foto', verifyToken, authorizeRole(['beneficiario','administrador']), upload.single('file'), async (req, res) => {
  try {
    const beneficiarioUid = req.user?.sub
    const itemId = parseInt(req.params.id, 10)
    if (!Number.isFinite(itemId)) return res.status(400).json({ success: false, message: 'ID inválido' })
    const { data: item, error: eIt } = await supabase
      .from('vivienda_postventa_item')
      .select('id, form_id, fotos_json')
      .eq('id', itemId)
      .maybeSingle()
    if (eIt) throw eIt
    if (!item) return res.status(404).json({ success: false, message: 'Item no encontrado' })
    const { data: form, error: eFo } = await supabase
      .from('vivienda_postventa_form')
      .select('id, id_vivienda, estado')
      .eq('id', item.form_id)
      .maybeSingle()
    if (eFo) throw eFo
    if (!form || form.estado !== 'borrador') return res.status(409).json({ success: false, message: 'No editable' })
    const { data: viv, error: eV } = await supabase
      .from('viviendas')
      .select('id_vivienda, beneficiario_uid')
      .eq('id_vivienda', form.id_vivienda)
      .maybeSingle()
    if (eV) throw eV
    if (!viv || viv.beneficiario_uid !== beneficiarioUid) return res.status(403).json({ success: false, message: 'No autorizado' })
    const f = req.file
    if (!f) return res.status(400).json({ success: false, message: 'Archivo requerido' })
    const ext = (f.originalname || '').split('.').pop()?.toLowerCase() || 'jpg'
    const key = `posventa/${form.id}/${itemId}/${randomUUID()}.${ext}`
    const { data: up, error: eup } = await supabase
      .storage.from('incidencias') // reutilizamos bucket
      .upload(key, f.buffer, { contentType: f.mimetype || 'application/octet-stream', upsert: false })
    if (eup) throw eup
    let fotos = []
    try { fotos = Array.isArray(item.fotos_json) ? item.fotos_json : JSON.parse(item.fotos_json || '[]') } catch(_){}
    fotos.push(key)
    const { error: uItem } = await supabase
      .from('vivienda_postventa_item')
      .update({ fotos_json: fotos })
      .eq('id', itemId)
    if (uItem) throw uItem
    const pub = supabase.storage.from('incidencias').getPublicUrl(key)
    return res.json({ success: true, path: key, url: pub?.data?.publicUrl || null })
  } catch (e) {
    console.error('POST /api/beneficiario/posventa/form/items/:id/foto error:', e)
    return res.status(500).json({ success: false, message: 'Error al subir foto item posventa' })
  }
})

// Enviar formulario (cierra borrador)
app.post('/api/beneficiario/posventa/form/enviar', verifyToken, authorizeRole(['beneficiario','administrador']), async (req, res) => {
  try {
    const beneficiarioUid = req.user?.sub
    const { data: viv, error: ev } = await supabase
      .from('viviendas')
      .select('id_vivienda')
      .eq('beneficiario_uid', beneficiarioUid)
      .maybeSingle()
    if (ev) throw ev
    if (!viv) return res.status(404).json({ success: false, message: 'No tienes una vivienda asignada' })

    const { data: forms, error: ef } = await supabase
      .from('vivienda_postventa_form')
      .select('id, estado')
      .eq('id_vivienda', viv.id_vivienda)
      .eq('estado', 'borrador')
      .order('id', { ascending: false })
      .limit(1)
    if (ef) throw ef
    const form = Array.isArray(forms) && forms.length ? forms[0] : null
    if (!form) return res.status(409).json({ success: false, message: 'No hay formulario en borrador' })

    // Calcular conteos
    const { count: noOkCount, error: eNo } = await supabase
      .from('vivienda_postventa_item')
      .select('id', { count: 'exact', head: true })
      .eq('form_id', form.id)
      .eq('ok', false)
    if (eNo) throw eNo

    const { count: obsCount, error: eObs } = await supabase
      .from('vivienda_postventa_item')
      .select('id', { count: 'exact', head: true })
      .eq('form_id', form.id)
      .eq('ok', false)
      .eq('severidad', 'menor')
    if (eObs) throw eObs

    const { data: updated, error: eupd } = await supabase
      .from('vivienda_postventa_form')
      .update({ estado: 'enviada', fecha_enviada: new Date().toISOString(), items_no_ok_count: noOkCount || 0, observaciones_count: obsCount || 0 })
      .eq('id', form.id)
      .select('id, estado, fecha_enviada, items_no_ok_count, observaciones_count')
      .single()
    if (eupd) throw eupd

    // Generar PDF automáticamente en segundo plano
    try {
      console.log(`🔄 Generando PDF automáticamente para formulario ${form.id}...`)
      const { buffer, filename } = await posventaPDFService.generarPDF(form.id)
      await posventaPDFService.guardarPDFEnSupabase(form.id, buffer, filename)
      console.log(`✅ PDF generado automáticamente: ${filename}`)
      updated.pdf_generado = true
      updated.pdf_filename = filename
    } catch (pdfError) {
      console.error('⚠️  Error generando PDF automático:', pdfError.message)
      updated.pdf_generado = false
      updated.pdf_error = pdfError.message
    }

    return res.json({ success: true, data: updated })
  } catch (e) {
    console.error('POST /api/beneficiario/posventa/form/enviar error:', e)
    return res.status(500).json({ success: false, message: 'Error al enviar formulario posventa' })
  }
})

// ------------------------------------------------------------
// ADMIN – Gestión de Templates Posventa (creación básica)
// Endpoints sencillos para permitir que un administrador cree y administre templates sin tocar SQL directo.

// Listar templates (opcionalmente filtrar por tipo_vivienda o activo)
app.get('/api/admin/posventa/templates', verifyToken, authorizeRole(['administrador']), async (req, res) => {
  try {
    const { tipo_vivienda, activo } = req.query
    let q = supabase
      .from('postventa_template')
      .select('id, nombre, tipo_vivienda, version, activo, created_at')
      .order('id', { ascending: false })
    if (tipo_vivienda === 'null') q = q.is('tipo_vivienda', null)
    else if (tipo_vivienda) q = q.eq('tipo_vivienda', tipo_vivienda)
    if (activo === 'true') q = q.eq('activo', true)
    else if (activo === 'false') q = q.eq('activo', false)
    const { data, error } = await q
    if (error) throw error
    // Adjuntar items de cada template si se pide ?includeItems=1
    if (req.query.includeItems === '1' && Array.isArray(data) && data.length) {
      const ids = data.map(t => t.id)
      const { data: items, error: eItems } = await supabase
        .from('postventa_template_item')
        .select('id, template_id, categoria, item, orden, severidad_sugerida')
        .in('template_id', ids)
        .order('orden', { ascending: true })
      if (eItems) throw eItems
      const byT = items?.reduce((m,it)=>{ (m[it.template_id]=m[it.template_id]||[]).push(it); return m }, {}) || {}
      data.forEach(t => { t.items = byT[t.id] || [] })
    }
    return res.json({ success: true, data })
  } catch (e) {
    console.error('GET /api/admin/posventa/templates error:', e)
    return res.status(500).json({ success: false, message: 'Error listando templates posventa' })
  }
})

// Crear nuevo template con items
// body: { nombre, tipo_vivienda (opcional/null), version (opcional), items: [{categoria,item,orden,severidad_sugerida}] }
app.post('/api/admin/posventa/templates', verifyToken, authorizeRole(['administrador']), async (req, res) => {
  try {
    const { nombre, tipo_vivienda = null, version = 1, items } = req.body || {}
    if (!nombre || typeof nombre !== 'string') return res.status(400).json({ success: false, message: 'nombre requerido' })
    const insertT = { nombre, version: Number(version) || 1, activo: true }
    if (tipo_vivienda) insertT.tipo_vivienda = tipo_vivienda
    const { data: created, error: eCreate } = await supabase
      .from('postventa_template')
      .insert([insertT])
      .select('id, nombre, tipo_vivienda, version, activo')
      .single()
    if (eCreate) throw eCreate
    let insertedItems = 0
    if (Array.isArray(items) && items.length) {
      const norm = items.filter(it => it && it.categoria && it.item).map((it, idx) => ({
        template_id: created.id,
        categoria: it.categoria,
        item: it.item,
        orden: typeof it.orden === 'number' ? it.orden : (it.orden ? parseInt(it.orden,10) : (idx+1)),
        severidad_sugerida: it.severidad_sugerida || null
      }))
      if (norm.length) {
        const { error: eIns } = await supabase.from('postventa_template_item').insert(norm)
        if (eIns) throw eIns
        insertedItems = norm.length
      }
    }
    return res.status(201).json({ success: true, data: { ...created, items_inserted: insertedItems } })
  } catch (e) {
    console.error('POST /api/admin/posventa/templates error:', e)
    return res.status(500).json({ success: false, message: 'Error creando template posventa' })
  }
})

// Activar / Desactivar template
app.post('/api/admin/posventa/templates/:id/estado', verifyToken, authorizeRole(['administrador']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: 'ID inválido' })
    const { activo } = req.body || {}
    if (typeof activo !== 'boolean') return res.status(400).json({ success: false, message: 'activo boolean requerido' })
    const { data, error } = await supabase
      .from('postventa_template')
      .update({ activo })
      .eq('id', id)
      .select('id, nombre, tipo_vivienda, version, activo')
      .single()
    if (error) throw error
    return res.json({ success: true, data })
  } catch (e) {
    console.error('POST /api/admin/posventa/templates/:id/estado error:', e)
    return res.status(500).json({ success: false, message: 'Error actualizando estado template' })
  }
})

// Clonar template a nueva versión (simple duplicado con version+1)
app.post('/api/admin/posventa/templates/:id/clonar', verifyToken, authorizeRole(['administrador']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, message: 'ID inválido' })
    const { data: tpl, error: eTpl } = await supabase
      .from('postventa_template')
      .select('id, nombre, tipo_vivienda, version, activo')
      .eq('id', id)
      .maybeSingle()
    if (eTpl) throw eTpl
    if (!tpl) return res.status(404).json({ success: false, message: 'Template no encontrado' })
    const newVersion = tpl.version + 1
    const { data: cloned, error: eClone } = await supabase
      .from('postventa_template')
      .insert([{ nombre: tpl.nombre + ' v' + newVersion, tipo_vivienda: tpl.tipo_vivienda, version: newVersion, activo: true }])
      .select('id, nombre, tipo_vivienda, version, activo')
      .single()
    if (eClone) throw eClone
    const { data: items, error: eItems } = await supabase
      .from('postventa_template_item')
      .select('categoria, item, orden, severidad_sugerida')
      .eq('template_id', tpl.id)
    if (eItems) throw eItems
    if (Array.isArray(items) && items.length) {
      const rows = items.map(it => ({ template_id: cloned.id, categoria: it.categoria, item: it.item, orden: it.orden, severidad_sugerida: it.severidad_sugerida || null }))
      const { error: eIns } = await supabase.from('postventa_template_item').insert(rows)
      if (eIns) throw eIns
    }
    return res.status(201).json({ success: true, data: cloned })
  } catch (e) {
    console.error('POST /api/admin/posventa/templates/:id/clonar error:', e)
    return res.status(500).json({ success: false, message: 'Error clonando template' })
  }
})

// Reset (borrar) formulario(s) posventa de una vivienda para que se regenere con el template actual.
// DELETE lógico via eliminación directa (cascade items). Luego, cuando el beneficiario entre, se creará de nuevo automáticamente.
// Parámetros: force=true para permitir borrar formularios ya 'enviada' (por defecto sólo borra 'borrador').
app.post('/api/admin/posventa/vivienda/:id/reset', verifyToken, authorizeRole(['administrador']), async (req, res) => {
  try {
    const viviendaId = parseInt(req.params.id, 10)
    if (!Number.isFinite(viviendaId)) return res.status(400).json({ success: false, message: 'ID vivienda inválido' })
    const force = req.body?.force === true || req.query.force === 'true'
    // Seleccionar formularios existentes
    let q = supabase
      .from('vivienda_postventa_form')
      .select('id, estado')
      .eq('id_vivienda', viviendaId)
    if (!force) {
      q = q.in('estado', ['borrador'])
    }
    const { data: forms, error: eSel } = await q
    if (eSel) throw eSel
    if (!forms || !forms.length) return res.status(404).json({ success: false, message: force ? 'No hay formularios para borrar' : 'No hay formularios en borrador para borrar' })
    const ids = forms.map(f => f.id)
    const { error: eDel } = await supabase
      .from('vivienda_postventa_form')
      .delete()
      .in('id', ids)
    if (eDel) throw eDel
    return res.json({ success: true, deleted: ids.length, ids, force })
  } catch (e) {
    console.error('POST /api/admin/posventa/vivienda/:id/reset error:', e)
    return res.status(500).json({ success: false, message: 'Error reseteando formulario posventa' })
  }
})

// ------------------------------------------------------------
// ENDPOINTS PARA GENERACIÓN Y GESTIÓN DE PDFs DE POSVENTA
// ------------------------------------------------------------

// Generar PDF de un formulario de posventa (automático al enviar formulario)
app.post('/api/posventa/form/:id/generar-pdf', verifyToken, authorizeRole(['beneficiario', 'tecnico', 'administrador']), async (req, res) => {
  try {
    const formId = parseInt(req.params.id, 10)
    if (!Number.isFinite(formId)) {
      return res.status(400).json({ success: false, message: 'ID de formulario inválido' })
    }

    // Verificar que el formulario existe y está enviado
    const { data: form, error: formError } = await supabase
      .from('vivienda_postventa_form')
      .select('id, estado, beneficiario_uid, id_vivienda, pdf_path')
      .eq('id', formId)
      .single()

    if (formError) throw formError
    if (!form) {
      return res.status(404).json({ success: false, message: 'Formulario no encontrado' })
    }

    // Verificar permisos (beneficiario solo puede generar su propio PDF)
    const userRole = normalizeRole(req.user?.role)
    if (userRole === 'beneficiario' && form.beneficiario_uid !== req.user?.sub) {
      return res.status(403).json({ success: false, message: 'No autorizado para este formulario' })
    }

    // Si ya existe un PDF, devolverlo
    if (form.pdf_path) {
      const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/formularios-pdf/${form.pdf_path}`
      return res.json({ 
        success: true, 
        data: { 
          pdf_path: form.pdf_path,
          pdf_url: publicUrl,
          already_exists: true
        }
      })
    }

    // Generar el PDF
    console.log(`🔄 Generando PDF para formulario ${formId}...`)
    const { buffer, filename, form: formData } = await posventaPDFService.generarPDF(formId)
    
    // Guardar en Supabase Storage
    const { path, url } = await posventaPDFService.guardarPDFEnSupabase(formId, buffer, filename)
    
    console.log(`✅ PDF generado exitosamente: ${filename}`)
    
    return res.json({
      success: true,
      data: {
        pdf_path: path,
        pdf_url: url,
        filename: filename,
        form_id: formId,
        beneficiario: formData.usuarios.nombre
      }
    })

  } catch (error) {
    console.error('❌ Error generando PDF:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Error al generar PDF',
      error: error.message 
    })
  }
})

// Descargar PDF existente
app.get('/api/posventa/form/:id/pdf', verifyToken, authorizeRole(['beneficiario', 'tecnico', 'administrador']), async (req, res) => {
  try {
    const formId = parseInt(req.params.id, 10)
    if (!Number.isFinite(formId)) {
      return res.status(400).json({ success: false, message: 'ID de formulario inválido' })
    }

    // Obtener información del formulario
    const { data: form, error: formError } = await supabase
      .from('vivienda_postventa_form')
      .select('id, estado, beneficiario_uid, pdf_path, pdf_generated_at')
      .eq('id', formId)
      .single()

    if (formError) throw formError
    if (!form) {
      return res.status(404).json({ success: false, message: 'Formulario no encontrado' })
    }

    // Verificar permisos
    const userRole = normalizeRole(req.user?.role)
    if (userRole === 'beneficiario' && form.beneficiario_uid !== req.user?.sub) {
      return res.status(403).json({ success: false, message: 'No autorizado para este formulario' })
    }

    if (!form.pdf_path) {
      return res.status(404).json({ success: false, message: 'PDF no generado aún' })
    }

    // Generar URL de descarga
    const { data: urlData, error: urlError } = await supabase.storage
      .from('formularios-pdf')
      .createSignedUrl(form.pdf_path, 3600) // 1 hora de validez

    if (urlError) throw urlError

    return res.json({
      success: true,
      data: {
        download_url: urlData.signedUrl,
        pdf_path: form.pdf_path,
        generated_at: form.pdf_generated_at,
        expires_in: 3600
      }
    })

  } catch (error) {
    console.error('❌ Error obteniendo PDF:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Error al obtener PDF',
      error: error.message 
    })
  }
})

// Lista de formularios de posventa para técnicos (con información de PDFs)
app.get('/api/tecnico/posventa/formularios', verifyToken, authorizeRole(['tecnico', 'administrador']), async (req, res) => {
  try {
    const limitReq = parseInt(req.query.limit, 10)
    const limit = Number.isFinite(limitReq) ? Math.min(Math.max(limitReq, 1), 100) : 50
    const offsetReq = parseInt(req.query.offset, 10)
    const offset = Number.isFinite(offsetReq) && offsetReq >= 0 ? offsetReq : 0
    
    // Filtros opcionales
    const estadoFilter = (req.query.estado || '').toString().trim()
    const searchRaw = (req.query.search || '').toString().trim()
    const search = searchRaw.length >= 2 ? searchRaw : ''
    const conPDF = req.query.con_pdf === 'true'
    const sinPDF = req.query.sin_pdf === 'true'

    // Query base con joins para obtener datos del beneficiario y vivienda
    let baseQuery = supabase
      .from('vivienda_postventa_form')
      .select(`
        id,
        estado,
        fecha_creada,
        fecha_enviada,
        fecha_revisada,
        items_no_ok_count,
        observaciones_count,
        pdf_path,
        pdf_generated_at,
        viviendas!id_vivienda (
          id_vivienda,
          direccion,
          tipo_vivienda,
          proyecto:id_proyecto (
            nombre,
            ubicacion
          )
        ),
        usuarios!beneficiario_uid (
          uid,
          nombre,
          email,
          rut
        )
      `, { count: 'exact' })

    // Aplicar filtros
    if (estadoFilter) {
      baseQuery = baseQuery.eq('estado', estadoFilter)
    }
    
    if (conPDF) {
      baseQuery = baseQuery.not('pdf_path', 'is', null)
    }
    
    if (sinPDF) {
      baseQuery = baseQuery.is('pdf_path', null)
    }

    // Para búsqueda por nombre de beneficiario, necesitamos hacerlo diferente
    if (search) {
      // Buscar por nombre de beneficiario o dirección de vivienda
      // Nota: Supabase no permite filtros complejos en joins, así que obtenemos todos y filtramos después
      // En un caso real, se podría hacer con una vista o procedimiento almacenado
    }

    const { data: formularios, error: formError, count: totalCount } = await baseQuery
      .order('fecha_enviada', { ascending: false, nullsFirst: false })
      .order('fecha_creada', { ascending: false })
      .range(offset, offset + limit - 1)

    if (formError) throw formError

    // Filtrar por búsqueda si es necesario (post-procesamiento)
    let filteredFormularios = formularios || []
    if (search) {
      filteredFormularios = filteredFormularios.filter(form => 
        form.usuarios?.nombre?.toLowerCase().includes(search.toLowerCase()) ||
        form.viviendas?.direccion?.toLowerCase().includes(search.toLowerCase()) ||
        form.usuarios?.email?.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Enriquecer con información adicional
    const enrichedFormularios = filteredFormularios.map(form => ({
      ...form,
      beneficiario: {
        uid: form.usuarios?.uid,
        nombre: form.usuarios?.nombre,
        email: form.usuarios?.email,
        rut: form.usuarios?.rut
      },
      vivienda: {
        id: form.viviendas?.id_vivienda,
        direccion: form.viviendas?.direccion,
        tipo: form.viviendas?.tipo_vivienda,
        proyecto: form.viviendas?.proyecto?.nombre || 'Sin proyecto'
      },
      pdf: {
        existe: !!form.pdf_path,
        path: form.pdf_path,
        generado_en: form.pdf_generated_at,
        url_publica: form.pdf_path ? 
          `${process.env.SUPABASE_URL}/storage/v1/object/public/formularios-pdf/${form.pdf_path}` : 
          null
      },
      // Eliminar campos redundantes
      usuarios: undefined,
      viviendas: undefined,
      pdf_path: undefined,
      pdf_generated_at: undefined
    }))

    return res.json({
      success: true,
      data: enrichedFormularios,
      meta: {
        total: search ? filteredFormularios.length : (totalCount || 0),
        limit,
        offset,
        hasMore: (offset + enrichedFormularios.length) < (totalCount || 0),
        filters: {
          estado: estadoFilter || null,
          search: search || null,
          con_pdf: conPDF,
          sin_pdf: sinPDF
        }
      }
    })

  } catch (error) {
    console.error('❌ Error obteniendo formularios para técnico:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Error al obtener formularios de posventa',
      error: error.message 
    })
  }
})

// Obtener detalles de un formulario específico de posventa para técnico
app.get('/api/tecnico/posventa/form/:id', verifyToken, authorizeRole(['tecnico', 'administrador']), async (req, res) => {
  try {
    const formId = parseInt(req.params.id, 10)
    if (!Number.isFinite(formId)) {
      return res.status(400).json({ success: false, message: 'ID de formulario inválido' })
    }

    // Obtener datos del formulario con información completa
    const { data: formulario, error: formError } = await supabase
      .from('vivienda_postventa_form')
      .select(`
        id,
        estado,
        fecha_creada,
        fecha_enviada,
        fecha_revisada,
        comentario_tecnico,
        items_no_ok_count,
        observaciones_count,
        pdf_path,
        pdf_generated_at,
        viviendas!id_vivienda (
          id_vivienda,
          direccion,
          tipo_vivienda,
          fecha_entrega,
          proyecto:id_proyecto (
            nombre,
            ubicacion
          )
        ),
        usuarios!beneficiario_uid (
          nombre,
          email,
          rut,
          direccion
        )
      `)
      .eq('id', formId)
      .single()

    if (formError) throw formError
    if (!formulario) {
      return res.status(404).json({ success: false, message: 'Formulario no encontrado' })
    }

    // Obtener items del formulario
    const { data: items, error: itemsError } = await supabase
      .from('vivienda_postventa_item')
      .select('id, form_id, categoria, item, ok, severidad, comentario, fotos_json, crear_incidencia, incidencia_id, orden')
      .eq('form_id', formId)
      .order('orden')

    if (itemsError) throw itemsError

    return res.json({
      success: true,
      data: {
        formulario: {
          ...formulario,
          beneficiario: formulario.usuarios,
          vivienda: formulario.viviendas
        },
        items: items || []
      }
    })

  } catch (error) {
    console.error('❌ Error obteniendo formulario específico:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Error al obtener formulario',
      error: error.message 
    })
  }
})

// Endpoint para que técnico marque formulario de posventa como revisado
app.post('/api/tecnico/posventa/form/:id/revisar', verifyToken, authorizeRole(['tecnico', 'administrador']), async (req, res) => {
  try {
    const formId = parseInt(req.params.id, 10)
    if (!Number.isFinite(formId)) {
      return res.status(400).json({ success: false, message: 'ID de formulario inválido' })
    }

    const { comentario_tecnico, generar_incidencias = true } = req.body

    // Verificar que el formulario existe y está enviado
    const { data: form, error: formError } = await supabase
      .from('vivienda_postventa_form')
      .select('id, estado, id_vivienda')
      .eq('id', formId)
      .single()

    if (formError) throw formError
    if (!form) {
      return res.status(404).json({ success: false, message: 'Formulario no encontrado' })
    }

    if (form.estado !== 'enviada') {
      return res.status(409).json({ 
        success: false, 
        message: 'Solo se pueden revisar formularios en estado "enviada"' 
      })
    }

    // Actualizar estado del formulario
    const updateData = {
      estado: 'revisada',
      fecha_revisada: new Date().toISOString()
    };
    
    // Solo agregar comentario_tecnico si la columna existe
    if (comentario_tecnico) {
      updateData.comentario_tecnico = comentario_tecnico;
    }
    
    const { data: updatedForm, error: updateError } = await supabase
      .from('vivienda_postventa_form')
      .update(updateData)
      .eq('id', formId)
      .select('id, estado, fecha_revisada')
      .single()

    if (updateError) throw updateError

    let incidenciasCreadas = 0

    // Generar incidencias automáticamente para items con problemas
    if (generar_incidencias) {
      const { data: itemsConProblemas, error: itemsError } = await supabase
        .from('vivienda_postventa_item')
        .select('id, categoria, item, severidad, comentario, crear_incidencia')
        .eq('form_id', formId)
        .eq('ok', false)
        .eq('crear_incidencia', true)
        .is('incidencia_id', null) // Solo items sin incidencia ya creada

      if (itemsError) throw itemsError

      if (itemsConProblemas && itemsConProblemas.length > 0) {
        for (const item of itemsConProblemas) {
          try {
            const descripcion = `[Posventa] ${item.categoria} - ${item.item}${item.comentario ? `: ${item.comentario}` : ''}`
            
            // Determinar prioridad basada en severidad
            let prioridad = 'media'
            if (item.severidad === 'mayor') prioridad = 'alta'
            else if (item.severidad === 'menor') prioridad = 'baja'

            // Crear incidencia
            const { data: nuevaIncidencia, error: incidenciaError } = await supabase
              .from('incidencias')
              .insert([{
                id_vivienda: form.id_vivienda,
                id_usuario_reporta: req.user?.sub, // El técnico que revisa
                descripcion: descripcion,
                estado: 'abierta',
                categoria: item.categoria,
                prioridad: prioridad,
                prioridad_origen: prioridad,
                prioridad_final: prioridad,
                fecha_reporte: new Date().toISOString()
              }])
              .select('id_incidencia')
              .single()

            if (!incidenciaError && nuevaIncidencia) {
              // Vincular item con la incidencia creada
              await supabase
                .from('vivienda_postventa_item')
                .update({ incidencia_id: nuevaIncidencia.id_incidencia })
                .eq('id', item.id)

              // Registrar en historial
              await logIncidenciaEvent({
                incidenciaId: nuevaIncidencia.id_incidencia,
                actorUid: req.user?.sub,
                actorRol: 'tecnico',
                tipo: 'creada_desde_posventa',
                estadoNuevo: 'abierta',
                comentario: `Generada automáticamente desde formulario de posventa #${formId}`,
                metadata: { 
                  postventa_form_id: formId,
                  postventa_item_id: item.id,
                  severidad: item.severidad 
                }
              })

              incidenciasCreadas++
            }
          } catch (error) {
            console.error(`Error creando incidencia para item ${item.id}:`, error)
          }
        }
      }
    }

    return res.json({
      success: true,
      data: {
        formulario: updatedForm,
        incidencias_creadas: incidenciasCreadas,
        mensaje: incidenciasCreadas > 0 ? 
          `Formulario revisado. Se crearon ${incidenciasCreadas} incidencias automáticamente.` :
          'Formulario revisado exitosamente.'
      }
    })

  } catch (error) {
    console.error('❌ Error revisando formulario de posventa:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Error al revisar formulario de posventa',
      error: error.message 
    })
  }
})

// Hook automático: generar PDF cuando un formulario se envía
// Este endpoint se puede llamar automáticamente desde el envío del formulario
app.post('/api/internal/posventa/auto-generar-pdf/:id', async (req, res) => {
  try {
    const formId = parseInt(req.params.id, 10)
    if (!Number.isFinite(formId)) {
      return res.status(400).json({ success: false, message: 'ID inválido' })
    }

    // Verificar que el formulario está en estado 'enviada' y no tiene PDF
    const { data: form, error: formError } = await supabase
      .from('vivienda_postventa_form')
      .select('id, estado, pdf_path')
      .eq('id', formId)
      .single()

    if (formError || !form || form.estado !== 'enviada' || form.pdf_path) {
      return res.json({ success: true, message: 'No requiere generación de PDF' })
    }

    // Generar PDF en segundo plano
    const { buffer, filename } = await posventaPDFService.generarPDF(formId)
    await posventaPDFService.guardarPDFEnSupabase(formId, buffer, filename)

    console.log(`📄 PDF generado automáticamente para formulario ${formId}: ${filename}`)
    
    return res.json({ success: true, message: 'PDF generado automáticamente' })

  } catch (error) {
    console.error('❌ Error en generación automática de PDF:', error)
    return res.json({ success: false, error: error.message })
  }
})

import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { supabase } from './supabaseClient.js'
import dotenv from 'dotenv'
import multer from 'multer'
import { randomUUID } from 'crypto'

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
    const includeMedia = String(req.query.includeMedia || '').toLowerCase() === '1'

    const { data: viv, error: ev } = await supabase
      .from('viviendas')
      .select('id_vivienda')
      .eq('beneficiario_uid', beneficiarioUid)
      .maybeSingle()
    if (ev) throw ev
    if (!viv) return res.status(404).json({ success: false, message: 'No tienes una vivienda asignada' })

    const { data: incs, error: ei } = await supabase
      .from('incidencias')
      .select('id_incidencia, id_vivienda, descripcion, estado, categoria, prioridad, fecha_reporte, id_usuario_tecnico')
      .eq('id_vivienda', viv.id_vivienda)
      .order('id_incidencia', { ascending: false })
      .limit(limit)
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

    return res.json({ success: true, data: enriched })
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
      fecha_reporte: nowIso
    }
    const { data: nueva, error: eins } = await supabase
      .from('incidencias')
      .insert([record])
      .select('id_incidencia, id_vivienda, descripcion, estado, categoria, prioridad, fecha_reporte')
      .single()
    if (eins) throw eins

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

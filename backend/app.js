import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { supabase } from './supabaseClient.js'
import dotenv from 'dotenv'

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

export { app, normalizeRole, isStrongPassword, loginLimiter }

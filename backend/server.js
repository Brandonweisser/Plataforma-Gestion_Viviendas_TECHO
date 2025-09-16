import express from 'express'
import cors from 'cors'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { supabase } from './supabaseClient.js'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10)

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

// Middleware para verificar JWT en rutas protegidas
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

// Registro de usuario con contraseña hasheada y retorno de JWT
app.post('/api/register', async (req, res) => {
  try {
    // Permite "name" o "nombre" desde el frontend
    const nombre = req.body.nombre || req.body.name
    const { email, password, rol } = req.body
    if (!nombre || !email || !password) {
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos' })
    }

    // Validar existencia de email (tabla existente usa 'uid' como PK)
    const emailLower = email.toLowerCase()
    const { data: existente, error: errExiste } = await supabase
      .from('usuarios')
      .select('uid')
      .eq('email', emailLower)
      .maybeSingle()

    if (errExiste) {
      return res.status(500).json({ success: false, message: 'Error verificando usuario', detail: errExiste.message })
    }
    if (existente) {
      return res.status(409).json({ success: false, message: 'El correo ya está registrado' })
    }

  // Hash de contraseña
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS)
  // Mapear roles a valores de la tabla existente (administrador/tecnico/beneficiario)
  const rolInput = (rol || '').toLowerCase()
  const rolMap = { admin: 'administrador', administrador: 'administrador', tecnico: 'tecnico', beneficiario: 'beneficiario' }
  const rolValido = rolMap[rolInput] || 'beneficiario'

    // Generar uid si la tabla no tiene default (workaround). Ideal: definir DEFAULT/IDENTITY en DB.
    let newUid = null
    try {
      const { data: last, error: errLast } = await supabase
        .from('usuarios')
        .select('uid')
        .order('uid', { ascending: false })
        .limit(1)
      if (!errLast && Array.isArray(last) && last.length > 0) {
        const maxUid = Number(last[0].uid)
        newUid = Number.isFinite(maxUid) ? maxUid + 1 : 1
      } else {
        newUid = 1
      }
    } catch (_) {
      newUid = 1
    }

    // Insertar usuario
    const { data: insertado, error: errInsert } = await supabase
      .from('usuarios')
      .insert([{ uid: newUid, nombre, email: emailLower, rol: rolValido, ['contraseña']: password_hash }])
      .select('uid, rol')
      .single()

    if (errInsert) {
      return res.status(500).json({ success: false, message: 'No se pudo crear el usuario', detail: errInsert.message })
    }

    if (!JWT_SECRET) {
      return res.status(200).json({ success: true, token: null, message: 'Usuario creado. Falta configurar JWT_SECRET en .env para emitir token.' })
    }

    // Firmar token
  const token = jwt.sign({ sub: insertado.uid, role: insertado.rol }, JWT_SECRET, { expiresIn: '7d' })
    return res.json({ success: true, token })
  } catch (error) {
    console.error('Register error:', error)
    return res.status(500).json({ success: false, message: 'Error en el servidor' })
  }
})

// Login: valida credenciales y entrega JWT
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Faltan credenciales' })
    }

    const { data: usuario, error: errSel } = await supabase
      .from('usuarios')
      .select('uid, contraseña, rol')
      .eq('email', email.toLowerCase())
      .single()

    if (errSel || !usuario) {
      return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos' })
    }

    const stored = usuario['contraseña'] || ''
    let ok = false
    // Si ya está hasheado (bcrypt comienza con $2), valida con bcrypt; si no, compara plano (compatibilidad temporal)
    if (stored.startsWith('$2')) {
      ok = await bcrypt.compare(password, stored)
    } else {
      ok = password === stored
    }
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

// Ruta protegida de prueba para obtener info del usuario autenticado
app.get('/api/me', verifyToken, async (req, res) => {
  try {
    const userId = req.user?.sub
    console.log('🔍 /api/me - userId from token:', userId)
    console.log('🔍 /api/me - req.user:', req.user)
    
    const { data, error } = await supabase
      .from('usuarios')
      .select('uid, nombre, email, rol')
      .eq('uid', userId)
      .single()
    
    console.log('🔍 /api/me - supabase query result:', { data, error })
    
    if (error) throw error
    res.json({ success: true, data })
  } catch (e) {
    console.error('❌ Error en /api/me:', e)
    res.status(500).json({ success: false, message: 'No se pudo obtener el usuario' })
  }
})

app.post('/usuarios', async (req, res) => {
  const { nombre, email, rol, auth_id } = req.body

  try {
    const { data, error } = await supabase
      .from('usuarios')
      .insert([{ nombre, email, rol, auth_id }]) // auth_id es opcional si quieres relacionarlo con Supabase Auth

    if (error) throw error

    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

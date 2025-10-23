import express from 'express'
import bcrypt from 'bcrypt'
import { supabase } from '../supabaseClient.js'
import { insertUser, getLastUser } from '../models/User.js'

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10)
const router = express.Router()

// Estado del setup: true si ya hay algún admin
router.get('/estado', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('uid')
      .eq('rol', 'administrador')
      .limit(1)
    if (error) throw error
    const hasAdmin = Array.isArray(data) && data.length > 0
    res.json({ success: true, data: { hasAdmin } })
  } catch (e) {
    console.error('Error consultando estado setup:', e)
    res.status(500).json({ success: false, message: 'Error consultando estado' })
  }
})

// Crea el primer admin si no existe
router.post('/primer-admin', async (req, res) => {
  try {
    const { email, password, nombre } = req.body || {}
    if (!email || !password) return res.status(400).json({ success: false, message: 'email y password son obligatorios' })

    const { data: admins, error: errAdmins } = await supabase
      .from('usuarios')
      .select('uid')
      .eq('rol', 'administrador')
      .limit(1)
    if (errAdmins) throw errAdmins
    if (Array.isArray(admins) && admins.length) return res.status(403).json({ success: false, message: 'Ya existe un administrador' })

    const lastUser = await getLastUser()
    const newUid = lastUser ? Number(lastUser.uid) + 1 : 1
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS)
    const userData = { uid: newUid, nombre: nombre || email, email: email.toLowerCase(), rol: 'administrador', password_hash }
    await insertUser(userData)
    res.status(201).json({ success: true, data: { uid: newUid, email: userData.email } })
  } catch (e) {
    console.error('Error creando primer admin:', e)
    res.status(500).json({ success: false, message: 'Error creando primer admin' })
  }
})

export default router

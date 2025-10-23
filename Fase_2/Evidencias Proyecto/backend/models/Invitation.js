/**
 * Modelo de Invitaciones de Usuario
 * Maneja creación, validación y aceptación de invitaciones
 */

import crypto from 'crypto'
import { supabase } from '../supabaseClient.js'
import { sendInvitationEmail } from '../services/EmailService.js'
import bcrypt from 'bcrypt'
import { insertUser, getLastUser } from './User.js'

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10)

/**
 * Crea una invitación y envía email. Requiere tabla 'user_invitations'.
 * Estructura esperada:
 * user_invitations(id, email, nombre, rol, token, expires_at, accepted_at, created_by)
 */
export async function createInvitationAndSend({ email, nombre = '', rol, invitedByUid = null, expiresMinutes = 60 * 24 }) {
  const token = crypto.randomBytes(24).toString('hex')
  const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000).toISOString()
  const payload = { email: email.toLowerCase(), nombre, rol, token, expires_at: expiresAt, created_by: invitedByUid }
  const { data, error } = await supabase.from('user_invitations').insert([payload]).select('*')
  if (error) throw error
  const invite = data?.[0]
  const acceptUrlBase = process.env.FRONTEND_BASE_URL || 'http://localhost:3000'
  const acceptUrl = `${acceptUrlBase}/aceptar-invitacion?token=${encodeURIComponent(token)}`
  await sendInvitationEmail(email, { nombre, rol, acceptUrl })
  return { id: invite?.id, email, rol, expires_at: expiresAt }
}

export async function validateInvitationToken(token) {
  const { data, error } = await supabase
    .from('user_invitations')
    .select('id,email,nombre,rol,expires_at,accepted_at')
    .eq('token', token)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  if (data.accepted_at) return { ...data, status: 'used' }
  if (new Date(data.expires_at).getTime() < Date.now()) return { ...data, status: 'expired' }
  return { ...data, status: 'valid' }
}

export async function acceptInvitationToken(token, { password, nombre }) {
  const { data, error } = await supabase
    .from('user_invitations')
    .select('*')
    .eq('token', token)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('Invitación no encontrada')
  if (data.accepted_at) throw new Error('Invitación ya usada')
  if (new Date(data.expires_at).getTime() < Date.now()) throw new Error('Invitación expirada')

  // Crear usuario si no existe
  const email = data.email.toLowerCase()
  const { data: exists, error: errExists } = await supabase
    .from('usuarios')
    .select('uid')
    .eq('email', email)
    .maybeSingle()
  if (errExists) throw errExists
  if (exists) throw new Error('Email ya registrado')

  const lastUser = await getLastUser()
  const newUid = lastUser ? Number(lastUser.uid) + 1 : 1
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS)
  const userData = {
    uid: newUid,
    nombre: nombre || data.nombre || email,
    email,
    rol: data.rol,
    password_hash
  }
  await insertUser(userData)
  const { error: errUp } = await supabase
    .from('user_invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', data.id)
  if (errUp) throw errUp
  return { uid: newUid, email, rol: data.rol }
}

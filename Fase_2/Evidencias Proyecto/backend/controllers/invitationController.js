/**
 * Controlador de Invitaciones (público)
 */
import { validateInvitationToken, acceptInvitationToken } from '../models/Invitation.js'

export async function validateInvitation(req, res) {
  try {
    const token = String(req.query.token || '').trim()
    if (!token) return res.status(400).json({ success: false, message: 'Falta token' })
    try {
      const info = await validateInvitationToken(token)
      if (!info) return res.status(404).json({ success: false, message: 'Invitación no encontrada' })
      if (info.status === 'expired') return res.status(410).json({ success: false, message: 'Invitación expirada' })
      if (info.status === 'used') return res.status(409).json({ success: false, message: 'Invitación ya usada' })
      return res.json({ success: true, data: { email: info.email, nombre: info.nombre, rol: info.rol } })
    } catch (e) {
      const msg = (e?.message || '').toLowerCase()
      if (msg.includes('user_invitations')) {
        return res.status(501).json({ success: false, message: 'Invitaciones no configuradas en base de datos.' })
      }
      throw e
    }
  } catch (error) {
    console.error('Error validando invitación:', error)
    res.status(500).json({ success: false, message: 'Error validando invitación' })
  }
}

export async function acceptInvitation(req, res) {
  try {
    const { token, password, nombre } = req.body || {}
    if (!token || !password) return res.status(400).json({ success: false, message: 'token y password son obligatorios' })
    try {
      const user = await acceptInvitationToken(String(token), { password, nombre })
      return res.status(201).json({ success: true, data: user })
    } catch (e) {
      const msg = (e?.message || '').toLowerCase()
      if (msg.includes('user_invitations')) {
        return res.status(501).json({ success: false, message: 'Invitaciones no configuradas en base de datos.' })
      }
      if (msg.includes('ya registrada')) return res.status(409).json({ success: false, message: e.message })
      if (msg.includes('expirada')) return res.status(410).json({ success: false, message: e.message })
      if (msg.includes('no encontrada')) return res.status(404).json({ success: false, message: e.message })
      console.error('Error aceptando invitación:', e)
      return res.status(500).json({ success: false, message: 'No se pudo aceptar la invitación' })
    }
  } catch (error) {
    console.error('Error en aceptación de invitación:', error)
    res.status(500).json({ success: false, message: 'Error aceptando invitación' })
  }
}

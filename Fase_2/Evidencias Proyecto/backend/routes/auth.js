/**
 * Rutas de Autenticación
 * Plataforma de Gestión de Viviendas TECHO
 * 
 * Define todas las rutas relacionadas con autenticación y autorización
 */

import express from 'express'
import rateLimit from 'express-rate-limit'
import {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js'
import { validateInvitation, acceptInvitation } from '../controllers/invitationController.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

// Rate limiter para login (3 intentos por minuto por IP)
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 3, // máximo 3 intentos
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false, 
    message: 'Demasiados intentos, inténtalo en 1 minuto.' 
  }
})

// Health check para rutas de autenticación
router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'auth' })
})

// Registro de nuevos usuarios (solo beneficiarios)
router.post('/register', registerUser)

// Login de usuarios con rate limiting
router.post('/login', loginLimiter, loginUser)

// Obtener información del usuario autenticado
router.get('/me', verifyToken, getMe)

// Logout (stateless)
router.post('/logout', logoutUser)

// Solicitar código de recuperación de contraseña
router.post('/forgot-password', forgotPassword)

// Restablecer contraseña con código de recuperación
router.post('/reset-password', resetPassword)

// Invitaciones: públicas (validar y aceptar)
router.get('/invite/validate', validateInvitation)
router.post('/invite/accept', acceptInvitation)

export default router
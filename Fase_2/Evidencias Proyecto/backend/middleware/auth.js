/**
 * Middleware de autenticación y autorización
 * Plataforma de Gestión de Viviendas TECHO
 */

import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET

/**
 * Middleware para verificar token JWT en las peticiones
 * Verifica que el usuario esté autenticado antes de acceder a rutas protegidas
 */
export function verifyToken(req, res, next) {
  // Obtener token del header Authorization
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Format: "Bearer TOKEN"

  // Si no hay token, denegar acceso
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token de acceso requerido' 
    })
  }

  try {
    // Verificar y decodificar el token
    const decoded = jwt.verify(token, JWT_SECRET)
    
    // Agregar información del usuario a la request para uso posterior
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      rol: decoded.rol,
      rut: decoded.rut
    }
    
    next()
  } catch (error) {
    // Token inválido o expirado
    return res.status(403).json({ 
      success: false, 
      message: 'Token inválido o expirado' 
    })
  }
}

/**
 * Middleware para autorizar acceso basado en roles de usuario
 * @param {string[]} allowedRoles - Array de roles permitidos para acceder
 * @returns {Function} Middleware function
 */
export function authorizeRole(allowedRoles) {
  return (req, res, next) => {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no autenticado' 
      })
    }

    // Verificar que el rol del usuario esté en los roles permitidos
    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permisos para acceder a este recurso' 
      })
    }

    next()
  }
}

/**
 * Middleware específico para verificar que el usuario sea administrador
 * Simplifica el uso para rutas que solo requieren rol de administrador
 */
export function requireAdmin(req, res, next) {
  return authorizeRole(['administrador'])(req, res, next)
}

/**
 * Middleware para verificar que el usuario sea técnico o administrador
 * Para rutas que requieren permisos técnicos
 */
export function requireTechnicianOrAdmin(req, res, next) {
  return authorizeRole(['tecnico', 'administrador'])(req, res, next)
}

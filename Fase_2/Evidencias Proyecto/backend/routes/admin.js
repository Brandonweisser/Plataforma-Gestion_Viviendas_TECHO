/**
 * Rutas de Administración
 * Plataforma de Gestión de Viviendas TECHO
 * 
 * Define todas las rutas administrativas del sistema
 */

import express from 'express'
import { verifyToken, requireAdmin } from '../middleware/auth.js'
import {
  adminHealth,
  getDashboardStats,
  getUsers,
  createUser,
  updateUserById,
  deleteUserById,
  getProjects,
  createNewProject,
  updateProjectById,
  deleteProjectById,
  assignTechnician,
  removeTechnician,
  getHousings,
  createNewHousing,
  updateHousingById,
  deleteHousingById,
  assignBeneficiary
} from '../controllers/adminController.js'

const router = express.Router()

// Middleware: todas las rutas admin requieren autenticación y rol de administrador
router.use(verifyToken)
router.use(requireAdmin)

// Health check administrativo
router.get('/health', adminHealth)

// Dashboard y estadísticas
router.get('/dashboard/stats', getDashboardStats)

// ==================== GESTIÓN DE USUARIOS ====================
router.get('/usuarios', getUsers)
router.post('/usuarios', createUser)
router.put('/usuarios/:uid', updateUserById)
router.delete('/usuarios/:uid', deleteUserById)

// ==================== GESTIÓN DE PROYECTOS ====================
router.get('/proyectos', getProjects)
router.post('/proyectos', createNewProject)
router.put('/proyectos/:id', updateProjectById)
router.delete('/proyectos/:id', deleteProjectById)

// Gestión de técnicos en proyectos
router.post('/proyectos/:id/tecnicos', assignTechnician)
router.delete('/proyectos/:id/tecnicos/:tecnico_uid', removeTechnician)

// ==================== GESTIÓN DE VIVIENDAS ====================
router.get('/viviendas', getHousings)
router.post('/viviendas', createNewHousing)
router.put('/viviendas/:id', updateHousingById)
router.delete('/viviendas/:id', deleteHousingById)

// Asignación de beneficiarios
router.post('/viviendas/:id/asignar', assignBeneficiary)

export default router
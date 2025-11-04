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
  getDashboardActivity,
  getDashboardAnalytics,
  getUsers,
  createUser,
  updateUserById,
  deleteUserById,
  inviteUser,
  getProjects,
  createNewProject,
  updateProjectById,
  deleteProjectById,
  assignTechnician,
  removeTechnician,
  listProjectTechnicians,
  getHousings,
  createNewHousing,
  updateHousingById,
  deleteHousingById,
  assignBeneficiary,
  unassignBeneficiary,
  getSecurityDashboard,
  getAuditLogs,
  getUserAuditLogs
} from '../controllers/adminController.js'
import {
  listConstructoras,
  getConstructora,
  createNewConstructora,
  updateConstructoraById,
  deleteConstructoraById,
  assignConstructora,
  removeConstructora
} from '../controllers/constructoraController.js'
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  deactivateTemplate,
  listTemplateItems,
  addTemplateItems,
  updateTemplateItem,
  deleteTemplateItem
} from '../controllers/postventaTemplateController.js'
import { listUsuariosByConstructora } from '../controllers/constructoraController.js'
import {
  listRooms,
  createRoom,
  updateRoom,
  deleteRoom
} from '../controllers/postventaTemplateController.js'

const router = express.Router()

// Middleware: todas las rutas admin requieren autenticación y rol de administrador
router.use(verifyToken)
router.use(requireAdmin)

// Health check administrativo
router.get('/health', adminHealth)

// Dashboard y estadísticas
router.get('/dashboard/stats', getDashboardStats)
router.get('/dashboard/activity', getDashboardActivity)
router.get('/dashboard/analytics', getDashboardAnalytics)

// ==================== SEGURIDAD Y AUDITORÍA ====================
router.get('/security/dashboard', getSecurityDashboard)
router.get('/audit-logs', getAuditLogs)
router.get('/audit-logs/user/:uid', getUserAuditLogs)

// ==================== GESTIÓN DE USUARIOS ====================
router.get('/usuarios', getUsers)
router.post('/usuarios', createUser)
router.put('/usuarios/:uid', updateUserById)
router.delete('/usuarios/:uid', deleteUserById)

// Invitaciones de usuarios (admin)
router.post('/usuarios/invitar', inviteUser)

// ==================== GESTIÓN DE PROYECTOS ====================
router.get('/proyectos', getProjects)
router.post('/proyectos', createNewProject)
router.put('/proyectos/:id', updateProjectById)
router.delete('/proyectos/:id', deleteProjectById)

// Gestión de técnicos en proyectos
router.post('/proyectos/:id/tecnicos', assignTechnician)
router.delete('/proyectos/:id/tecnicos/:tecnico_uid', removeTechnician)
router.get('/proyectos/:id/tecnicos', listProjectTechnicians)

// ==================== GESTIÓN DE VIVIENDAS ====================
router.get('/viviendas', getHousings)
router.post('/viviendas', createNewHousing)
router.put('/viviendas/:id', updateHousingById)
router.delete('/viviendas/:id', deleteHousingById)

// Asignación de beneficiarios
router.post('/viviendas/:id/asignar', assignBeneficiary)
router.post('/viviendas/:id/desasignar', unassignBeneficiary)

// ==================== GESTIÓN DE CONSTRUCTORAS ====================
router.get('/constructoras', listConstructoras)
router.post('/constructoras', createNewConstructora)
router.get('/constructoras/:id', getConstructora)
router.put('/constructoras/:id', updateConstructoraById)
router.delete('/constructoras/:id', deleteConstructoraById)
// Listar usuarios asignados a una constructora
router.get('/constructoras/:id/usuarios', listUsuariosByConstructora)

// Asignar / remover constructora a un usuario (admin)
router.post('/usuarios/:uid/constructora', assignConstructora)
router.delete('/usuarios/:uid/constructora', removeConstructora)

// ==================== GESTIÓN DE TEMPLATES DE POSTVENTA ====================
router.get('/postventa/templates', listTemplates)
router.post('/postventa/templates', createTemplate)
router.put('/postventa/templates/:id', updateTemplate)
router.delete('/postventa/templates/:id', deactivateTemplate)
router.get('/postventa/templates/:id/items', listTemplateItems)
router.post('/postventa/templates/:id/items', addTemplateItems)
router.put('/postventa/templates/:id/items/:itemId', updateTemplateItem)
router.delete('/postventa/templates/:id/items/:itemId', deleteTemplateItem)

// Rooms (habitaciones) por template
router.get('/postventa/templates/:id/rooms', listRooms)
router.post('/postventa/templates/:id/rooms', createRoom)
router.put('/postventa/templates/:id/rooms/:roomId', updateRoom)
router.delete('/postventa/templates/:id/rooms/:roomId', deleteRoom)

// Archivos (planos) por template
import { listTemplateFiles, uploadTemplateFile, deleteTemplateFile, convertTemplateFileToPdf } from '../controllers/postventaTemplateController.js'
router.get('/postventa/templates/:id/files', listTemplateFiles)
router.post('/postventa/templates/:id/files', uploadTemplateFile)
router.delete('/postventa/templates/:id/files/:fileId', deleteTemplateFile)
router.post('/postventa/templates/:id/files/:fileId/convert-pdf', convertTemplateFileToPdf)

export default router
/**
 * Rutas de Técnico
 * Plataforma de Gestión de Viviendas TECHO
 * 
 * Define todas las rutas específicas para usuarios técnicos
 */

import express from 'express'
import { verifyToken, requireTechnicianOrAdmin } from '../middleware/auth.js'
import { isSupervisor } from '../middleware/permissions.js'
import {
  technicianHealth,
  getIncidences,
  getIncidenceDetail,
  updateIncidenceStatus,
  addIncidenceComment,
  addCommentWithMedia,
  getCommentMedia,
  assignIncidenceToMe,
  assignIncidenceToTechnician,
  listAvailableTechnicians,
  getTechnicianStats,
  uploadIncidenceMedia,
  listIncidenceMedia,
  listPosventaForms,
  getPosventaFormDetail,
  reviewPosventaForm,
  listTechnicianHousings,
  deliverTechnicianHousing,
  getTechnicianDashboardStats,
  listPosventaFormPlans,
  getVisitasSugeridas
} from '../controllers/tecnicoController.js'

const router = express.Router()

// Middleware: todas las rutas técnico requieren autenticación y rol de técnico o admin
router.use(verifyToken)
router.use(requireTechnicianOrAdmin)

// Health check de técnico
router.get('/health', technicianHealth)

// Gestión de incidencias
router.get('/incidencias', getIncidences)
router.get('/incidencias/:id', getIncidenceDetail)
router.put('/incidencias/:id/estado', updateIncidenceStatus)
router.post('/incidencias/:id/comentar', addIncidenceComment)  // Agregar comentario simple
router.post('/incidencias/:id/comentar-con-media', addCommentWithMedia)  // 🆕 Agregar comentario con fotos/videos
router.get('/comentarios/:comentarioId/media', getCommentMedia)  // 🆕 Obtener media de un comentario
router.post('/incidencias/:id/asignar-a-mi', assignIncidenceToMe)  // Auto-asignarse
router.post('/incidencias/:id/asignar', isSupervisor, assignIncidenceToTechnician)  // Asignar a otro (solo supervisores)
router.get('/incidencias/:id/media', listIncidenceMedia)
router.post('/incidencias/:id/media', uploadIncidenceMedia)

// 🆕 Listar técnicos disponibles (solo supervisores)
router.get('/tecnicos-disponibles', isSupervisor, listAvailableTechnicians)

// 🆕 Visitas sugeridas para hoy (técnicos de campo y supervisores)
router.get('/visitas-sugeridas', getVisitasSugeridas)

// Estadísticas del técnico
router.get('/stats', getTechnicianStats)

// Posventa - técnico
router.get('/posventa/formularios', listPosventaForms)
router.get('/posventa/form/:id', getPosventaFormDetail)
router.post('/posventa/form/:id/revisar', reviewPosventaForm)
router.get('/posventa/form/:id/planos', listPosventaFormPlans)

// Viviendas del técnico
router.get('/viviendas', listTechnicianHousings)
router.post('/viviendas/:id/entregar', deliverTechnicianHousing)

// Dashboard
router.get('/dashboard/stats', getTechnicianDashboardStats)

export default router
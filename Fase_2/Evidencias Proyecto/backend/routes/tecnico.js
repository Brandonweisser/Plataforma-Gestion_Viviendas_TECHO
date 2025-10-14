/**
 * Rutas de Técnico
 * Plataforma de Gestión de Viviendas TECHO
 * 
 * Define todas las rutas específicas para usuarios técnicos
 */

import express from 'express'
import { verifyToken, requireTechnicianOrAdmin } from '../middleware/auth.js'
import {
  technicianHealth,
  getIncidences,
  getIncidenceDetail,
  updateIncidenceStatus,
  assignIncidenceToMe,
  getTechnicianStats,
  uploadIncidenceMedia,
  listIncidenceMedia,
  listPosventaForms,
  getPosventaFormDetail,
  reviewPosventaForm,
  listTechnicianHousings,
  deliverTechnicianHousing,
  getTechnicianDashboardStats
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
router.post('/incidencias/:id/asignar', assignIncidenceToMe)
router.get('/incidencias/:id/media', listIncidenceMedia)
router.post('/incidencias/:id/media', uploadIncidenceMedia)

// Estadísticas del técnico
router.get('/stats', getTechnicianStats)

// Posventa - técnico
router.get('/posventa/formularios', listPosventaForms)
router.get('/posventa/form/:id', getPosventaFormDetail)
router.post('/posventa/form/:id/revisar', reviewPosventaForm)

// Viviendas del técnico
router.get('/viviendas', listTechnicianHousings)
router.post('/viviendas/:id/entregar', deliverTechnicianHousing)

// Dashboard
router.get('/dashboard/stats', getTechnicianDashboardStats)

export default router
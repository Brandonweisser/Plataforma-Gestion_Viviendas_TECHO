/**
 * Rutas de Beneficiario
 * Plataforma de Gestión de Viviendas TECHO
 * 
 * Define todas las rutas específicas para usuarios beneficiarios
 */

import express from 'express'
import { verifyToken, authorizeRole } from '../middleware/auth.js'
import {
  beneficiaryHealth,
  getMyHousing,
  getMyReception,
  getMyIncidences,
  createNewIncidence,
  getIncidenceDetail
} from '../controllers/beneficiarioController.js'

const router = express.Router()

// Middleware: todas las rutas beneficiario requieren autenticación y rol de beneficiario o admin
router.use(verifyToken)
router.use(authorizeRole(['beneficiario', 'administrador']))

// Health check de beneficiario
router.get('/health', beneficiaryHealth)

// Información de la vivienda asignada
router.get('/vivienda', getMyHousing)

// Información de recepción de la vivienda
router.get('/recepcion', getMyReception)

// Gestión de incidencias
router.get('/incidencias', getMyIncidences)
router.post('/incidencias', createNewIncidence)
router.get('/incidencias/:id', getIncidenceDetail)

export default router
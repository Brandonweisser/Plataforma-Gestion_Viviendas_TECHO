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
  getIncidenceDetail,
  validateIncidence
} from '../controllers/beneficiarioController.js'
import { 
  getPosventaForm, 
  createPosventaForm, 
  savePosventaItems, 
  sendPosventaForm,
  resetPosventaForm
} from '../controllers/beneficiarioController.js'
import { getPosventaPlans } from '../controllers/beneficiarioController.js'
import { 
  uploadIncidenciaMediaBeneficiario,
  listIncidenciaMediaBeneficiario
} from '../controllers/mediaIncidenciasBeneficiario.js'
import { uploadPosventaItemFoto } from '../controllers/posventaMediaController.js'

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
router.get('/incidencias/:id/media', listIncidenciaMediaBeneficiario)
router.post('/incidencias/:id/media', uploadIncidenciaMediaBeneficiario)
router.post('/incidencias/:id/validar', validateIncidence)

// Posventa
router.get('/posventa/form', getPosventaForm)
router.post('/posventa/form', createPosventaForm)
router.post('/posventa/form/items', savePosventaItems)
router.post('/posventa/form/enviar', sendPosventaForm)
router.get('/posventa/planos', getPosventaPlans)
// Dev only: resetear y recrear el formulario desde el template activo
router.post('/posventa/form/reset', resetPosventaForm)
// Subida de fotos por ítem del formulario de posventa (máx. 15 por ítem)
router.post('/posventa/form/items/:itemId/foto', uploadPosventaItemFoto)

export default router
/**
 * Rutas para Templates de Casa
 * Sistema profesional de gestión de tipos de vivienda
 */

import express from 'express'
import { verifyToken, requireAdmin } from '../middleware/auth.js'
import {
  getTemplates,
  getTemplateById,
  createNewTemplate,
  createTemplateFull,
  updateTemplateById,
  deleteTemplateById,
  addHabitacion,
  updateHabitacionById,
  deleteHabitacionById,
  addFormItem,
  updateFormItemById,
  deleteFormItemById
} from '../controllers/casaTemplateController.js'

const router = express.Router()

// Middleware: todas las rutas requieren autenticación y rol admin
router.use(verifyToken)
router.use(requireAdmin)

// ==================== GESTIÓN DE TEMPLATES ====================
router.get('/', getTemplates)                    // GET /api/admin/templates
router.get('/:id', getTemplateById)              // GET /api/admin/templates/1
router.post('/', createNewTemplate)              // POST /api/admin/templates
// Crear template completo con habitaciones e items
router.post('/full', createTemplateFull)        // POST /api/admin/templates/full
router.put('/:id', updateTemplateById)           // PUT /api/admin/templates/1
router.delete('/:id', deleteTemplateById)        // DELETE /api/admin/templates/1

// ==================== GESTIÓN DE HABITACIONES ====================
router.post('/:templateId/habitaciones', addHabitacion)                // POST /api/admin/templates/1/habitaciones
router.put('/habitaciones/:habitacionId', updateHabitacionById)        // PUT /api/admin/templates/habitaciones/1
router.delete('/habitaciones/:habitacionId', deleteHabitacionById)     // DELETE /api/admin/templates/habitaciones/1

// ==================== GESTIÓN DE ITEMS DE FORMULARIO ====================
router.post('/habitaciones/:habitacionId/items', addFormItem)          // POST /api/admin/templates/habitaciones/1/items
router.put('/items/:itemId', updateFormItemById)                       // PUT /api/admin/templates/items/1
router.delete('/items/:itemId', deleteFormItemById)                    // DELETE /api/admin/templates/items/1

export default router
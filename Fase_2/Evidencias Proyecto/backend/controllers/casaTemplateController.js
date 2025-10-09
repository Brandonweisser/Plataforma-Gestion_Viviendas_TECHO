/**
 * Controlador de Templates de Casa
 * Gestión profesional de tipos de vivienda
 */

import {
  getAllCasaTemplates,
  getCasaTemplateById,
  createCasaTemplate,
  updateCasaTemplate,
  deactivateCasaTemplate,
  addHabitacionToTemplate,
  updateHabitacion,
  deleteHabitacion,
  addFormItemToHabitacion,
  updateFormItem,
  deleteFormItem
} from '../models/CasaTemplate.js'

// ==================== GESTIÓN DE TEMPLATES ====================

/**
 * Obtiene todos los templates de casa
 */
export async function getTemplates(req, res) {
  try {
    const templates = await getAllCasaTemplates()
    res.json({ success: true, data: templates })
  } catch (error) {
    console.error('Error listando templates:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error listando templates de casa' 
    })
  }
}

/**
 * Obtiene un template específico
 */
export async function getTemplateById(req, res) {
  try {
    const { id } = req.params
    const template = await getCasaTemplateById(parseInt(id))
    res.json({ success: true, data: template })
  } catch (error) {
    console.error('Error obteniendo template:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error obteniendo template' 
    })
  }
}

/**
 * Crea un nuevo template de casa
 */
export async function createNewTemplate(req, res) {
  try {
    const { nombre, descripcion, metros_totales, numero_habitaciones, numero_banos } = req.body

    if (!nombre || !metros_totales || !numero_habitaciones || !numero_banos) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nombre, metros totales, número de habitaciones y baños son obligatorios' 
      })
    }

    const templateData = {
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || '',
      metros_totales: parseFloat(metros_totales),
      numero_habitaciones: parseInt(numero_habitaciones),
      numero_banos: parseInt(numero_banos)
    }

    const created = await createCasaTemplate(templateData)
    res.status(201).json({ success: true, data: created })
  } catch (error) {
    console.error('Error creando template:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message.includes('duplicate') ? 'Ya existe un template con ese nombre' : 'Error creando template' 
    })
  }
}

/**
 * Actualiza un template existente
 */
export async function updateTemplateById(req, res) {
  try {
    const { id } = req.params
    const { nombre, descripcion, metros_totales, numero_habitaciones, numero_banos } = req.body

    const templateData = {
      nombre: nombre?.trim(),
      descripcion: descripcion?.trim(),
      metros_totales: metros_totales ? parseFloat(metros_totales) : undefined,
      numero_habitaciones: numero_habitaciones ? parseInt(numero_habitaciones) : undefined,
      numero_banos: numero_banos ? parseInt(numero_banos) : undefined
    }

    // Remover campos undefined
    Object.keys(templateData).forEach(key => 
      templateData[key] === undefined && delete templateData[key]
    )

    const updated = await updateCasaTemplate(parseInt(id), templateData)
    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error actualizando template:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error actualizando template' 
    })
  }
}

/**
 * Desactiva un template
 */
export async function deleteTemplateById(req, res) {
  try {
    const { id } = req.params
    await deactivateCasaTemplate(parseInt(id))
    res.json({ success: true, message: 'Template desactivado exitosamente' })
  } catch (error) {
    console.error('Error desactivando template:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error desactivando template' 
    })
  }
}

// ==================== GESTIÓN DE HABITACIONES ====================

/**
 * Agrega una habitación a un template
 */
export async function addHabitacion(req, res) {
  try {
    const { templateId } = req.params
    const { nombre_habitacion, metros_cuadrados, tipo_habitacion, orden, caracteristicas_especiales } = req.body

    if (!nombre_habitacion || !metros_cuadrados || !tipo_habitacion) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nombre, metros cuadrados y tipo de habitación son obligatorios' 
      })
    }

    const habitacionData = {
      nombre_habitacion: nombre_habitacion.trim(),
      metros_cuadrados: parseFloat(metros_cuadrados),
      tipo_habitacion: tipo_habitacion.trim(),
      orden: orden || 1,
      caracteristicas_especiales: caracteristicas_especiales || {}
    }

    const created = await addHabitacionToTemplate(parseInt(templateId), habitacionData)
    res.status(201).json({ success: true, data: created })
  } catch (error) {
    console.error('Error agregando habitación:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error agregando habitación' 
    })
  }
}

/**
 * Actualiza una habitación
 */
export async function updateHabitacionById(req, res) {
  try {
    const { habitacionId } = req.params
    const habitacionData = req.body

    const updated = await updateHabitacion(parseInt(habitacionId), habitacionData)
    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error actualizando habitación:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error actualizando habitación' 
    })
  }
}

/**
 * Elimina una habitación
 */
export async function deleteHabitacionById(req, res) {
  try {
    const { habitacionId } = req.params
    await deleteHabitacion(parseInt(habitacionId))
    res.json({ success: true, message: 'Habitación eliminada exitosamente' })
  } catch (error) {
    console.error('Error eliminando habitación:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error eliminando habitación' 
    })
  }
}

// ==================== GESTIÓN DE ITEMS DE FORMULARIO ====================

/**
 * Agrega un item de formulario a una habitación
 */
export async function addFormItem(req, res) {
  try {
    const { habitacionId } = req.params
    const { nombre_item, tipo_input, opciones, obligatorio, categoria, orden } = req.body

    if (!nombre_item || !tipo_input) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nombre del item y tipo de input son obligatorios' 
      })
    }

    const itemData = {
      nombre_item: nombre_item.trim(),
      tipo_input: tipo_input.trim(),
      opciones: opciones || [],
      obligatorio: obligatorio !== false,
      categoria: categoria?.trim() || 'general',
      orden: orden || 1
    }

    const created = await addFormItemToHabitacion(parseInt(habitacionId), itemData)
    res.status(201).json({ success: true, data: created })
  } catch (error) {
    console.error('Error agregando item de formulario:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error agregando item de formulario' 
    })
  }
}

/**
 * Actualiza un item de formulario
 */
export async function updateFormItemById(req, res) {
  try {
    const { itemId } = req.params
    const itemData = req.body

    const updated = await updateFormItem(parseInt(itemId), itemData)
    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error actualizando item de formulario:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error actualizando item de formulario' 
    })
  }
}

/**
 * Elimina un item de formulario
 */
export async function deleteFormItemById(req, res) {
  try {
    const { itemId } = req.params
    await deleteFormItem(parseInt(itemId))
    res.json({ success: true, message: 'Item de formulario eliminado exitosamente' })
  } catch (error) {
    console.error('Error eliminando item de formulario:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error eliminando item de formulario' 
    })
  }
}

/**
 * Crea un template completo con habitaciones e items en una sola operación
 */
export async function createTemplateFull(req, res) {
  try {
    const { template, habitaciones } = req.body || {}

    if (!template || !template.nombre) {
      return res.status(400).json({ success: false, message: 'Datos del template incompletos' })
    }
    if (!Array.isArray(habitaciones) || habitaciones.length === 0) {
      return res.status(400).json({ success: false, message: 'Debe incluir al menos una habitación' })
    }

    // Normalizar números
    const tpl = {
      nombre: String(template.nombre).trim(),
      descripcion: (template.descripcion || '').toString().trim(),
      metros_totales: parseFloat(template.metros_totales),
      numero_habitaciones: parseInt(template.numero_habitaciones || habitaciones.length),
      numero_banos: parseInt(template.numero_banos || 1)
    }

    // Defer to model which orchestrates creation
    const { createCasaTemplateFull, getCasaTemplateById } = await import('../models/CasaTemplate.js')
    const createdId = await createCasaTemplateFull(tpl, habitaciones)
    const full = await getCasaTemplateById(createdId)
    res.status(201).json({ success: true, data: full })
  } catch (error) {
    console.error('Error creando template completo:', error)
    res.status(500).json({ success: false, message: error.message || 'Error creando template completo' })
  }
}
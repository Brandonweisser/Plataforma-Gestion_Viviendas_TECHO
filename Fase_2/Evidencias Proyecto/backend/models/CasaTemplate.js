/**
 * Modelo de Templates de Casa
 * Sistema profesional para gestión de tipos de vivienda
 */

import { supabase } from '../supabaseClient.js'

/**
 * Obtiene todos los templates de casa activos
 */
export async function getAllCasaTemplates() {
  const { data, error } = await supabase
    .from('casa_templates')
    .select(`
      *,
      habitaciones:casa_template_habitaciones(
        id,
        nombre_habitacion,
        metros_cuadrados,
        tipo_habitacion,
        orden,
        caracteristicas_especiales,
        form_items:habitacion_form_items(
          id,
          nombre_item,
          tipo_input,
          opciones,
          obligatorio,
          categoria,
          orden
        )
      )
    `)
    .eq('activo', true)
    .order('nombre')
    .order('orden', { foreignTable: 'casa_template_habitaciones' })
    .order('orden', { foreignTable: 'casa_template_habitaciones.habitacion_form_items' })
    
  if (error) throw error
  return data || []
}

/**
 * Obtiene un template específico con todas sus habitaciones y formularios
 */
export async function getCasaTemplateById(id) {
  const { data, error } = await supabase
    .from('casa_templates')
    .select(`
      *,
      habitaciones:casa_template_habitaciones(
        id,
        nombre_habitacion,
        metros_cuadrados,
        tipo_habitacion,
        orden,
        caracteristicas_especiales,
        form_items:habitacion_form_items(
          id,
          nombre_item,
          tipo_input,
          opciones,
          obligatorio,
          categoria,
          orden
        )
      )
    `)
    .eq('id', id)
    .single()
    
  if (error) throw error
  return data
}

/**
 * Crea un nuevo template de casa
 */
export async function createCasaTemplate(templateData) {
  const { data, error } = await supabase
    .from('casa_templates')
    .insert({
      nombre: templateData.nombre,
      descripcion: templateData.descripcion,
      metros_totales: templateData.metros_totales,
      numero_habitaciones: templateData.numero_habitaciones,
      numero_banos: templateData.numero_banos
    })
    .select()
    .single()
    
  if (error) throw error
  return data
}

/**
 * Actualiza un template existente
 */
export async function updateCasaTemplate(id, templateData) {
  const { data, error } = await supabase
    .from('casa_templates')
    .update({
      nombre: templateData.nombre,
      descripcion: templateData.descripcion,
      metros_totales: templateData.metros_totales,
      numero_habitaciones: templateData.numero_habitaciones,
      numero_banos: templateData.numero_banos,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
    
  if (error) throw error
  return data
}

/**
 * Desactiva un template (no elimina para mantener integridad referencial)
 */
export async function deactivateCasaTemplate(id) {
  const { data, error } = await supabase
    .from('casa_templates')
    .update({ activo: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
    
  if (error) throw error
  return data
}

/**
 * Agrega una habitación a un template
 */
export async function addHabitacionToTemplate(templateId, habitacionData) {
  const { data, error } = await supabase
    .from('casa_template_habitaciones')
    .insert({
      template_id: templateId,
      nombre_habitacion: habitacionData.nombre_habitacion,
      metros_cuadrados: habitacionData.metros_cuadrados,
      tipo_habitacion: habitacionData.tipo_habitacion,
      orden: habitacionData.orden || 1,
      caracteristicas_especiales: habitacionData.caracteristicas_especiales || {}
    })
    .select()
    .single()
    
  if (error) throw error
  return data
}

/**
 * Actualiza una habitación
 */
export async function updateHabitacion(habitacionId, habitacionData) {
  const { data, error } = await supabase
    .from('casa_template_habitaciones')
    .update({
      nombre_habitacion: habitacionData.nombre_habitacion,
      metros_cuadrados: habitacionData.metros_cuadrados,
      tipo_habitacion: habitacionData.tipo_habitacion,
      orden: habitacionData.orden,
      caracteristicas_especiales: habitacionData.caracteristicas_especiales
    })
    .eq('id', habitacionId)
    .select()
    .single()
    
  if (error) throw error
  return data
}

/**
 * Elimina una habitación
 */
export async function deleteHabitacion(habitacionId) {
  const { error } = await supabase
    .from('casa_template_habitaciones')
    .delete()
    .eq('id', habitacionId)
    
  if (error) throw error
  return { success: true }
}

/**
 * Agrega un item de formulario a una habitación
 */
export async function addFormItemToHabitacion(habitacionId, itemData) {
  const { data, error } = await supabase
    .from('habitacion_form_items')
    .insert({
      template_habitacion_id: habitacionId,
      nombre_item: itemData.nombre_item,
      tipo_input: itemData.tipo_input,
      opciones: itemData.opciones || [],
      obligatorio: itemData.obligatorio !== false,
      categoria: itemData.categoria,
      orden: itemData.orden || 1
    })
    .select()
    .single()
    
  if (error) throw error
  return data
}

/**
 * Actualiza un item de formulario
 */
export async function updateFormItem(itemId, itemData) {
  const { data, error } = await supabase
    .from('habitacion_form_items')
    .update({
      nombre_item: itemData.nombre_item,
      tipo_input: itemData.tipo_input,
      opciones: itemData.opciones,
      obligatorio: itemData.obligatorio,
      categoria: itemData.categoria,
      orden: itemData.orden
    })
    .eq('id', itemId)
    .select()
    .single()
    
  if (error) throw error
  return data
}

/**
 * Elimina un item de formulario
 */
export async function deleteFormItem(itemId) {
  const { error } = await supabase
    .from('habitacion_form_items')
    .delete()
    .eq('id', itemId)
    
  if (error) throw error
  return { success: true }
}

/**
 * Crea un template completo con sus habitaciones e items.
 * Nota: Supabase JS no soporta transacciones multi-statement desde el cliente.
 * Este método realizará inserciones secuenciales; si falla a mitad, dejará datos parciales.
 * Recomendado: crear una RPC en Postgres para transaccionalidad. Mientras tanto, manejamos errores y devolvemos detalles.
 */
export async function createCasaTemplateFull(templateData, habitaciones) {
  // 1) Crear template base
  const tpl = await createCasaTemplate(templateData)

  // 2) Crear habitaciones secuencialmente
  for (let i = 0; i < habitaciones.length; i++) {
    const h = habitaciones[i]
    const hab = await addHabitacionToTemplate(tpl.id, {
      nombre_habitacion: h.nombre_habitacion,
      metros_cuadrados: parseFloat(h.metros_cuadrados),
      tipo_habitacion: h.tipo_habitacion,
      orden: h.orden || (i + 1),
      caracteristicas_especiales: h.caracteristicas_especiales || {}
    })

    // 3) Crear items si existen
    if (Array.isArray(h.items) && h.items.length) {
      for (let j = 0; j < h.items.length; j++) {
        const it = h.items[j]
        await addFormItemToHabitacion(hab.id, {
          nombre_item: it.nombre_item,
          tipo_input: it.tipo_input || 'select',
          opciones: Array.isArray(it.opciones) ? it.opciones : [],
          obligatorio: it.obligatorio !== false,
          categoria: it.categoria || 'general',
          orden: it.orden || (j + 1)
        })
      }
    }
  }

  return tpl.id
}
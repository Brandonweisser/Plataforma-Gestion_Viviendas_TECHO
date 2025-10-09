/**
 * Controlador de Beneficiario
 * Plataforma de Gestión de Viviendas TECHO
 * 
 * Maneja las operaciones específicas para usuarios beneficiarios
 */

import { supabase } from '../supabaseClient.js'
import { getHousingsByBeneficiary } from '../models/Housing.js'
import { getIncidencesByBeneficiary, createIncidence, computePriority, logIncidenciaEvent } from '../models/Incidence.js'
import multer from 'multer'
import { listMediaForIncidencias, uploadIncidenciaMedia } from '../services/MediaService.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

/**
 * Health check para rutas de beneficiario
 */
export async function beneficiaryHealth(req, res) {
  res.json({ 
    success: true, 
    area: 'beneficiario', 
    status: 'ok' 
  })
}

/**
 * Obtiene la vivienda asignada al beneficiario con información relevante
 */
export async function getMyHousing(req, res) {
  try {
    const beneficiarioUid = req.user?.uid || req.user?.sub
    
    if (!beneficiarioUid) {
      return res.status(401).json({ 
        success: false, 
        message: 'No autenticado' 
      })
    }

    // Obtener vivienda del beneficiario
    const { data: vivienda, error: errorVivienda } = await supabase
      .from('viviendas')
      .select(`
        id_vivienda,
        id_proyecto,
        direccion,
        estado,
        beneficiario_uid,
        proyecto(id_proyecto, nombre, ubicacion)
      `)
      .eq('beneficiario_uid', beneficiarioUid)
      .maybeSingle()
      
    if (errorVivienda) throw errorVivienda
    
    if (!vivienda) {
      return res.status(404).json({ 
        success: false, 
        message: 'No tienes una vivienda asignada' 
      })
    }

    // Verificar si existe una recepción activa (borrador/enviada)
    const { data: recepcionActiva, error: errorRecepcion } = await supabase
      .from('vivienda_recepcion')
      .select('id, estado, fecha_creada, fecha_enviada, observaciones_count')
      .eq('id_vivienda', vivienda.id_vivienda)
      .in('estado', ['borrador', 'enviada'])
      .order('id', { ascending: false })
      .limit(1)
      
    if (errorRecepcion) throw errorRecepcion

    const recepcionActual = Array.isArray(recepcionActiva) && recepcionActiva.length 
      ? recepcionActiva[0] 
      : null

    // Verificar si puede crear incidencias
    let puedeCrearIncidencias = false
    
    if (recepcionActual && recepcionActual.estado === 'enviada') {
      puedeCrearIncidencias = true
    } else {
      // Verificar si existe alguna recepción revisada históricamente
      const { data: recepcionRevisada, error: errorRevisada } = await supabase
        .from('vivienda_recepcion')
        .select('id')
        .eq('id_vivienda', vivienda.id_vivienda)
        .eq('estado', 'revisada')
        .limit(1)
        
      if (errorRevisada) throw errorRevisada
      puedeCrearIncidencias = Array.isArray(recepcionRevisada) && recepcionRevisada.length > 0
    }

    return res.json({
      success: true,
      data: {
        vivienda,
        proyecto: vivienda.proyecto,
        recepcion_activa: recepcionActual,
        flags: {
          tiene_recepcion_activa: !!recepcionActual,
          puede_incidencias: puedeCrearIncidencias
        }
      }
    })
    
  } catch (error) {
    console.error('Error al obtener vivienda del beneficiario:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Error al obtener la vivienda' 
    })
  }
}

/**
 * Obtiene el resumen de recepción de la vivienda del beneficiario
 */
export async function getMyReception(req, res) {
  try {
    const beneficiarioUid = req.user?.uid || req.user?.sub
    
    // Obtener vivienda del beneficiario
    const { data: vivienda, error: errorVivienda } = await supabase
      .from('viviendas')
      .select('id_vivienda')
      .eq('beneficiario_uid', beneficiarioUid)
      .maybeSingle()
      
    if (errorVivienda) throw errorVivienda
    
    if (!vivienda) {
      return res.status(404).json({ 
        success: false, 
        message: 'No tienes una vivienda asignada' 
      })
    }

    // Obtener resumen de recepción desde la vista
    const { data: resumen, error: errorResumen } = await supabase
      .from('vista_recepcion_resumen')
      .select('*')
      .eq('id_vivienda', vivienda.id_vivienda)
      .order('id', { ascending: false })
      .limit(1)
      
    if (errorResumen) throw errorResumen

    const recepcionResumen = Array.isArray(resumen) && resumen.length 
      ? resumen[0] 
      : null

    if (!recepcionResumen) {
      return res.json({
        success: true,
        data: {
          tiene_recepcion: false,
          resumen: null
        }
      })
    }

    return res.json({
      success: true,
      data: {
        tiene_recepcion: true,
        resumen: recepcionResumen
      }
    })
    
  } catch (error) {
    console.error('Error al obtener resumen de recepción:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Error al obtener el resumen de recepción' 
    })
  }
}

/**
 * Obtiene las incidencias del beneficiario
 */
export async function getMyIncidences(req, res) {
  try {
  const beneficiarioUid = req.user?.uid || req.user?.sub
    
    const role = req.user?.rol || req.user?.role
  const { limit = 50, offset = 0, estado, categoria, prioridad, search, includeMedia } = req.query || {}

    const l = Math.max(1, parseInt(limit))
    const o = Math.max(0, parseInt(offset))

    // Construir query base
    let query = supabase
      .from('incidencias')
      .select(`
        *,
        viviendas(id_vivienda, direccion, proyecto(nombre))
      `, { count: 'exact' })
      .order('fecha_reporte', { ascending: false })

    if (role !== 'administrador') {
      query = query.eq('id_usuario_reporta', beneficiarioUid)
    }
    if (estado) query = query.eq('estado', estado)
    if (categoria) query = query.eq('categoria', categoria)
    if (prioridad) query = query.eq('prioridad', prioridad)
    if (search) query = query.ilike('descripcion', `%${search}%`)

    // Paginación
    query = query.range(o, o + l - 1)

    const { data, error, count } = await query
    if (error) throw error
    let items = data || []

    if (includeMedia && items.length) {
      const grouped = await listMediaForIncidencias(items.map(i => i.id_incidencia))
      items = items.map(i => ({ ...i, media: grouped[i.id_incidencia] || [] }))
    }

    return res.json({
      success: true,
      data: items,
      meta: { total: count ?? items.length, limit: l, offset: o, hasMore: typeof count === 'number' ? (o + items.length) < count : false }
    })
    
  } catch (error) {
    console.error('Error al obtener incidencias del beneficiario:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Error al obtener las incidencias' 
    })
  }
}

/**
 * Crea una nueva incidencia
 */
export async function createNewIncidence(req, res) {
  try {
    const beneficiarioUid = req.user?.uid || req.user?.sub
    const { categoria, descripcion, ubicacion_especifica } = req.body || {}
    
    if (!categoria || !descripcion) {
      return res.status(400).json({ 
        success: false, 
        message: 'Categoría y descripción son obligatorias' 
      })
    }

    // Verificar que el beneficiario tenga una vivienda asignada
    const { data: vivienda, error: errorVivienda } = await supabase
      .from('viviendas')
      .select('id_vivienda')
      .eq('beneficiario_uid', beneficiarioUid)
      .maybeSingle()
      
    if (errorVivienda) throw errorVivienda
    
    if (!vivienda) {
      return res.status(404).json({ 
        success: false, 
        message: 'No tienes una vivienda asignada' 
      })
    }

    // Calcular prioridad automáticamente
    const prioridad = computePriority(categoria, descripcion)

    // Crear la incidencia
    const incidenciaData = {
      id_vivienda: vivienda.id_vivienda,
      id_usuario_reporta: beneficiarioUid,
      categoria,
      descripcion,
      prioridad,
      estado: 'abierta',
      ubicacion_especifica: ubicacion_especifica || null,
      fecha_reporte: new Date().toISOString()
    }

    const nuevaIncidencia = await createIncidence(incidenciaData)

    // Registrar evento en historial
    await logIncidenciaEvent({
      incidenciaId: nuevaIncidencia.id_incidencia,
      actorUid: beneficiarioUid,
      actorRol: 'beneficiario',
      tipo: 'creacion',
      estadoNuevo: 'abierta',
      comentario: 'Incidencia creada por beneficiario'
    })

    return res.status(201).json({
      success: true,
      data: nuevaIncidencia,
      message: 'Incidencia creada exitosamente'
    })
    
  } catch (error) {
    console.error('Error al crear incidencia:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Error al crear la incidencia' 
    })
  }
}

/**
 * Obtiene el detalle de una incidencia específica del beneficiario
 */
export async function getIncidenceDetail(req, res) {
  try {
    const beneficiarioUid = req.user?.uid || req.user?.sub
    const incidenciaId = Number(req.params.id)

    // Verificar que la incidencia pertenezca al beneficiario
    const { data: incidencia, error: errorIncidencia } = await supabase
      .from('incidencias')
      .select(`
        *,
        viviendas(id_vivienda, direccion, proyecto(nombre, ubicacion)),
        tecnico:usuarios!id_usuario_tecnico(nombre, email)
      `)
      .eq('id_incidencia', incidenciaId)
      .eq('id_usuario_reporta', beneficiarioUid)
      .single()
      
    if (errorIncidencia) {
      if (errorIncidencia.code === 'PGRST116') {
        return res.status(404).json({ 
          success: false, 
          message: 'Incidencia no encontrada' 
        })
      }
      throw errorIncidencia
    }

    // Obtener historial de la incidencia
    const { data: historial, error: errorHistorial } = await supabase
      .from('incidencia_historial')
      .select('*')
      .eq('incidencia_id', incidenciaId)
      .order('created_at', { ascending: true })
      
    if (errorHistorial) throw errorHistorial

    const mediaBy = await listMediaForIncidencias([incidenciaId])
    return res.json({
      success: true,
      data: {
        ...incidencia,
        media: mediaBy[incidenciaId] || [],
        historial: historial || []
      }
    })
    
  } catch (error) {
    console.error('Error al obtener detalle de incidencia:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Error al obtener el detalle de la incidencia' 
    })
  }
}

function runMulter(req, res) {
  return new Promise((resolve, reject) => {
    upload.array('files')(req, res, (err) => (err ? reject(err) : resolve()))
  })
}

export async function uploadIncidenceMedia(req, res) {
  try {
    const beneficiarioUid = req.user?.uid || req.user?.sub
    const incidenciaId = Number(req.params.id)
    await runMulter(req, res)
    const files = req.files || []
    if (!files.length) return res.status(400).json({ success:false, message:'No hay archivos' })
    const results = []
    for (const f of files) {
      const saved = await uploadIncidenciaMedia(incidenciaId, f, beneficiarioUid)
      results.push(saved)
    }
    await logIncidenciaEvent({ incidenciaId, actorUid: beneficiarioUid, actorRol: 'beneficiario', tipo: 'media_agregada', comentario: `${files.length} archivo(s)` })
    return res.status(201).json({ success:true, data: results })
  } catch (error) {
    console.error('Error al subir media (beneficiario):', error)
    return res.status(500).json({ success:false, message:'Error subiendo media' })
  }
}

export async function listIncidenceMedia(req, res) {
  try {
    const incidenciaId = Number(req.params.id)
    const by = await listMediaForIncidencias([incidenciaId])
    return res.json({ success:true, data: by[incidenciaId] || [] })
  } catch (error) {
    console.error('Error listando media:', error)
    return res.status(500).json({ success:false, message:'Error al listar media' })
  }
}

export async function getIncidenceHistory(req, res) {
  try {
    const incidenciaId = Number(req.params.id)
    const { data, error } = await supabase
      .from('incidencia_historial')
      .select('*')
      .eq('incidencia_id', incidenciaId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return res.json({ success:true, data: data || [] })
  } catch (error) {
    console.error('Error obteniendo historial:', error)
    return res.status(500).json({ success:false, message:'Error al obtener historial' })
  }
}

/**
 * Controlador de Técnico
 * Plataforma de Gestión de Viviendas TECHO
 * 
 * Maneja las operaciones específicas para usuarios técnicos
 */

import { supabase } from '../supabaseClient.js'
import { getAllIncidences, updateIncidence, logIncidenciaEvent } from '../models/Incidence.js'
import multer from 'multer'
import { listMediaForIncidencias, uploadIncidenciaMedia } from '../services/MediaService.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

/**
 * Health check para rutas de técnico
 */
export async function technicianHealth(req, res) {
  res.json({ 
    success: true, 
    area: 'tecnico', 
    status: 'ok' 
  })
}

/**
 * Obtiene todas las incidencias asignadas al técnico o todas si es admin
 */
export async function getIncidences(req, res) {
  try {
    const tecnicoUid = req.user?.uid || req.user?.sub
    const userRole = req.user?.rol || req.user?.role
    const { includeMedia } = req.query || {}
    
    let incidencias

    if (userRole === 'administrador') {
      // Los admins pueden ver todas las incidencias
      incidencias = await getAllIncidences()
    } else {
      // Los técnicos solo ven las asignadas a ellos
      const { data, error } = await supabase
        .from('incidencias')
        .select(`
          *,
          viviendas(id_vivienda, direccion, proyecto(nombre, ubicacion)),
          reporta:usuarios!incidencias_id_usuario_reporta_fkey(nombre, email)
        `)
        .eq('id_usuario_tecnico', tecnicoUid)
        .order('fecha_reporte', { ascending: false })
        
      if (error) throw error
      incidencias = data || []
    }

    if (includeMedia && incidencias.length) {
      const byId = await listMediaForIncidencias(incidencias.map(i => i.id_incidencia))
      incidencias = incidencias.map(i => ({ ...i, media: byId[i.id_incidencia] || [] }))
    }

    return res.json({
      success: true,
      data: incidencias
    })
    
  } catch (error) {
    console.error('Error al obtener incidencias para técnico:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Error al obtener las incidencias' 
    })
  }
}

/**
 * Obtiene detalle de una incidencia específica
 */
export async function getIncidenceDetail(req, res) {
  try {
    const incidenciaId = Number(req.params.id)
    const tecnicoUid = req.user?.uid || req.user?.sub
    const userRole = req.user?.rol || req.user?.role

    let whereClause = { id_incidencia: incidenciaId }
    
    // Si no es admin, solo puede ver incidencias asignadas a él
    if (userRole !== 'administrador') {
      whereClause.id_usuario_tecnico = tecnicoUid
    }

    const { data: incidencia, error: errorIncidencia } = await supabase
      .from('incidencias')
      .select(`
  *,
  viviendas(id_vivienda, direccion, proyecto(nombre, ubicacion)),
  reporta:usuarios!incidencias_id_usuario_reporta_fkey(nombre, email),
  tecnico:usuarios!incidencias_id_usuario_tecnico_fkey(nombre, email)
      `)
      .match(whereClause)
      .single()
      
    if (errorIncidencia) {
      if (errorIncidencia.code === 'PGRST116') {
        return res.status(404).json({ 
          success: false, 
          message: 'Incidencia no encontrada o no tienes acceso' 
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

    // Media asociada
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

// Middleware wrapper para usar multer dentro de controladores exportados
function runMulter(req, res) {
  return new Promise((resolve, reject) => {
    upload.single('file')(req, res, (err) => (err ? reject(err) : resolve()))
  })
}

export async function uploadIncidenceMedia(req, res) {
  try {
    await runMulter(req, res)
    const incidenciaId = Number(req.params.id)
    const uploader = req.user?.uid || req.user?.sub
    if (!req.file) return res.status(400).json({ success:false, message:'Archivo requerido' })
    const saved = await uploadIncidenciaMedia(incidenciaId, req.file, uploader)
    await logIncidenciaEvent({ incidenciaId, actorUid: uploader, actorRol: req.user?.rol || req.user?.role, tipo: 'media_agregada', comentario: `Archivo ${req.file.originalname}` })
    return res.status(201).json({ success:true, data: saved })
  } catch (error) {
    console.error('Error al subir media de incidencia:', error)
    return res.status(500).json({ success:false, message:'Error subiendo media' })
  }
}

export async function listIncidenceMedia(req, res) {
  try {
    const incidenciaId = Number(req.params.id)
    const byId = await listMediaForIncidencias([incidenciaId])
    return res.json({ success:true, data: byId[incidenciaId] || [] })
  } catch (error) {
    console.error('Error listando media:', error)
    return res.status(500).json({ success:false, message:'Error al listar media' })
  }
}

/**
 * Actualiza el estado de una incidencia
 */
export async function updateIncidenceStatus(req, res) {
  try {
    const incidenciaId = Number(req.params.id)
    const tecnicoUid = req.user?.uid || req.user?.sub
    const userRole = req.user?.rol || req.user?.role
    const { estado, comentario } = req.body || {}

    if (!estado) {
      return res.status(400).json({ 
        success: false, 
        message: 'El estado es obligatorio' 
      })
    }

    // Validar estados permitidos
    const estadosValidos = ['abierta', 'en_proceso', 'resuelta', 'cerrada']
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Estado no válido' 
      })
    }

    // Obtener incidencia actual
    let whereClause = { id_incidencia: incidenciaId }
    if (userRole !== 'administrador') {
      whereClause.id_usuario_tecnico = tecnicoUid
    }

    const { data: incidenciaActual, error: errorActual } = await supabase
      .from('incidencias')
      .select('estado, id_usuario_tecnico')
      .match(whereClause)
      .single()
      
    if (errorActual) {
      if (errorActual.code === 'PGRST116') {
        return res.status(404).json({ 
          success: false, 
          message: 'Incidencia no encontrada o no tienes acceso' 
        })
      }
      throw errorActual
    }

    const estadoAnterior = incidenciaActual.estado

    // Actualizar incidencia
    const updates = { 
      estado,
      fecha_actualizacion: new Date().toISOString()
    }

    // Si se resuelve o cierra, registrar fecha
    if (estado === 'resuelta' || estado === 'cerrada') {
      updates.fecha_resolucion = new Date().toISOString()
    }

    const incidenciaActualizada = await updateIncidence(incidenciaId, updates)

    // Registrar evento en historial
    await logIncidenciaEvent({
      incidenciaId,
      actorUid: tecnicoUid,
      actorRol: userRole,
      tipo: 'cambio_estado',
      estadoAnterior,
      estadoNuevo: estado,
      comentario: comentario || `Estado cambiado de ${estadoAnterior} a ${estado}`
    })

    return res.json({
      success: true,
      data: incidenciaActualizada,
      message: `Estado actualizado a ${estado}`
    })
    
  } catch (error) {
    console.error('Error al actualizar estado de incidencia:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar el estado de la incidencia' 
    })
  }
}

/**
 * Asigna una incidencia al técnico actual (solo para admins)
 */
export async function assignIncidenceToMe(req, res) {
  try {
    const incidenciaId = Number(req.params.id)
    const tecnicoUid = req.user?.uid || req.user?.sub
    const userRole = req.user?.rol || req.user?.role

    // Solo admins pueden asignar incidencias
    if (userRole !== 'administrador') {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permisos para asignar incidencias' 
      })
    }

    // Actualizar incidencia con el técnico asignado
    const updates = {
      id_usuario_tecnico: tecnicoUid,
      estado: 'en_proceso',
      fecha_actualizacion: new Date().toISOString()
    }

    const incidenciaActualizada = await updateIncidence(incidenciaId, updates)

    // Registrar evento en historial
    await logIncidenciaEvent({
      incidenciaId,
      actorUid: tecnicoUid,
      actorRol: userRole,
      tipo: 'asignacion',
      estadoNuevo: 'en_proceso',
      comentario: 'Incidencia asignada y puesta en proceso'
    })

    return res.json({
      success: true,
      data: incidenciaActualizada,
      message: 'Incidencia asignada exitosamente'
    })
    
  } catch (error) {
    console.error('Error al asignar incidencia:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Error al asignar la incidencia' 
    })
  }
}

/**
 * Obtiene estadísticas de incidencias para el técnico
 */
export async function getTechnicianStats(req, res) {
  try {
    const tecnicoUid = req.user?.uid || req.user?.sub
    const userRole = req.user?.rol || req.user?.role

    let query = supabase.from('incidencias').select('estado, prioridad')
    
    // Si no es admin, filtrar por técnico asignado
    if (userRole !== 'administrador') {
      query = query.eq('id_usuario_tecnico', tecnicoUid)
    }

    const { data: incidencias, error } = await query
    
    if (error) throw error

    // Calcular estadísticas
    const stats = {
      total: incidencias.length,
      por_estado: {},
      por_prioridad: {}
    }

    incidencias.forEach(inc => {
      // Estadísticas por estado
      const estado = inc.estado || 'sin_estado'
      stats.por_estado[estado] = (stats.por_estado[estado] || 0) + 1

      // Estadísticas por prioridad
      const prioridad = inc.prioridad || 'sin_prioridad'
      stats.por_prioridad[prioridad] = (stats.por_prioridad[prioridad] || 0) + 1
    })

    return res.json({
      success: true,
      data: stats
    })
    
  } catch (error) {
    console.error('Error al obtener estadísticas del técnico:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Error al obtener las estadísticas' 
    })
  }
}

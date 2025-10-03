/**
 * Controlador de Técnico
 * Plataforma de Gestión de Viviendas TECHO
 * 
 * Maneja las operaciones específicas para usuarios técnicos
 */

import { supabase } from '../supabaseClient.js'
import { getAllIncidences, updateIncidence, logIncidenciaEvent } from '../models/Incidence.js'

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
          viviendas(numero_vivienda, proyecto(nombre, ubicacion)),
          usuarios!incidencias_id_usuario_beneficiario_fkey(nombre, email)
        `)
        .eq('id_usuario_tecnico', tecnicoUid)
        .order('fecha_creacion', { ascending: false })
        
      if (error) throw error
      incidencias = data || []
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
        viviendas(numero_vivienda, proyecto(nombre, ubicacion)),
        usuarios!incidencias_id_usuario_beneficiario_fkey(nombre, email),
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
      .order('fecha_evento', { ascending: true })
      
    if (errorHistorial) throw errorHistorial

    return res.json({
      success: true,
      data: {
        incidencia,
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

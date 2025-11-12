/**
 * Controlador de Técnico
 * Plataforma de Gestión de Viviendas TECHO
 * 
 * Maneja las operaciones específicas para usuarios técnicos
 */

import { supabase } from '../supabaseClient.js'
import { calcularEstadoPlazos } from '../utils/plazosLegales.js'
import { listTemplatePlans } from '../services/MediaService.js'
import { getAllIncidences, updateIncidence, logIncidenciaEvent, createIncidence, computePriority } from '../models/Incidence.js'
import { calcularFechasLimite, obtenerGarantiaPorCategoria, calcularVencimientoGarantia, estaGarantiaVigente, computePriorityFromCategory } from '../utils/posventaConfig.js'
import multer from 'multer'
import { listMediaForIncidencias, uploadIncidenciaMedia } from '../services/MediaService.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })
const uploadMultiple = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 5 } })

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
 * - tecnico_campo: SOLO sus incidencias asignadas
 * - tecnico (supervisor): TODAS las incidencias de sus proyectos + puede ver sin asignar
 * - administrador: TODAS las incidencias
 */
export async function getIncidences(req, res) {
  try {
    const tecnicoUid = req.user?.uid || req.user?.sub
    const userRole = req.user?.rol || req.user?.role
  const { includeMedia, asignacion = 'all' } = req.query || {}
    // Filtros opcionales
  const estadoFilterRaw = (req.query?.estado || '').toString().trim()
  const estadosList = estadoFilterRaw ? estadoFilterRaw.split(',').map(s => s.trim()).filter(Boolean) : []
    const categoriaFilter = (req.query?.categoria || '').toString().trim()
    const prioridadFilter = (req.query?.prioridad || '').toString().trim()
    const searchFilter = (req.query?.search || '').toString().trim()
    
    let incidencias

    if (userRole === 'administrador') {
      // Los admins pueden ver todas las incidencias
      incidencias = await getAllIncidences()
    } else if (userRole === 'tecnico_campo') {
      // Técnico de Campo: solo ve sus incidencias asignadas
      let query = supabase
        .from('incidencias')
        .select(`
          *,
          viviendas(id_vivienda, direccion, proyecto(id_proyecto, nombre, ubicacion)),
          reporta:usuarios!incidencias_id_usuario_reporta_fkey(nombre, email, telefono)
        `)
        .eq('id_usuario_tecnico', tecnicoUid)
        .order('fecha_reporte', { ascending: false })
      
      if (estadosList.length === 1) query = query.eq('estado', estadosList[0])
      if (estadosList.length > 1) query = query.in('estado', estadosList)
      if (categoriaFilter) query = query.eq('categoria', categoriaFilter)
      if (prioridadFilter) query = query.eq('prioridad', prioridadFilter)
      if (searchFilter) query = query.ilike('descripcion', `%${searchFilter}%`)
      
      const { data, error } = await query
      if (error) throw error
      incidencias = data || []
    } else {
      // Técnico Supervisor: ver asignadas directamente o por proyectos asignados
      const seeAllAssigned = !asignacion || asignacion === 'all' || asignacion === 'asignadas'
      const seeProjectScoped = !asignacion || asignacion === 'all' || asignacion === 'proyecto'
      const seeUnassigned = asignacion === 'unassigned'

      let results = []

      // Ver incidencias asignadas directamente
      if (seeAllAssigned) {
        let query = supabase
          .from('incidencias')
          .select(`
            *,
            viviendas(id_vivienda, direccion, proyecto(id_proyecto, nombre, ubicacion)),
            reporta:usuarios!incidencias_id_usuario_reporta_fkey(nombre, email)
          `)
          .eq('id_usuario_tecnico', tecnicoUid)
          .order('fecha_reporte', { ascending: false })
        if (estadosList.length === 1) query = query.eq('estado', estadosList[0])
        if (estadosList.length > 1) query = query.in('estado', estadosList)
        if (categoriaFilter) query = query.eq('categoria', categoriaFilter)
        if (prioridadFilter) query = query.eq('prioridad', prioridadFilter)
        if (searchFilter) query = query.ilike('descripcion', `%${searchFilter}%`)
        const { data, error } = await query
        if (error) throw error
        results = results.concat(data || [])
      }

      if (seeProjectScoped || seeUnassigned) {
        // Incidencias de viviendas pertenecientes a proyectos donde el técnico está asignado
        const { data: projects, error: errP } = await supabase
          .from('proyecto_tecnico')
          .select('id_proyecto')
          .eq('tecnico_uid', tecnicoUid)
        if (errP) throw errP
        const projectIds = (projects || []).map(p => p.id_proyecto)
        if (projectIds.length) {
          let query = supabase
            .from('incidencias')
            .select(`
              *,
              viviendas!inner(id_vivienda, direccion, id_proyecto, proyecto(id_proyecto, nombre, ubicacion)),
              reporta:usuarios!incidencias_id_usuario_reporta_fkey(nombre, email, telefono)
            `)
            .in('viviendas.id_proyecto', projectIds)
            .order('fecha_reporte', { ascending: false })
          if (seeUnassigned) {
            query = query.is('id_usuario_tecnico', null)
          }
          if (estadosList.length === 1) query = query.eq('estado', estadosList[0])
          if (estadosList.length > 1) query = query.in('estado', estadosList)
          if (categoriaFilter) query = query.eq('categoria', categoriaFilter)
          if (prioridadFilter) query = query.eq('prioridad', prioridadFilter)
          if (searchFilter) query = query.ilike('descripcion', `%${searchFilter}%`)
          const { data: byProject, error: errIncP } = await query
          if (errIncP) throw errIncP
          results = results.concat(byProject || [])
        }
      }

      // De-duplicar por id_incidencia
      const map = new Map()
      results.forEach(r => { map.set(r.id_incidencia, r) })
      incidencias = Array.from(map.values())

      // Ordenar por prioridad (alta > media > baja) y, a igualdad, por fecha más reciente
      const weight = { alta: 3, media: 2, baja: 1 }
      incidencias.sort((a, b) => {
        const wa = weight[(a.prioridad || '').toLowerCase()] || 0
        const wb = weight[(b.prioridad || '').toLowerCase()] || 0
        if (wb !== wa) return wb - wa
        const da = new Date(a.fecha_reporte).getTime() || 0
        const db = new Date(b.fecha_reporte).getTime() || 0
        return db - da
      })
    }

    if (includeMedia && incidencias.length) {
      const byId = await listMediaForIncidencias(incidencias.map(i => i.id_incidencia))
      incidencias = incidencias.map(i => ({ ...i, media: byId[i.id_incidencia] || [] }))
    }

    // Agregar plazos legales a cada incidencia
    incidencias.forEach(incidencia => {
      try {
        incidencia.plazos_legales = calcularEstadoPlazos(incidencia)
      } catch (err) {
        console.error(`Error calculando plazos para incidencia ${incidencia.id_incidencia}:`, err)
        incidencia.plazos_legales = null
      }
    })

    return res.json({
      success: true,
      data: incidencias,
      meta: { total: incidencias.length }
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
    const { data: incidencia, error: errorIncidencia } = await supabase
      .from('incidencias')
      .select(`
        *,
        viviendas(id_vivienda, direccion, id_proyecto, proyecto(nombre, ubicacion)),
        reporta:usuarios!incidencias_id_usuario_reporta_fkey(nombre, email),
        tecnico:usuarios!incidencias_id_usuario_tecnico_fkey(nombre, email)
      `)
      .eq('id_incidencia', incidenciaId)
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

    if (userRole !== 'administrador') {
      // Permitir si está asignada al técnico o si pertenece a un proyecto del técnico
      const assignedToMe = incidencia.id_usuario_tecnico === tecnicoUid
      if (!assignedToMe) {
        const { data: projects, error: errP } = await supabase
          .from('proyecto_tecnico')
          .select('id_proyecto')
          .eq('tecnico_uid', tecnicoUid)
        if (errP) throw errP
        const projectIds = (projects || []).map(p => p.id_proyecto)
        const incProject = incidencia?.viviendas?.id_proyecto
        if (!projectIds.includes(incProject)) {
          return res.status(403).json({ success:false, message:'No tienes acceso a esta incidencia' })
        }
      }
    }

    // Obtener historial de la incidencia
    const { data: historial, error: errorHistorial } = await supabase
      .from('incidencia_historial')
      .select('*')
      .eq('incidencia_id', incidenciaId)
      .order('created_at', { ascending: true })
      
    if (errorHistorial) throw errorHistorial

    // Enriquecer con información del actor
    if (historial && historial.length > 0) {
      const actorUids = [...new Set(historial.map(h => h.actor_uid).filter(Boolean))]
      if (actorUids.length > 0) {
        const { data: actors } = await supabase
          .from('usuarios')
          .select('uid, nombre, email, rol')
          .in('uid', actorUids)
        
        const actorMap = new Map((actors || []).map(a => [a.uid, a]))
        historial.forEach(h => {
          if (h.actor_uid) {
            h.actor = actorMap.get(h.actor_uid) || null
          }
        })
      }
    }

    // Media asociada
    const mediaBy = await listMediaForIncidencias([incidenciaId])

    // Agregar plazos legales
    let plazos_legales = null
    try {
      plazos_legales = calcularEstadoPlazos(incidencia)
    } catch (err) {
      console.error(`Error calculando plazos para incidencia ${incidenciaId}:`, err)
    }

    return res.json({
      success: true,
      data: {
        ...incidencia,
        media: mediaBy[incidenciaId] || [],
        historial: historial || [],
        plazos_legales
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
 * Estadísticas mensuales para el panel del técnico
 * Query: month=YYYY-MM (opcional; por defecto mes actual segun UTC)
 * Devuelve: { asignadas, pendientes, resueltas }
 * - asignadas: incidencias con id_usuario_tecnico = tecnico y fecha_asignada dentro del mes
 * - pendientes: incidencias en estados 'abierta' o 'en_proceso' dentro de proyectos asignados, con fecha_reporte dentro del mes
 * - resueltas: incidencias con estado 'resuelta' y fecha_resuelta dentro del mes dentro de proyectos asignados
 */
export async function getTechnicianDashboardStats(req, res) {
  try {
    const tecnicoUid = req.user?.uid || req.user?.sub
    const userRole = req.user?.rol || req.user?.role
    const monthStr = (req.query.month || '').toString().trim()

    // Calcular rango de fechas [start, end) del mes
    const now = new Date()
    const [y, m] = monthStr && /^\d{4}-\d{2}$/.test(monthStr)
      ? monthStr.split('-').map(Number)
      : [now.getUTCFullYear(), now.getUTCMonth() + 1]
    const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0))
    const end = new Date(Date.UTC(y, m, 1, 0, 0, 0)) // primer día del mes siguiente

    // Determinar proyectos válidos (si no es admin)
    let projectIds = []
    if (userRole !== 'administrador') {
      const { data: projects, error: errP } = await supabase
        .from('proyecto_tecnico')
        .select('id_proyecto')
        .eq('tecnico_uid', tecnicoUid)
      if (errP) throw errP
      projectIds = (projects || []).map(p => p.id_proyecto)
      if (!projectIds.length) {
        return res.json({ success:true, data: { asignadas: 0, pendientes: 0, resueltas: 0 }, meta: { month: `${y}-${String(m).padStart(2,'0')}` } })
      }
    }

    // 1) Total de incidencias activas en proyectos del técnico (no finalizadas)
    // Para supervisores: todas las incidencias abiertas de sus proyectos
    let qAsignadas = supabase
      .from('incidencias')
      .select('id_incidencia, estado, viviendas!inner(id_proyecto)')
      .not('estado', 'in', '(cerrada,descartada,cancelada)')
    if (userRole !== 'administrador') {
      qAsignadas = qAsignadas.in('viviendas.id_proyecto', projectIds)
    }
    const { data: asignadasData, error: asgErr } = await qAsignadas
    if (asgErr) throw asgErr
    const asignadas = (asignadasData || []).length

  // 2) Pendientes este mes (abierta o en_proceso) reportadas este mes, en proyectos permitidos
    let qPend = supabase
      .from('incidencias')
      .select('id_incidencia, estado, fecha_reporte, viviendas!inner(id_proyecto)')
      .in('estado', ['abierta', 'en_proceso'])
      .gte('fecha_reporte', start.toISOString())
      .lt('fecha_reporte', end.toISOString())
    if (userRole !== 'administrador') qPend = qPend.in('viviendas.id_proyecto', projectIds)
    const { data: pendData, error: pendErr } = await qPend
    if (pendErr) throw pendErr
    const pendientes = (pendData || []).length

    // 3) Finalizadas este mes (resuelta o cerrada) usando fecha_resuelta ó fecha_cerrada
    let qRes = supabase
      .from('incidencias')
      .select('id_incidencia, estado, fecha_resuelta, fecha_cerrada, viviendas!inner(id_proyecto)')
      .in('estado', ['resuelta','cerrada'])
      .or(`and(estado.eq.resuelta,fecha_resuelta.gte.${start.toISOString()},fecha_resuelta.lt.${end.toISOString()}),and(estado.eq.cerrada,fecha_cerrada.gte.${start.toISOString()},fecha_cerrada.lt.${end.toISOString()})`)
    if (userRole !== 'administrador') qRes = qRes.in('viviendas.id_proyecto', projectIds)
    const { data: resData, error: resErr } = await qRes
    if (resErr) throw resErr
    const finalizadas = (resData || []).length

    return res.json({ success:true, data: { asignadas, pendientes, finalizadas }, meta: { month: `${y}-${String(m).padStart(2,'0')}` } })
  } catch (error) {
    console.error('Error en dashboard stats técnico:', error)
    return res.status(500).json({ success:false, message:'Error al obtener estadísticas' })
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
  const { estado, comentario, conforme_beneficiario } = req.body || {}

    if (!estado) {
      return res.status(400).json({ 
        success: false, 
        message: 'El estado es obligatorio' 
      })
    }

    // Validar estados permitidos
  // Estados válidos según CHECK de la tabla incidencias
  const estadosValidos = ['abierta', 'en_proceso', 'en_espera', 'resuelta', 'cerrada', 'descartada']
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Estado no válido' 
      })
    }

    // Obtener incidencia actual
    // Cargamos incidencia completa para validar permisos
    const { data: incidenciaActual, error: errorActual } = await supabase
      .from('incidencias')
      .select('id_vivienda, estado, id_usuario_tecnico, viviendas!inner(id_proyecto)')
      .eq('id_incidencia', incidenciaId)
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

    // Permisos: admin siempre; técnico si (a) es su asignada, o (b) pertenece a un proyecto suyo y la toma (opcionalmente podríamos exigir asignación previa)
    if (userRole !== 'administrador') {
      const assignedToMe = incidenciaActual.id_usuario_tecnico === tecnicoUid
      if (!assignedToMe) {
        const { data: projects, error: errP } = await supabase
          .from('proyecto_tecnico')
          .select('id_proyecto')
          .eq('tecnico_uid', tecnicoUid)
        if (errP) throw errP
        const allowed = (projects || []).some(p => p.id_proyecto === incidenciaActual.viviendas.id_proyecto)
        if (!allowed) return res.status(403).json({ success:false, message:'No tienes permisos sobre el proyecto' })
      }
    }

    const estadoAnterior = incidenciaActual.estado

    // Actualizar incidencia
    const updates = { 
      estado,
      // No existe 'fecha_actualizacion' en esquema; seteamos fechas según estado cuando aplique
    }

    // Para cierre: exigir conformidad del beneficiario (o manejar según política interna)
    if (estado === 'cerrada') {
      if (conforme_beneficiario !== true) {
        return res.status(400).json({ success:false, message:'Para cerrar se requiere conformidad del beneficiario' })
      }
      updates.conforme_beneficiario = true
      updates.fecha_conformidad_beneficiario = new Date().toISOString()
      updates.fecha_cerrada = new Date().toISOString()
      // Si nunca se marcó resuelta, asumimos resolución inmediata antes del cierre
      if (!incidenciaActual.fecha_resuelta) {
        updates.fecha_resuelta = new Date().toISOString()
      }
    }

    // Marcar fechas clave según estado
    if (estado === 'en_proceso') {
      updates.fecha_en_proceso = new Date().toISOString()
    }
    if (estado === 'resuelta') {
      updates.fecha_resuelta = new Date().toISOString()
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
 * Agrega un comentario a una incidencia sin cambiar su estado
 */
export async function addIncidenceComment(req, res) {
  try {
    const incidenciaId = Number(req.params.id)
    const tecnicoUid = req.user?.uid || req.user?.sub
    const userRole = req.user?.rol || req.user?.role
    const { comentario } = req.body || {}

    if (!comentario || !comentario.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'El comentario es obligatorio' 
      })
    }

    // Obtener incidencia para validar permisos
    const { data: incidencia, error: errorIncidencia } = await supabase
      .from('incidencias')
      .select('id_incidencia, estado, id_usuario_tecnico, viviendas!inner(id_proyecto)')
      .eq('id_incidencia', incidenciaId)
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

    // Validar permisos: admin siempre, técnico si está asignado o pertenece al proyecto
    if (userRole !== 'administrador') {
      const assignedToMe = incidencia.id_usuario_tecnico === tecnicoUid
      if (!assignedToMe) {
        const { data: projects, error: errP } = await supabase
          .from('proyecto_tecnico')
          .select('id_proyecto')
          .eq('tecnico_uid', tecnicoUid)
        if (errP) throw errP
        const allowed = (projects || []).some(p => p.id_proyecto === incidencia.viviendas.id_proyecto)
        if (!allowed) {
          return res.status(403).json({ 
            success: false, 
            message: 'No tienes permisos para comentar en esta incidencia' 
          })
        }
      }
    }

    // Registrar comentario en historial
    await logIncidenciaEvent({
      incidenciaId,
      actorUid: tecnicoUid,
      actorRol: userRole,
      tipo: 'comentario',
      comentario: comentario.trim()
    })

    return res.json({
      success: true,
      message: 'Comentario agregado exitosamente'
    })
    
  } catch (error) {
    console.error('Error al agregar comentario:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Error al agregar el comentario' 
    })
  }
}

/**
 * Agrega un comentario con archivos adjuntos (fotos/videos)
 * Acepta hasta 5 archivos de 10MB cada uno
 */
export async function addCommentWithMedia(req, res) {
  try {
    // Procesar archivos con multer
    await new Promise((resolve, reject) => {
      uploadMultiple.array('files', 5)(req, res, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })

    const incidenciaId = Number(req.params.id)
    const tecnicoUid = req.user?.uid || req.user?.sub
    const userRole = req.user?.rol || req.user?.role
    const { comentario } = req.body || {}
    const files = req.files || []

    if (!comentario || !comentario.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'El comentario es obligatorio' 
      })
    }

    // Obtener incidencia para validar permisos
    const { data: incidencia, error: errorIncidencia } = await supabase
      .from('incidencias')
      .select('id_incidencia, estado, id_usuario_tecnico, viviendas!inner(id_proyecto)')
      .eq('id_incidencia', incidenciaId)
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

    // Validar permisos
    if (userRole !== 'administrador') {
      const assignedToMe = incidencia.id_usuario_tecnico === tecnicoUid
      if (!assignedToMe) {
        const { data: projects, error: errP } = await supabase
          .from('proyecto_tecnico')
          .select('id_proyecto')
          .eq('tecnico_uid', tecnicoUid)
        if (errP) throw errP
        const allowed = (projects || []).some(p => p.id_proyecto === incidencia.viviendas.id_proyecto)
        if (!allowed) {
          return res.status(403).json({ 
            success: false, 
            message: 'No tienes permisos para comentar en esta incidencia' 
          })
        }
      }
    }

    // Insertar el comentario en historial y obtener su ID
    const { data: historialData, error: historialError } = await supabase
      .from('incidencia_historial')
      .insert([{
        incidencia_id: incidenciaId,
        actor_uid: tecnicoUid,
        actor_rol: userRole,
        tipo_evento: 'comentario',
        comentario: comentario.trim()
      }])
      .select('id')
      .single()

    if (historialError) throw historialError

    const comentarioId = historialData.id

    // Subir archivos adjuntos asociados al comentario
    const mediaUploaded = []
    for (const file of files) {
      try {
        const timestamp = Date.now()
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
        const fileName = `comentario_${comentarioId}_${timestamp}_${safeName}`
        const filePath = `incidencias/${incidenciaId}/comentarios/${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media-incidencias')
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          })

        if (uploadError) throw uploadError

        // Registrar en tabla media
        const { error: mediaError } = await supabase
          .from('media')
          .insert([{
            entity_type: 'comentario',
            entity_id: comentarioId,
            path: filePath,
            mime: file.mimetype,
            bytes: file.size,
            uploaded_by: tecnicoUid
          }])

        if (mediaError) throw mediaError
        mediaUploaded.push(fileName)
      } catch (fileErr) {
        console.error(`Error subiendo archivo ${file.originalname}:`, fileErr)
      }
    }

    return res.json({
      success: true,
      message: 'Comentario agregado exitosamente',
      data: {
        comentarioId,
        archivosSubidos: mediaUploaded.length
      }
    })
    
  } catch (error) {
    console.error('Error al agregar comentario con media:', error)
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error al agregar el comentario' 
    })
  }
}

/**
 * Obtiene los archivos adjuntos de un comentario específico
 */
export async function getCommentMedia(req, res) {
  try {
    const comentarioId = Number(req.params.comentarioId)

    const { data: mediaList, error } = await supabase
      .from('media')
      .select('*')
      .eq('entity_type', 'comentario')
      .eq('entity_id', comentarioId)
      .order('created_at', { ascending: true })

    if (error) throw error

    // Generar URLs firmadas para cada archivo
    const mediaWithUrls = await Promise.all(
      (mediaList || []).map(async (m) => {
        try {
          const { data: urlData } = await supabase.storage
            .from('media-incidencias')
            .createSignedUrl(m.path, 3600) // 1 hora

          return {
            ...m,
            url: urlData?.signedUrl || null
          }
        } catch (err) {
          console.error(`Error generando URL para ${m.path}:`, err)
          return { ...m, url: null }
        }
      })
    )

    return res.json({
      success: true,
      data: mediaWithUrls
    })
  } catch (error) {
    console.error('Error obteniendo media de comentario:', error)
    return res.status(500).json({
      success: false,
      message: 'Error al obtener archivos del comentario'
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

    // Admin: asigna sin restricciones
    if (userRole === 'administrador') {
      const updates = { id_usuario_tecnico: tecnicoUid, estado: 'en_proceso', fecha_asignada: new Date().toISOString(), fecha_en_proceso: new Date().toISOString() }
      const incidenciaActualizada = await updateIncidence(incidenciaId, updates)
      await logIncidenciaEvent({
        incidenciaId,
        actorUid: tecnicoUid,
        actorRol: userRole,
        tipo: 'asignacion',
        estadoNuevo: 'en_proceso',
        comentario: 'Incidencia asignada y puesta en proceso'
      })
      return res.json({ success: true, data: incidenciaActualizada, message: 'Incidencia asignada exitosamente' })
    }

    // Técnico: solo puede auto-asignarse si la incidencia pertenece a un proyecto suyo y está sin técnico o ya consigo
    const { data: inc, error: errInc } = await supabase
      .from('incidencias')
      .select('id_usuario_tecnico, viviendas!inner(id_proyecto)')
      .eq('id_incidencia', incidenciaId)
      .single()
    if (errInc) throw errInc
    if (inc.id_usuario_tecnico && inc.id_usuario_tecnico !== tecnicoUid) {
      return res.status(403).json({ success:false, message:'Incidencia asignada a otro técnico' })
    }
    const { data: projects, error: errP } = await supabase
      .from('proyecto_tecnico')
      .select('id_proyecto')
      .eq('tecnico_uid', tecnicoUid)
    if (errP) throw errP
    const allowed = (projects || []).some(p => p.id_proyecto === inc.viviendas.id_proyecto)
    if (!allowed) return res.status(403).json({ success:false, message:'No tienes permisos sobre el proyecto' })

  const updates = { id_usuario_tecnico: tecnicoUid, estado: 'en_proceso', fecha_asignada: new Date().toISOString(), fecha_en_proceso: new Date().toISOString() }
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

    return res.json({ success: true, data: incidenciaActualizada, message: 'Incidencia asignada exitosamente' })
    
  } catch (error) {
    console.error('Error al asignar incidencia:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Error al asignar la incidencia' 
    })
  }
}

/**
 * 🆕 Asignar incidencia a un técnico de campo (Solo para supervisores y admins)
 * POST /api/tecnico/incidencias/:id/asignar
 */
export async function assignIncidenceToTechnician(req, res) {
  try {
    const incidenciaId = Number(req.params.id)
    const { tecnico_uid, fecha_visita_sugerida } = req.body
    const userRole = req.user?.rol || req.user?.role
    const currentUserId = req.user?.uid || req.user?.sub

    // Validar que solo supervisores o admins pueden asignar
    if (userRole !== 'tecnico' && userRole !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'Solo supervisores pueden asignar incidencias'
      })
    }

    // Verificar que la incidencia existe
    const { data: incidencia, error: errInc } = await supabase
      .from('incidencias')
      .select('id_incidencia, estado, viviendas(id_proyecto)')
      .eq('id_incidencia', incidenciaId)
      .single()

    if (errInc || !incidencia) {
      return res.status(404).json({
        success: false,
        message: 'Incidencia no encontrada'
      })
    }

    // Si tecnico_uid es null, desasignar
    if (tecnico_uid === null || tecnico_uid === undefined) {
      const { error: updateError } = await supabase
        .from('incidencias')
        .update({ 
          id_usuario_tecnico: null,
          estado: 'abierta',
          fecha_visita_sugerida: null
        })
        .eq('id_incidencia', incidenciaId)

      if (updateError) throw updateError

      await logIncidenciaEvent(
        incidenciaId,
        'desasignacion',
        'Incidencia desasignada por supervisor',
        currentUserId
      )

      return res.json({
        success: true,
        message: 'Técnico desasignado correctamente',
        data: {
          incidencia_id: incidenciaId,
          tecnico_asignado: null
        }
      })
    }

    // Verificar que el técnico a asignar existe y es tecnico o tecnico_campo
    const { data: tecnico, error: errTec } = await supabase
      .from('usuarios')
      .select('uid, nombre, rol')
      .eq('uid', tecnico_uid)
      .single()

    if (errTec || !tecnico) {
      return res.status(404).json({
        success: false,
        message: 'Técnico no encontrado'
      })
    }

    if (tecnico.rol !== 'tecnico' && tecnico.rol !== 'tecnico_campo') {
      return res.status(400).json({
        success: false,
        message: 'El usuario seleccionado no es un técnico'
      })
    }

    // Preparar actualización con fecha sugerida opcional
    const updates = { 
      id_usuario_tecnico: tecnico_uid,
      fecha_asignada: new Date().toISOString(),
      estado: incidencia.estado === 'abierta' ? 'en_proceso' : incidencia.estado
    }

    // Si se proporciona fecha_visita_sugerida, validarla y agregarla
    if (fecha_visita_sugerida) {
      const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(fecha_visita_sugerida)
      if (!fechaValida) {
        return res.status(400).json({
          success: false,
          message: 'Formato de fecha inválido. Use YYYY-MM-DD'
        })
      }
      updates.fecha_visita_sugerida = fecha_visita_sugerida
    }

    // Asignar la incidencia
    const { error: updateError } = await supabase
      .from('incidencias')
      .update(updates)
      .eq('id_incidencia', incidenciaId)

    if (updateError) throw updateError

    // Registrar en historial
    const comentario = fecha_visita_sugerida 
      ? `Incidencia asignada a ${tecnico.nombre} por supervisor con visita sugerida para ${fecha_visita_sugerida}`
      : `Incidencia asignada a ${tecnico.nombre} por supervisor`
    
    await logIncidenciaEvent(
      incidenciaId,
      'asignacion',
      comentario,
      currentUserId
    )

    return res.json({
      success: true,
      message: fecha_visita_sugerida 
        ? `Incidencia asignada a ${tecnico.nombre} con visita programada para ${fecha_visita_sugerida}`
        : `Incidencia asignada a ${tecnico.nombre}`,
      data: {
        incidencia_id: incidenciaId,
        fecha_visita_sugerida: fecha_visita_sugerida || null,
        tecnico_asignado: {
          uid: tecnico.uid,
          nombre: tecnico.nombre,
          rol: tecnico.rol
        }
      }
    })

  } catch (error) {
    console.error('Error al asignar incidencia a técnico:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Error al asignar la incidencia' 
    })
  }
}

/**
 * 🆕 Listar técnicos disponibles para asignar (Solo para supervisores)
 * GET /api/tecnico/tecnicos-disponibles
 */
export async function listAvailableTechnicians(req, res) {
  try {
    const userRole = req.user?.rol || req.user?.role

    // Solo supervisores y admins pueden ver la lista
    if (userRole !== 'tecnico' && userRole !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver técnicos'
      })
    }

    // Obtener todos los técnicos (supervisores y campo)
    const { data: tecnicos, error } = await supabase
      .from('usuarios')
      .select('uid, nombre, email, rol')
      .in('rol', ['tecnico', 'tecnico_campo'])
      .order('nombre')

    if (error) throw error

    // Contar incidencias asignadas a cada técnico
    const { data: incidenciasActivas, error: errCounts } = await supabase
      .from('incidencias')
      .select('id_incidencia, id_usuario_tecnico, id_vivienda, descripcion, estado, prioridad, fecha_reporte')
      .in('estado', ['abierta', 'en_proceso', 'en_espera'])

    if (errCounts) throw errCounts

    // Obtener direcciones de viviendas para las incidencias
    const viviendaIds = [...new Set(incidenciasActivas.map(inc => inc.id_vivienda).filter(Boolean))]
    let viviendasMap = {}
    
    if (viviendaIds.length > 0) {
      const { data: viviendas } = await supabase
        .from('viviendas')
        .select('id_vivienda, direccion')
        .in('id_vivienda', viviendaIds)
      
      if (viviendas) {
        viviendas.forEach(v => {
          viviendasMap[v.id_vivienda] = v.direccion
        })
      }
    }

    // Agrupar incidencias por técnico
    const incidenciasPorTecnico = {}
    incidenciasActivas.forEach(inc => {
      if (inc.id_usuario_tecnico) {
        if (!incidenciasPorTecnico[inc.id_usuario_tecnico]) {
          incidenciasPorTecnico[inc.id_usuario_tecnico] = []
        }
        
        // Calcular plazos legales
        const plazos = calcularEstadoPlazos(inc)
        
        incidenciasPorTecnico[inc.id_usuario_tecnico].push({
          id: inc.id_incidencia,
          titulo: inc.descripcion?.substring(0, 50) || 'Sin descripción',
          descripcion: inc.descripcion,
          estado: inc.estado,
          prioridad: inc.prioridad,
          direccion: viviendasMap[inc.id_vivienda] || 'Sin dirección',
          plazos_legales: plazos
        })
      }
    })

    // Agregar conteos y lista de incidencias a técnicos
    const tecnicosConCarga = tecnicos.map(t => ({
      ...t,
      incidencias_activas: (incidenciasPorTecnico[t.uid] || []).length,
      incidencias: incidenciasPorTecnico[t.uid] || []
    }))

    return res.json({
      success: true,
      data: tecnicosConCarga
    })

  } catch (error) {
    console.error('Error al listar técnicos disponibles:', error)
    return res.status(500).json({
      success: false,
      message: 'Error al obtener técnicos'
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

/**
 * ==== POSVENTA para Técnico ====
 */

/**
 * Lista formularios de posventa enviados/revisados con filtros y paginación
 * Query params: limit, offset, estado, search, con_pdf, sin_pdf
 */
export async function listPosventaForms(req, res) {
  try {
    const tecnicoUid = req.user?.uid || req.user?.sub
    const userRole = req.user?.rol || req.user?.role
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20))
    const offset = Math.max(0, Number(req.query.offset) || 0)
    const estado = (req.query.estado || '').toString().trim()
    const search = (req.query.search || '').toString().trim()
    const conPdf = String(req.query.con_pdf || '').toLowerCase() === 'true'
    const sinPdf = String(req.query.sin_pdf || '').toLowerCase() === 'true'

    // Base query
    let query = supabase
      .from('vivienda_postventa_form')
      .select(`
        id, id_vivienda, beneficiario_uid, estado, fecha_creada, fecha_enviada, fecha_revisada,
        comentario_tecnico, template_version, pdf_path, pdf_generated_at,
        items_no_ok_count, observaciones_count,
        viviendas: id_vivienda (
          id_vivienda, direccion, tipo_vivienda, id_proyecto,
          proyecto ( id_proyecto, nombre )
        ),
        usuarios:beneficiario_uid ( nombre, email, rut )
      `, { count: 'exact' })

    // Si es técnico (no admin), filtrar por proyectos asignados
    if (userRole !== 'administrador') {
      const { data: projects, error: errP } = await supabase
        .from('proyecto_tecnico')
        .select('id_proyecto')
        .eq('tecnico_uid', tecnicoUid)
      if (errP) throw errP
      const projectIds = (projects || []).map(p => p.id_proyecto)
      if (!projectIds.length) {
        return res.json({ success:true, data: [], meta: { total: 0, limit, offset, hasMore: false } })
      }
      // Filtrar por viviendas cuyo id_proyecto esté en la lista
      query = query.in('viviendas.id_proyecto', projectIds)
    }

    // Filtro por estado si aplica
    if (estado) {
      query = query.eq('estado', estado)
    } else {
      // Por defecto mostrar las que ya están enviadas o revisadas
      query = query.in('estado', ['enviada', 'revisado_correcto', 'revisado_con_problemas'])
    }

    // Filtros PDF
    if (conPdf && !sinPdf) {
      query = query.not('pdf_path', 'is', null)
    }
    if (sinPdf && !conPdf) {
      query = query.is('pdf_path', null)
    }

    // Búsqueda simple: intentar filtrar por campos comunes
    if (search) {
      // Intentar OR combinada sobre campos embebidos soportados por PostgREST
      // Si el back no soporta nested filters, el resultado puede ser 0; el frontend aún funcionará sin búsqueda.
      const like = `%${search}%`
      query = query.or(
        `usuarios.nombre.ilike.${like},usuarios.email.ilike.${like},viviendas.direccion.ilike.${like}`
      )
    }

    // Ordenar por fecha de envío desc
    query = query.order('fecha_enviada', { ascending: false })

    // Paginación
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) throw error

    // Mapear a estructura esperada por el frontend
    const mapped = (data || []).map(row => ({
      id: row.id,
      estado: row.estado,
      fecha_enviada: row.fecha_enviada,
      beneficiario: {
        nombre: row.usuarios?.nombre || '—',
        email: row.usuarios?.email || '—',
        rut: row.usuarios?.rut || null
      },
      vivienda: {
        id: row.viviendas?.id_vivienda || row.id_vivienda,
        direccion: row.viviendas?.direccion || '—',
        tipo: row.viviendas?.tipo_vivienda || null,
        proyecto: row.viviendas?.proyecto?.nombre || '—'
      },
      items_no_ok_count: row.items_no_ok_count ?? null,
      observaciones_count: row.observaciones_count ?? null,
      pdf: {
        existe: !!row.pdf_path,
        path: row.pdf_path || null,
        url_publica: row.pdf_path ? `${process.env.SUPABASE_URL}/storage/v1/object/public/formularios-pdf/${row.pdf_path}` : null
      }
    }))

    return res.json({
      success: true,
      data: mapped,
      meta: {
        total: count || mapped.length,
        limit,
        offset,
        hasMore: (offset + mapped.length) < (count || 0)
      }
    })
  } catch (error) {
    console.error('Error listando formularios posventa:', error)
    return res.status(500).json({ success: false, message: 'Error al listar formularios de posventa' })
  }
}

/**
 * Detalle de un formulario de posventa con sus items
 */
export async function getPosventaFormDetail(req, res) {
  try {
    const formId = Number(req.params.id)
    const tecnicoUid = req.user?.uid || req.user?.sub
    const userRole = req.user?.rol || req.user?.role
    if (!formId) return res.status(400).json({ success:false, message:'ID inválido' })

    let query = supabase
      .from('vivienda_postventa_form')
      .select(`
        id, id_vivienda, beneficiario_uid, estado, fecha_creada, fecha_enviada, fecha_revisada,
        comentario_tecnico, template_version, pdf_path, pdf_generated_at,
        viviendas: id_vivienda (
          id_vivienda, direccion, tipo_vivienda, id_proyecto,
          proyecto ( id_proyecto, nombre, ubicacion )
        ),
        usuarios:beneficiario_uid ( nombre, email, rut )
      `)
      .eq('id', formId)

    if (userRole !== 'administrador') {
      const { data: projects, error: errP } = await supabase
        .from('proyecto_tecnico')
        .select('id_proyecto')
        .eq('tecnico_uid', tecnicoUid)
      if (errP) throw errP
      const projectIds = (projects || []).map(p => p.id_proyecto)
      if (!projectIds.length) {
        return res.status(403).json({ success:false, message:'No tienes acceso a este formulario' })
      }
      query = query.in('viviendas.id_proyecto', projectIds)
    }

    const { data: form, error: formErr } = await query.single()
    if (formErr) throw formErr

    const { data: items, error: itemsErr } = await supabase
      .from('vivienda_postventa_item')
      .select('*')
      .eq('form_id', formId)
      .order('orden', { ascending: true })
    if (itemsErr) throw itemsErr

    const payload = {
      formulario: {
        id: form.id,
        estado: form.estado,
        fecha_creada: form.fecha_creada,
        fecha_enviada: form.fecha_enviada,
        fecha_revisada: form.fecha_revisada,
        comentario_tecnico: form.comentario_tecnico || null,
        beneficiario: {
          nombre: form.usuarios?.nombre || '—',
          email: form.usuarios?.email || '—',
          rut: form.usuarios?.rut || null
        },
        vivienda: {
          direccion: form.viviendas?.direccion || '—',
          tipo_vivienda: form.viviendas?.tipo_vivienda || null,
          proyecto: form.viviendas?.proyecto || null
        }
      },
      items: items || []
    }

    return res.json({ success:true, data: payload })
  } catch (error) {
    console.error('Error obteniendo detalle de formulario posventa:', error)
    return res.status(500).json({ success:false, message:'Error al obtener el formulario de posventa' })
  }
}

// Lista planos asociados al template utilizado por un formulario de posventa
export async function listPosventaFormPlans(req, res) {
  try {
    const formId = Number(req.params.id)
    const tecnicoUid = req.user?.uid || req.user?.sub
    const userRole = req.user?.rol || req.user?.role
    if (!formId) return res.status(400).json({ success:false, message:'ID inválido' })

    // Obtener form con vivienda para validar acceso (misma lógica de getPosventaFormDetail)
    let form = null
    // Intentar seleccionar con template_id; si no existe la columna, hacer fallback sin ella
    try {
      let query = supabase
        .from('vivienda_postventa_form')
        .select(`
          id, id_vivienda, template_version, template_id,
          viviendas: id_vivienda ( id_vivienda, tipo_vivienda, id_proyecto )
        `)
        .eq('id', formId)

      if (userRole !== 'administrador') {
        const { data: projects, error: errP } = await supabase
          .from('proyecto_tecnico')
          .select('id_proyecto')
          .eq('tecnico_uid', tecnicoUid)
        if (errP) throw errP
        const projectIds = (projects || []).map(p => p.id_proyecto)
        if (!projectIds.length) return res.status(403).json({ success:false, message:'Sin acceso' })
        query = query.in('viviendas.id_proyecto', projectIds)
      }

      const { data: f, error: formErr } = await query.single()
      if (formErr) throw formErr
      form = f
    } catch (e) {
      if (e?.code === '42703') {
        let query = supabase
          .from('vivienda_postventa_form')
          .select(`
            id, id_vivienda, template_version,
            viviendas: id_vivienda ( id_vivienda, tipo_vivienda, id_proyecto )
          `)
          .eq('id', formId)
        if (userRole !== 'administrador') {
          const { data: projects, error: errP } = await supabase
            .from('proyecto_tecnico')
            .select('id_proyecto')
            .eq('tecnico_uid', tecnicoUid)
          if (errP) throw errP
          const projectIds = (projects || []).map(p => p.id_proyecto)
          if (!projectIds.length) return res.status(403).json({ success:false, message:'Sin acceso' })
          query = query.in('viviendas.id_proyecto', projectIds)
        }
        const { data: f, error: formErr } = await query.single()
        if (formErr) throw formErr
        form = f
      } else {
        throw e
      }
    }

    // Resolver template por version y tipo_vivienda (como en beneficiarioController)
    const tipoViv = form?.viviendas?.tipo_vivienda || null
    const version = form?.template_version || null
    // Si tenemos template_id guardado en el form, usarlo primero
    if (form?.template_id) {
      const files = await listTemplatePlans(form.template_id)
      if (files?.length) return res.json({ success:true, data: files })
    }
    const { data: tplArr, error: errTpl } = await supabase
      .from('postventa_template')
      .select('id, version, tipo_vivienda')
      .eq('version', version)
      .or(`tipo_vivienda.eq.${tipoViv || ''},tipo_vivienda.is.null`)
      .order('tipo_vivienda', { ascending: false })
      .order('id', { ascending: false })
      .limit(1)
    if (errTpl) throw errTpl
    let tpl = tplArr?.[0] || null
    let files = []
    if (tpl?.id) files = await listTemplatePlans(tpl.id)
    // Fallback: cualquier template con misma versión que tenga archivos
    if (!files?.length && version) {
      const { data: allSameVersion, error: errAll } = await supabase
        .from('postventa_template')
        .select('id, version, tipo_vivienda')
        .eq('version', version)
        .order('tipo_vivienda', { ascending: false })
        .order('id', { ascending: false })
      if (errAll) throw errAll
      for (const t of allSameVersion || []) {
        const f = await listTemplatePlans(t.id)
        if (f?.length) { files = f; tpl = t; break }
      }
    }
    // Último fallback: template activo del tipo de vivienda
    if (!files?.length) {
      const { data: activeTpl, error: errAct } = await supabase
        .from('postventa_template')
        .select('id, version, tipo_vivienda')
        .eq('activo', true)
        .or(`tipo_vivienda.eq.${tipoViv || ''},tipo_vivienda.is.null`)
        .order('tipo_vivienda', { ascending: false })
        .order('version', { ascending: false })
        .order('id', { ascending: false })
        .limit(1)
      if (errAct) throw errAct
      const t = activeTpl?.[0]
      if (t?.id) {
        const f = await listTemplatePlans(t.id)
        if (f?.length) files = f
      }
    }
    return res.json({ success:true, data: files || [] })
  } catch (error) {
    console.error('Error listando planos del formulario:', error)
    return res.status(500).json({ success:false, message:'Error listando planos' })
  }
}

/**
 * Marca como revisado un formulario y opcionalmente genera incidencias
 * Body: { comentario_tecnico?, generar_incidencias?, modo_incidencias? }
 */
export async function reviewPosventaForm(req, res) {
  try {
    const formId = Number(req.params.id)
    if (!formId) return res.status(400).json({ success:false, message:'ID inválido' })
    const tecnicoUid = req.user?.uid || req.user?.sub
    const modoInc = (req.body?.modo_incidencias || '').toString() || null
    const generarInc = req.body?.generar_incidencias === true || !!modoInc
    const comentarioTecnico = (req.body?.comentario_tecnico || '').toString() || null

    // Obtener form actual
    const { data: form, error: formErr } = await supabase
      .from('vivienda_postventa_form')
      .select('*')
      .eq('id', formId)
      .single()
    if (formErr) throw formErr
    if (!form) return res.status(404).json({ success:false, message:'Formulario no encontrado' })
    if (form.estado !== 'enviada') {
      // Permitir idempotencia si ya estaba revisado
      if (form.estado === 'revisado_correcto' || form.estado === 'revisado_con_problemas') {
        return res.json({ success:true, data:{ mensaje:'Formulario ya estaba revisado' }, form })
      }
      return res.status(400).json({ success:false, message:'El formulario debe estar en estado "enviada"' })
    }

    // Leer items para evaluar incidencias
    const { data: items, error: itemsErr } = await supabase
      .from('vivienda_postventa_item')
      .select('*')
      .eq('form_id', formId)
      .order('orden', { ascending: true })
    if (itemsErr) throw itemsErr

    console.log('📋 Total items en formulario:', items?.length)
    console.log('📋 Items completos:', JSON.stringify(items, null, 2))
    
    const problemItems = (items || []).filter(i => !i.ok && (i.crear_incidencia !== false))
    console.log('⚠️  Problem items detectados:', problemItems.length)
    console.log('⚠️  Problem items:', JSON.stringify(problemItems.map(i => ({
      item: i.item,
      categoria: i.categoria,
      ok: i.ok,
      crear_incidencia: i.crear_incidencia,
      comentario: i.comentario
    })), null, 2))
    
    const incidenciasCreadas = []

    if (generarInc && problemItems.length) {
      console.log(`🔧 Generando incidencias - Modo: ${modoInc}`)
      if (modoInc === 'agrupada') {
        // Crear una sola incidencia que agrupe los problemas
        const descripcion = problemItems.map(i => `• ${i.categoria || 'General'}: ${i.item}${i.comentario ? ` — ${i.comentario}` : ''}`).join('\n')
        console.log('📝 Descripción agrupada:', descripcion)
  const prioridad = computePriorityFromCategory('posventa')
        const fechas = calcularFechasLimite(prioridad, new Date())
        // Intentar inferir una garantía dominante por frecuencia de categorías
        let garantia_tipo = null
        try {
          const counts = problemItems.reduce((acc, it) => {
            const gt = obtenerGarantiaPorCategoria((it.categoria || '').toString())
            if (gt) acc[gt] = (acc[gt] || 0) + 1
            return acc
          }, {})
          const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1])
          garantia_tipo = sorted.length ? sorted[0][0] : null
        } catch {}
        const { data: vivRow } = await supabase.from('viviendas').select('fecha_entrega').eq('id_vivienda', form.id_vivienda).maybeSingle()
        const garantia_vence_el = calcularVencimientoGarantia(vivRow?.fecha_entrega || null, garantia_tipo)
        const garantia_vigente = garantia_vence_el ? estaGarantiaVigente(vivRow?.fecha_entrega || null, garantia_tipo) : null
        const payload = {
          id_vivienda: form.id_vivienda,
          id_usuario_reporta: form.beneficiario_uid,
          id_usuario_tecnico: tecnicoUid,
          descripcion,
          categoria: 'posventa',
          estado: 'abierta',
          fecha_reporte: new Date().toISOString(),
          prioridad,
          fuente: 'posventa',
          fecha_limite_atencion: fechas.fecha_limite_atencion,
          fecha_limite_cierre: fechas.fecha_limite_cierre,
          garantia_tipo,
          garantia_vence_el,
          garantia_vigente,
          garantia_fuente: garantia_tipo ? 'posventa' : null
        }
        const created = await createIncidence(payload)
        incidenciasCreadas.push(created)
        console.log('✅ Incidencia agrupada creada:', created.id_incidencia)
        await logIncidenciaEvent({ incidenciaId: created.id_incidencia, actorUid: tecnicoUid, actorRol: req.user?.rol || req.user?.role, tipo: 'creada_desde_posventa', comentario: 'Incidencia agrupada desde revisión de posventa' })
      } else {
        // Separadas: una por item
        console.log(`🔧 Creando ${problemItems.length} incidencias separadas`)
        for (const it of problemItems) {
          const desc = `${it.categoria || 'General'} — ${it.item}${it.comentario ? `: ${it.comentario}` : ''}`
          const prioridad = computePriorityFromCategory(it.categoria || 'posventa')
          const fechas = calcularFechasLimite(prioridad, new Date())
          const garantia_tipo = obtenerGarantiaPorCategoria((it.categoria || '').toString())
          const { data: vivRow } = await supabase.from('viviendas').select('fecha_entrega').eq('id_vivienda', form.id_vivienda).maybeSingle()
          const garantia_vence_el = calcularVencimientoGarantia(vivRow?.fecha_entrega || null, garantia_tipo)
          const garantia_vigente = garantia_vence_el ? estaGarantiaVigente(vivRow?.fecha_entrega || null, garantia_tipo) : null
          const payload = {
            id_vivienda: form.id_vivienda,
            id_usuario_reporta: form.beneficiario_uid,
            id_usuario_tecnico: tecnicoUid,
            descripcion: desc,
            categoria: it.categoria || 'posventa',
            estado: 'abierta',
            fecha_reporte: new Date().toISOString(),
            prioridad,
            fuente: 'posventa',
            fecha_limite_atencion: fechas.fecha_limite_atencion,
            fecha_limite_cierre: fechas.fecha_limite_cierre,
            garantia_tipo,
            garantia_vence_el,
            garantia_vigente,
            garantia_fuente: garantia_tipo ? 'posventa' : null
          }
          const created = await createIncidence(payload)
          incidenciasCreadas.push(created)
          console.log(`✅ Incidencia separada creada: ${created.id_incidencia} - ${it.item}`)
          await logIncidenciaEvent({ incidenciaId: created.id_incidencia, actorUid: tecnicoUid, actorRol: req.user?.rol || req.user?.role, tipo: 'creada_desde_posventa', comentario: `Creada desde revisión de posventa (item ${it.id})` })
        }
      }
    }

    // Marcar como revisada usando estados válidos según constraint
    const tieneProblemas = problemItems.length > 0
    const updates = {
      estado: tieneProblemas ? 'revisado_con_problemas' : 'revisado_correcto',
      fecha_revisada: new Date().toISOString(),
      comentario_tecnico: comentarioTecnico
    }
    const { error: upErr } = await supabase
      .from('vivienda_postventa_form')
      .update(updates)
      .eq('id', formId)
    if (upErr) throw upErr

    return res.json({ success:true, data: { mensaje: 'Formulario revisado', incidencias: incidenciasCreadas }, form: { ...form, ...updates } })
  } catch (error) {
    console.error('Error revisando formulario posventa:', error)
    return res.status(500).json({ success:false, message:'Error al revisar el formulario de posventa' })
  }
}

/**
 * Lista viviendas visibles para el técnico (o todas si es admin)
 * Query params: estado (opcional)
 */
export async function listTechnicianHousings(req, res) {
  try {
    const tecnicoUid = req.user?.uid || req.user?.sub
    const userRole = req.user?.rol || req.user?.role
    const estado = (req.query.estado || '').toString().trim()

    // Si es técnico, obtener los proyectos asignados
    let projectIds = []
    if (userRole !== 'administrador') {
      const { data: projects, error: errP } = await supabase
        .from('proyecto_tecnico')
        .select('id_proyecto')
        .eq('tecnico_uid', tecnicoUid)
      if (errP) throw errP
      projectIds = (projects || []).map(p => p.id_proyecto)
      if (!projectIds.length) {
        return res.json({ success: true, data: [], meta: { total: 0 } })
      }
    }

    // Construir consulta de viviendas
    let query = supabase
      .from('viviendas')
      .select(`
        id_vivienda, estado, id_proyecto, beneficiario_uid, direccion, fecha_entrega,
        proyecto ( id_proyecto, nombre )
      `)

    if (userRole !== 'administrador') {
      query = query.in('id_proyecto', projectIds)
    }
    if (estado) {
      query = query.eq('estado', estado)
    }
    query = query.order('id_proyecto', { ascending: true }).order('id_vivienda', { ascending: true })

    const { data, error } = await query
    if (error) throw error

    const mapped = (data || []).map(v => ({
      id_vivienda: v.id_vivienda,
      estado: v.estado,
      id_proyecto: v.id_proyecto,
      direccion: v.direccion,
      beneficiario_uid: v.beneficiario_uid,
      fecha_entrega: v.fecha_entrega,
      proyecto_nombre: v.proyecto?.nombre || null,
      asignada: !!v.beneficiario_uid
    }))

    return res.json({ success: true, data: mapped, meta: { total: mapped.length } })
  } catch (error) {
    console.error('Error listando viviendas para técnico:', error)
    return res.status(500).json({ success: false, message: 'Error al listar viviendas' })
  }
}

/**
 * Marca como entregada una vivienda, si pertenece a un proyecto del técnico o si es admin
 */
export async function deliverTechnicianHousing(req, res) {
  try {
    const viviendaId = Number(req.params.id)
    if (!viviendaId) return res.status(400).json({ success:false, message:'ID inválido' })
    const tecnicoUid = req.user?.uid || req.user?.sub
    const userRole = req.user?.rol || req.user?.role

    // Leer vivienda actual
    const { data: vivienda, error: vErr } = await supabase
      .from('viviendas')
      .select('id_vivienda, id_proyecto, estado, beneficiario_uid')
      .eq('id_vivienda', viviendaId)
      .single()
    if (vErr) throw vErr
    if (!vivienda) return res.status(404).json({ success:false, message:'Vivienda no encontrada' })

    // Validar permisos: si no es admin, debe estar asignado al proyecto
    if (userRole !== 'administrador') {
      const { data: projects, error: errP } = await supabase
        .from('proyecto_tecnico')
        .select('id_proyecto')
        .eq('tecnico_uid', tecnicoUid)
      if (errP) throw errP
      const allowed = (projects || []).some(p => p.id_proyecto === vivienda.id_proyecto)
      if (!allowed) return res.status(403).json({ success:false, message:'No tienes permisos sobre este proyecto' })
    }

    // Validar estado actual y beneficiario asignado
    if (vivienda.estado !== 'asignada' || !vivienda.beneficiario_uid) {
      return res.status(400).json({ success:false, message:'La vivienda debe estar asignada a un beneficiario para poder entregarla' })
    }

    const updates = { estado: 'entregada', fecha_entrega: new Date().toISOString() }
    const { data: updated, error: upErr } = await supabase
      .from('viviendas')
      .update(updates)
      .eq('id_vivienda', viviendaId)
      .select('*')
      .single()
    if (upErr) throw upErr

    return res.json({ success:true, data: updated, message: 'Vivienda marcada como entregada' })
  } catch (error) {
    console.error('Error entregando vivienda:', error)
    return res.status(500).json({ success:false, message:'Error al marcar la vivienda como entregada' })
  }
}

/**
 * 🆕 Obtiene visitas sugeridas para hoy del técnico de campo
 * Algoritmo inteligente que ordena por:
 * 1. Fecha sugerida por supervisor (si es hoy)
 * 2. Plazos vencidos
 * 3. Próximos a vencer (≤3 días)
 * 4. Prioridad alta
 * 5. Antigüedad del reporte
 * 
 * GET /api/tecnico/visitas-sugeridas
 * Query params: fecha (opcional, default: hoy)
 */
export async function getVisitasSugeridas(req, res) {
  try {
    const tecnicoUid = req.user?.uid || req.user?.sub
    const userRole = req.user?.rol || req.user?.role
    
    // Fecha a consultar (default: hoy en formato YYYY-MM-DD)
    const fechaStr = req.query.fecha || new Date().toISOString().split('T')[0]
    const hoy = new Date().toISOString().split('T')[0]
    
    console.log(`📅 Consultando visitas sugeridas para ${fechaStr} - Técnico: ${tecnicoUid}`)

    // Solo técnicos de campo y supervisores pueden ver sus visitas
    if (!['tecnico', 'tecnico_campo', 'administrador'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver visitas sugeridas'
      })
    }

    // Query base: incidencias asignadas al técnico que están activas
    let query = supabase
      .from('incidencias')
      .select(`
        id_incidencia,
        descripcion,
        categoria,
        estado,
        prioridad,
        fecha_reporte,
        fecha_visita_sugerida,
        id_vivienda,
        viviendas!inner(
          id_vivienda,
          direccion,
          id_proyecto,
          proyecto(
            id_proyecto,
            nombre,
            ubicacion
          )
        ),
        reporta:usuarios!incidencias_id_usuario_reporta_fkey(nombre, email, telefono)
      `)
      .eq('id_usuario_tecnico', tecnicoUid)
      .in('estado', ['abierta', 'en_proceso', 'en_espera'])
      .order('fecha_reporte', { ascending: true })

    const { data: incidencias, error } = await query

    if (error) {
      console.error('❌ Error consultando incidencias:', error)
      throw error
    }

    console.log(`📋 Total incidencias activas del técnico: ${incidencias?.length || 0}`)

    if (!incidencias || incidencias.length === 0) {
      return res.json({
        success: true,
        data: [],
        meta: {
          fecha: fechaStr,
          total: 0,
          con_fecha_sugerida: 0,
          sin_fecha_sugerida: 0
        }
      })
    }

    // Enriquecer con plazos legales
    const incidenciasEnriquecidas = incidencias.map(inc => {
      try {
        const plazos = calcularEstadoPlazos(inc)
        return { ...inc, plazos_legales: plazos }
      } catch (err) {
        console.error(`Error calculando plazos para incidencia ${inc.id_incidencia}:`, err)
        return { ...inc, plazos_legales: null }
      }
    })

    // Algoritmo de priorización inteligente
    const incidenciasOrdenadas = incidenciasEnriquecidas.sort((a, b) => {
      // 1️⃣ Prioridad MÁXIMA: Si supervisor puso fecha_visita_sugerida para hoy
      const fechaSugeridaA = a.fecha_visita_sugerida?.split('T')[0]
      const fechaSugeridaB = b.fecha_visita_sugerida?.split('T')[0]
      
      if (fechaSugeridaA === fechaStr && fechaSugeridaB !== fechaStr) return -1
      if (fechaSugeridaB === fechaStr && fechaSugeridaA !== fechaStr) return 1
      
      // 2️⃣ Plazos VENCIDOS → urgencia crítica
      const plazoA = a.plazos_legales?.estado_plazo
      const plazoB = b.plazos_legales?.estado_plazo
      
      if (plazoA === 'vencido' && plazoB !== 'vencido') return -1
      if (plazoB === 'vencido' && plazoA !== 'vencido') return 1
      
      // 3️⃣ PRÓXIMOS A VENCER (≤3 días)
      if (plazoA === 'proximo_vencer' && plazoB !== 'proximo_vencer') return -1
      if (plazoB === 'proximo_vencer' && plazoA !== 'proximo_vencer') return 1
      
      // Si ambos próximos a vencer, ordenar por días restantes (menos días primero)
      if (plazoA === 'proximo_vencer' && plazoB === 'proximo_vencer') {
        const diasA = a.plazos_legales?.dias_restantes ?? 999
        const diasB = b.plazos_legales?.dias_restantes ?? 999
        if (diasA !== diasB) return diasA - diasB
      }
      
      // 4️⃣ PRIORIDAD del reporte (alta > media > baja)
      const prioridadPeso = { 'alta': 3, 'media': 2, 'baja': 1 }
      const pesoA = prioridadPeso[(a.prioridad || '').toLowerCase()] || 0
      const pesoB = prioridadPeso[(b.prioridad || '').toLowerCase()] || 0
      if (pesoA !== pesoB) return pesoB - pesoA
      
      // 5️⃣ ANTIGÜEDAD: más antiguas primero (FIFO)
      const fechaA = new Date(a.fecha_reporte).getTime()
      const fechaB = new Date(b.fecha_reporte).getTime()
      return fechaA - fechaB
    })

    // Filtrar y mapear resultados
    const visitasSugeridas = incidenciasOrdenadas.map(inc => ({
      id_incidencia: inc.id_incidencia,
      descripcion: inc.descripcion || 'Sin descripción',
      categoria: inc.categoria || 'General',
      estado: inc.estado,
      prioridad: inc.prioridad || 'media',
      fecha_reporte: inc.fecha_reporte,
      fecha_visita_sugerida: inc.fecha_visita_sugerida,
      es_visita_programada: inc.fecha_visita_sugerida === fechaStr,
      vivienda: {
        id: inc.viviendas?.id_vivienda,
        direccion: inc.viviendas?.direccion || 'Sin dirección',
        proyecto: {
          id: inc.viviendas?.proyecto?.id_proyecto,
          nombre: inc.viviendas?.proyecto?.nombre || 'Sin proyecto',
          ubicacion: inc.viviendas?.proyecto?.ubicacion
        }
      },
      reporta: inc.reporta ? {
        nombre: inc.reporta.nombre,
        email: inc.reporta.email,
        telefono: inc.reporta.telefono
      } : null,
      plazos_legales: inc.plazos_legales,
      urgencia_nivel: 
        inc.plazos_legales?.estado_plazo === 'vencido' ? 'critica' :
        inc.plazos_legales?.estado_plazo === 'proximo_vencer' ? 'alta' :
        (inc.prioridad || '').toLowerCase() === 'alta' ? 'media' : 'normal'
    }))

    // Estadísticas
    const conFechaSugerida = visitasSugeridas.filter(v => v.fecha_visita_sugerida).length
    const sinFechaSugerida = visitasSugeridas.length - conFechaSugerida
    const paraHoy = visitasSugeridas.filter(v => v.es_visita_programada).length
    const vencidas = visitasSugeridas.filter(v => v.urgencia_nivel === 'critica').length
    const urgentes = visitasSugeridas.filter(v => v.urgencia_nivel === 'alta').length

    console.log(`✅ Visitas procesadas:`)
    console.log(`   - Total: ${visitasSugeridas.length}`)
    console.log(`   - Programadas para hoy: ${paraHoy}`)
    console.log(`   - Con fecha sugerida: ${conFechaSugerida}`)
    console.log(`   - Vencidas: ${vencidas}`)
    console.log(`   - Urgentes: ${urgentes}`)

    return res.json({
      success: true,
      data: visitasSugeridas,
      meta: {
        fecha: fechaStr,
        es_hoy: fechaStr === hoy,
        total: visitasSugeridas.length,
        con_fecha_sugerida: conFechaSugerida,
        sin_fecha_sugerida: sinFechaSugerida,
        para_hoy: paraHoy,
        por_urgencia: {
          critica: vencidas,
          alta: urgentes,
          media: visitasSugeridas.filter(v => v.urgencia_nivel === 'media').length,
          normal: visitasSugeridas.filter(v => v.urgencia_nivel === 'normal').length
        }
      }
    })

  } catch (error) {
    console.error('❌ Error al obtener visitas sugeridas:', error)
    return res.status(500).json({
      success: false,
      message: 'Error al obtener visitas sugeridas'
    })
  }
}

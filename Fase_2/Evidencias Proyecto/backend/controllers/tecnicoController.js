/**
 * Controlador de Técnico
 * Plataforma de Gestión de Viviendas TECHO
 * 
 * Maneja las operaciones específicas para usuarios técnicos
 */

import { supabase } from '../supabaseClient.js'
import { getAllIncidences, updateIncidence, logIncidenciaEvent, createIncidence, computePriority } from '../models/Incidence.js'
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

/**
 * ==== POSVENTA para Técnico ====
 */

/**
 * Lista formularios de posventa enviados/revisados con filtros y paginación
 * Query params: limit, offset, estado, search, con_pdf, sin_pdf
 */
export async function listPosventaForms(req, res) {
  try {
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
          id_vivienda, direccion, tipo_vivienda,
          proyecto ( nombre )
        ),
        usuarios:beneficiario_uid ( nombre, email, rut )
      `, { count: 'exact' })

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
    if (!formId) return res.status(400).json({ success:false, message:'ID inválido' })

    const { data: form, error: formErr } = await supabase
      .from('vivienda_postventa_form')
      .select(`
        id, id_vivienda, beneficiario_uid, estado, fecha_creada, fecha_enviada, fecha_revisada,
        comentario_tecnico, template_version, pdf_path, pdf_generated_at,
        viviendas: id_vivienda (
          id_vivienda, direccion, tipo_vivienda,
          proyecto ( nombre, ubicacion )
        ),
        usuarios:beneficiario_uid ( nombre, email, rut )
      `)
      .eq('id', formId)
      .single()
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

    const problemItems = (items || []).filter(i => !i.ok && (i.crear_incidencia !== false))
    const incidenciasCreadas = []

    if (generarInc && problemItems.length) {
      if (modoInc === 'agrupada') {
        // Crear una sola incidencia que agrupe los problemas
        const descripcion = problemItems.map(i => `• ${i.categoria || 'General'}: ${i.item}${i.comentario ? ` — ${i.comentario}` : ''}`).join('\n')
        const payload = {
          id_vivienda: form.id_vivienda,
          id_usuario_reporta: form.beneficiario_uid,
          id_usuario_tecnico: tecnicoUid,
          descripcion,
          categoria: 'posventa',
          estado: 'abierta',
          fecha_reporte: new Date().toISOString(),
          prioridad: computePriority('posventa', descripcion)
        }
        const created = await createIncidence(payload)
        incidenciasCreadas.push(created)
        await logIncidenciaEvent({ incidenciaId: created.id_incidencia, actorUid: tecnicoUid, actorRol: req.user?.rol || req.user?.role, tipo: 'creada_desde_posventa', comentario: 'Incidencia agrupada desde revisión de posventa' })
      } else {
        // Separadas: una por item
        for (const it of problemItems) {
          const desc = `${it.categoria || 'General'} — ${it.item}${it.comentario ? `: ${it.comentario}` : ''}`
          const payload = {
            id_vivienda: form.id_vivienda,
            id_usuario_reporta: form.beneficiario_uid,
            id_usuario_tecnico: tecnicoUid,
            descripcion: desc,
            categoria: it.categoria || 'posventa',
            estado: 'abierta',
            fecha_reporte: new Date().toISOString(),
            prioridad: computePriority(it.categoria || 'posventa', desc)
          }
          const created = await createIncidence(payload)
          incidenciasCreadas.push(created)
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

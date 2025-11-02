/**
 * Controlador de Beneficiario
 * Plataforma de Gestión de Viviendas TECHO
 * 
 * Maneja las operaciones específicas para usuarios beneficiarios
 */

import { supabase } from '../supabaseClient.js'
import { listTemplatePlans } from '../services/MediaService.js'
import { getIncidencesByBeneficiary, createIncidence, computePriority, logIncidenciaEvent } from '../models/Incidence.js'
import { calcularFechasLimite, obtenerGarantiaPorCategoria, calcularVencimientoGarantia, estaGarantiaVigente, computePriorityFromCategory } from '../utils/posventaConfig.js'
import { calcularEstadoPlazos } from '../utils/plazosLegales.js'

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
    if (!beneficiarioUid) return res.status(401).json({ success:false, message:'No autenticado' })

    const { data: vivienda, error: errViv } = await supabase
      .from('viviendas')
      .select(`
        id_vivienda,
        id_proyecto,
        direccion,
        estado,
        beneficiario_uid,
        tipo_vivienda,
        metros_cuadrados,
        numero_habitaciones,
        numero_banos,
        fecha_entrega,
        proyecto(id_proyecto,nombre,ubicacion,latitud,longitud)
      `)
      .eq('beneficiario_uid', beneficiarioUid)
      .maybeSingle()
    if (errViv) throw errViv
    if (!vivienda) return res.status(404).json({ success:false, message:'No tienes una vivienda asignada' })

  // Recepción activa
    const { data: recepcionActiva, error: errRec } = await supabase
      .from('vivienda_recepcion')
      .select('id, estado, fecha_creada, fecha_enviada, observaciones_count')
      .eq('id_vivienda', vivienda.id_vivienda)
      .in('estado', ['borrador','enviada'])
      .order('id', { ascending:false })
      .limit(1)
    if (errRec) throw errRec
    const recepcionActual = Array.isArray(recepcionActiva) && recepcionActiva.length ? recepcionActiva[0] : null

    // Puede crear incidencias => si última recepcion enviada o alguna revisada
    let puedeCrearIncidencias = false
    if (recepcionActual?.estado === 'enviada') {
      puedeCrearIncidencias = true
    } else {
      const { data: revisada, error: errRev } = await supabase
        .from('vivienda_recepcion')
        .select('id')
        .eq('id_vivienda', vivienda.id_vivienda)
        .eq('estado','revisada')
        .limit(1)
      if (errRev) throw errRev
      puedeCrearIncidencias = Array.isArray(revisada) && revisada.length > 0
    }

    // Intentar obtener un técnico referente del proyecto (si está configurado)
    let tecnico = null
    try {
      const { data: techRows, error: errTech } = await supabase
        .from('proyecto_tecnico')
        .select(`
          tecnico_uid,
          usuarios!inner(uid, nombre, email)
        `)
        .eq('id_proyecto', vivienda.id_proyecto)
        .limit(1)
      if (errTech) throw errTech
      if (Array.isArray(techRows) && techRows.length) {
        // Normalizamos estructura simple
  const u = techRows[0]?.usuarios
        if (u) tecnico = { uid: u.uid, nombre: u.nombre, email: u.email }
      }
    } catch (e) {
      // No bloquear por contacto, solo loguear
      console.warn('getMyHousing: no se pudo cargar técnico del proyecto:', e?.message || e)
    }

    return res.json({ success:true, data:{ vivienda, proyecto: vivienda.proyecto, tecnico, recepcion_activa: recepcionActual, flags:{ tiene_recepcion_activa: !!recepcionActual, puede_incidencias: puedeCrearIncidencias } } })
  } catch (error) {
    console.error('Error getMyHousing:', error)
    return res.status(500).json({ success:false, message:'Error al obtener la vivienda' })
  }
}

/**
 * Obtiene el resumen de recepción de la vivienda del beneficiario
 */
export async function getMyReception(req, res) {
  try {
    const beneficiarioUid = req.user?.uid || req.user?.sub
    const { data: vivienda, error: errViv } = await supabase
      .from('viviendas')
      .select('id_vivienda')
      .eq('beneficiario_uid', beneficiarioUid)
      .maybeSingle()
    if (errViv) throw errViv
    if (!vivienda) return res.status(404).json({ success:false, message:'No tienes una vivienda asignada' })

    const { data: resumen, error: errRes } = await supabase
      .from('vista_recepcion_resumen')
      .select('*')
      .eq('id_vivienda', vivienda.id_vivienda)
      .order('id', { ascending:false })
      .limit(1)
    if (errRes) throw errRes
    const recepcionResumen = Array.isArray(resumen) && resumen.length ? resumen[0] : null
    if (!recepcionResumen) return res.json({ success:true, data:{ tiene_recepcion:false, resumen:null } })
    return res.json({ success:true, data:{ tiene_recepcion:true, resumen: recepcionResumen } })
  } catch (error) {
    console.error('Error getMyReception:', error)
    return res.status(500).json({ success:false, message:'Error al obtener el resumen de recepción' })
  }
}

/**
 * Obtiene las incidencias del beneficiario
 */
export async function getMyIncidences(req, res) {
  try {
    const beneficiarioUid = req.user?.uid || req.user?.sub
    const role = req.user?.rol || req.user?.role
    const { limit = 50, offset = 0, estado, categoria, prioridad, search } = req.query || {}
    const includeMedia = (req.query.includeMedia || req.query.include_media || '') === '1'

    const l = Math.max(1, parseInt(limit))
    const o = Math.max(0, parseInt(offset))

    let query = supabase
      .from('incidencias')
      .select(`*, viviendas(id_vivienda,direccion, proyecto(nombre))`, { count: 'exact' })
      .order('fecha_reporte', { ascending:false })

    if (role !== 'administrador') query = query.eq('id_usuario_reporta', beneficiarioUid)
    if (estado) query = query.eq('estado', estado)
    if (categoria) query = query.eq('categoria', categoria)
    if (prioridad) query = query.eq('prioridad', prioridad)
    if (search) query = query.ilike('descripcion', `%${search}%`)

    query = query.range(o, o + l - 1)
    const { data, error, count } = await query
    if (error) throw error
    const incidencias = data || []

    if (includeMedia && incidencias.length) {
      const ids = incidencias.map(i => i.id_incidencia)
      const { data: mediaRows, error: mediaErr } = await supabase
        .from('media')
        .select('id, entity_id, path, mime, bytes, created_at')
        .eq('entity_type','incidencia')
        .in('entity_id', ids)
        .order('id', { ascending:false })
      if (!mediaErr && mediaRows) {
        const bucket = 'incidencias'
        const byInc = mediaRows.reduce((acc, m) => {
          (acc[m.entity_id] = acc[m.entity_id] || []).push({
            id: m.id,
            path: m.path,
            mime: m.mime,
            bytes: m.bytes,
            created_at: m.created_at,
            url: `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${m.path}`
          })
          return acc
        }, {})
        incidencias.forEach(i => { i.media = byInc[i.id_incidencia] || [] })
      }
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

    return res.json({ success:true, data: incidencias, meta:{ total: count ?? incidencias.length, limit: l, offset: o, hasMore: typeof count === 'number' ? (o + incidencias.length) < count : false } })
  } catch (error) {
    console.error('Error getMyIncidences:', error)
    return res.status(500).json({ success:false, message:'Error al obtener las incidencias' })
  }
}

/**
 * Crea una nueva incidencia
 */
export async function createNewIncidence(req, res) {
  try {
    const beneficiarioUid = req.user?.uid || req.user?.sub
    const { categoria, descripcion, garantia_tipo: garantiaTipoInput } = req.body || {}
    if (!categoria || !descripcion) return res.status(400).json({ success:false, message:'Categoría y descripción son obligatorias' })

    const { data: vivienda, error: errViv } = await supabase
      .from('viviendas')
      .select('id_vivienda, fecha_entrega')
      .eq('beneficiario_uid', beneficiarioUid)
      .maybeSingle()
    if (errViv) throw errViv
    if (!vivienda) return res.status(404).json({ success:false, message:'No tienes una vivienda asignada' })

  // Prioridad basada SOLO en la categoría (no en la descripción)
  const prioridad = computePriorityFromCategory(categoria)
    const fechas = calcularFechasLimite(prioridad, new Date())
    // Garantía: usar input si válido, o deducir por categoría
    const garantia_tipo = ['terminaciones','instalaciones','estructura'].includes((garantiaTipoInput||'').toString())
      ? garantiaTipoInput
      : (obtenerGarantiaPorCategoria(categoria) || null)
    const garantia_vence_el = calcularVencimientoGarantia(vivienda?.fecha_entrega || null, garantia_tipo)
    const garantia_vigente = garantia_vence_el ? estaGarantiaVigente(vivienda?.fecha_entrega || null, garantia_tipo) : null
    const incidenciaData = { 
      id_vivienda: vivienda.id_vivienda, 
      id_usuario_reporta: beneficiarioUid, 
      categoria, 
      descripcion, 
      prioridad, 
      estado:'abierta', 
      fecha_reporte: new Date().toISOString(),
      fuente: 'beneficiario',
      fecha_limite_atencion: fechas.fecha_limite_atencion,
      fecha_limite_cierre: fechas.fecha_limite_cierre,
      garantia_tipo,
      garantia_vence_el,
      garantia_vigente,
      garantia_fuente: garantiaTipoInput ? 'beneficiario' : (garantia_tipo ? 'auto' : null)
    }
    const nuevaIncidencia = await createIncidence(incidenciaData)

    await logIncidenciaEvent({ incidenciaId: nuevaIncidencia.id_incidencia, actorUid: beneficiarioUid, actorRol:'beneficiario', tipo:'creacion', estadoNuevo:'abierta', comentario:'Incidencia creada por beneficiario' })
    return res.status(201).json({ success:true, data: nuevaIncidencia, message:'Incidencia creada exitosamente' })
  } catch (error) {
    console.error('Error createNewIncidence:', error)
    return res.status(500).json({ success:false, message:'Error al crear la incidencia' })
  }
}

/**
 * Obtiene el detalle de una incidencia específica del beneficiario
 */
export async function getIncidenceDetail(req, res) {
  try {
    const beneficiarioUid = req.user?.uid || req.user?.sub
    const incidenciaId = Number(req.params.id)
    const { data: incidencia, error: errInc } = await supabase
      .from('incidencias')
      .select(`*, viviendas(id_vivienda,direccion, proyecto(nombre, ubicacion)), tecnico:usuarios!incidencias_id_usuario_tecnico_fkey(nombre, email)`) 
      .eq('id_incidencia', incidenciaId)
      .eq('id_usuario_reporta', beneficiarioUid)
      .single()
    if (errInc) {
      if (errInc.code === 'PGRST116') return res.status(404).json({ success:false, message:'Incidencia no encontrada' })
      throw errInc
    }
    const { data: historial, error: errHist } = await supabase
      .from('incidencia_historial')
      .select('*')
      .eq('incidencia_id', incidenciaId)
      .order('created_at', { ascending:true })
    if (errHist) throw errHist

    // media
    const { data: mediaRows, error: mediaErr } = await supabase
      .from('media')
      .select('id,path,mime,bytes,created_at')
      .eq('entity_type','incidencia')
      .eq('entity_id', incidenciaId)
      .order('id',{ ascending:false })
    if (mediaErr) throw mediaErr
    const bucket = 'incidencias'
    const media = (mediaRows||[]).map(m => ({ ...m, url: `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${m.path}` }))

    return res.json({ success:true, data:{ ...incidencia, media, historial: historial || [] } })
  } catch (error) {
    console.error('Error getIncidenceDetail:', error)
    return res.status(500).json({ success:false, message:'Error al obtener el detalle de la incidencia' })
  }
}

/**
 * Beneficiario valida (conforme) o rechaza (no conforme) una incidencia que está en estado 'resuelta'.
 * Flujo:
 *  - Sólo incidencias del beneficiario y estado actual 'resuelta'.
 *  - Body { conforme: boolean, comentario?: string }
 *    * conforme = true  => pasa a 'cerrada', set fecha_cerrada (y fecha_resuelta si faltara), conforme_beneficiario=true
 *    * conforme = false => regresa a 'en_proceso', limpia conforme_beneficiario (false/null), registra comentario obligatorio.
 */
export async function validateIncidence(req, res) {
  try {
    const beneficiarioUid = req.user?.uid || req.user?.sub
    const incidenciaId = Number(req.params.id)
    const { conforme, comentario } = req.body || {}
    if (typeof conforme !== 'boolean') return res.status(400).json({ success:false, message:'Campo conforme (boolean) es requerido' })

    // Obtener incidencia asegurando que pertenece al beneficiario
    const { data: incidencia, error: errInc } = await supabase
      .from('incidencias')
      .select('*')
      .eq('id_incidencia', incidenciaId)
      .eq('id_usuario_reporta', beneficiarioUid)
      .maybeSingle()
    if (errInc) throw errInc
    if (!incidencia) return res.status(404).json({ success:false, message:'Incidencia no encontrada' })
    if (incidencia.estado !== 'resuelta') return res.status(400).json({ success:false, message:'La incidencia no está en estado resuelta' })

    const nowIso = new Date().toISOString()
    let updates = {}
    let nuevoEstado = null
    let tipoEvento = null
    let comentarioEvento = null

    if (conforme) {
      nuevoEstado = 'cerrada'
      updates = {
        estado: 'cerrada',
        fecha_cerrada: nowIso,
        fecha_resuelta: incidencia.fecha_resuelta || nowIso,
        conforme_beneficiario: true,
        fecha_conformidad_beneficiario: nowIso
      }
      tipoEvento = 'validacion_beneficiario'
      comentarioEvento = comentario || 'Beneficiario valida solución y cierra la incidencia'
    } else {
      if (!comentario || !comentario.trim()) return res.status(400).json({ success:false, message:'Comentario es obligatorio cuando no está conforme' })
      nuevoEstado = 'en_proceso'
      updates = {
        estado: 'en_proceso',
        conforme_beneficiario: false,
        fecha_conformidad_beneficiario: null,
        fecha_en_proceso: incidencia.fecha_en_proceso || nowIso
      }
      tipoEvento = 'rechazo_beneficiario'
      comentarioEvento = comentario
    }

    const { data: updated, error: errUp } = await supabase
      .from('incidencias')
      .update(updates)
      .eq('id_incidencia', incidenciaId)
      .select('*')
      .single()
    if (errUp) throw errUp

    await logIncidenciaEvent({
      incidenciaId,
      actorUid: beneficiarioUid,
      actorRol: 'beneficiario',
      tipo: tipoEvento,
      estadoAnterior: 'resuelta',
      estadoNuevo: nuevoEstado,
      comentario: comentarioEvento
    })

    return res.json({ success:true, data: updated, message: conforme ? 'Incidencia cerrada por conformidad del beneficiario' : 'Incidencia devuelta a proceso' })
  } catch (error) {
    console.error('Error validateIncidence:', error)
    return res.status(500).json({ success:false, message:'Error validando la incidencia' })
  }
}

/** ==== POSVENTA (Formulario) ==== */
export async function getPosventaForm(req, res) {
  try {
    const beneficiarioUid = req.user?.uid || req.user?.sub
    if (!beneficiarioUid) return res.status(401).json({ success:false, message:'No autenticado' })
    const { data: vivienda, error: errV } = await supabase
      .from('viviendas')
      .select('id_vivienda, tipo_vivienda, estado')
      .eq('beneficiario_uid', beneficiarioUid)
      .maybeSingle()
    if (errV) throw errV
    if (!vivienda) return res.status(404).json({ success:false, message:'No tienes una vivienda asignada' })
    const { data: form, error: errForm } = await supabase
      .from('vivienda_postventa_form')
      .select('*')
      .eq('id_vivienda', vivienda.id_vivienda)
      .eq('beneficiario_uid', beneficiarioUid)
      .order('id',{ ascending:false })
      .limit(1)
    if (errForm) throw errForm
    if (!form?.length) return res.json({ success:true, data:null })
    const currentForm = form[0]
    const { data: items, error: errItems } = await supabase
      .from('vivienda_postventa_item')
      .select('*')
      .eq('form_id', currentForm.id)
      .order('id',{ ascending:true })
    if (errItems) throw errItems
    // Intentar enriquecer con información de habitaciones (rooms) del template usado
    let enriched = items || []
    try {
      // Buscar template que calce con la version usada en el form y tipo de vivienda
      const { data: tplArr, error: errTpl } = await supabase
        .from('postventa_template')
        .select('id, version, tipo_vivienda')
        .eq('version', currentForm.template_version)
        .or(`tipo_vivienda.eq.${vivienda.tipo_vivienda},tipo_vivienda.is.null`)
        .order('tipo_vivienda', { ascending: false })
        .order('id', { ascending: false })
        .limit(1)
      if (errTpl) throw errTpl
      const tpl = tplArr?.[0]
      if (tpl?.id) {
        const [{ data: tplItems, error: errTplItems }, { data: rooms, error: errRooms }] = await Promise.all([
          supabase.from('postventa_template_item').select('id, orden, room_id, item').eq('template_id', tpl.id).order('orden', { ascending: true, nullsFirst: false }).order('id', { ascending: true }),
          supabase.from('postventa_template_room').select('id, nombre').eq('template_id', tpl.id)
        ])
        if (errTplItems) throw errTplItems
        if (errRooms) throw errRooms
        const tplSeq = tplItems || []
        const roomNameById = new Map((rooms || []).map(r => [r.id, r.nombre]))
        enriched = (items || []).map((it, idx) => {
          const match = tplSeq[idx]
          const room_id = match?.room_id ?? null
          const room_nombre = room_id ? (roomNameById.get(room_id) || 'Habitación') : 'General'
          return { ...it, room_id, room_nombre }
        })
      }
    } catch (e) {
      // Si falla el enriquecimiento, devolvemos items tal cual
      console.warn('Posventa: no se pudo enriquecer con rooms:', e?.message || e)
    }
    return res.json({ success:true, data:{ form: currentForm, items: enriched } })
  } catch (error) {
    console.error('Error getPosventaForm:', error)
    return res.status(500).json({ success:false, message:'Error obteniendo formulario de posventa' })
  }
}

export async function createPosventaForm(req, res) {
  try {
    const beneficiarioUid = req.user?.uid || req.user?.sub
    if (!beneficiarioUid) return res.status(401).json({ success:false, message:'No autenticado' })
    const { data: vivienda, error: errV } = await supabase
      .from('viviendas')
      .select('id_vivienda, tipo_vivienda, estado')
      .eq('beneficiario_uid', beneficiarioUid)
      .maybeSingle()
    if (errV) throw errV
    if (!vivienda) return res.status(404).json({ success:false, message:'No tienes una vivienda asignada' })
    const estViv = (vivienda.estado||'').toLowerCase()
    if (!['entregada','entregada_inicial'].includes(estViv)) {
      return res.status(400).json({ success:false, message:'La vivienda debe estar en estado Entregada (inicial) para iniciar posventa' })
    }
    const { data: existing, error: errExist } = await supabase
      .from('vivienda_postventa_form')
      .select('id, estado')
      .eq('id_vivienda', vivienda.id_vivienda)
      .eq('beneficiario_uid', beneficiarioUid)
      .order('id',{ ascending:false })
      .limit(1)
    if (errExist) throw errExist
    if (existing?.length && ['borrador','enviada'].includes(existing[0].estado)) return res.status(409).json({ success:false, message:'Ya existe un formulario activo' })
    const { data: template, error: errTpl } = await supabase
      .from('postventa_template')
      .select('*')
      .eq('activo', true)
      .or(`tipo_vivienda.eq.${vivienda.tipo_vivienda},tipo_vivienda.is.null`)
      .order('tipo_vivienda',{ ascending:false })
      .order('version',{ ascending:false })
      .order('id',{ ascending:false })
      .limit(1)
    if (errTpl) throw errTpl
    if (!template?.length) return res.status(400).json({ success:false, message:`No hay template de posventa activo para el tipo de vivienda '${vivienda.tipo_vivienda || 'desconocido'}'` })
    const tpl = template[0]
    let newFormArr = null
    try {
      const res = await supabase
        .from('vivienda_postventa_form')
        .insert([{ id_vivienda: vivienda.id_vivienda, beneficiario_uid: beneficiarioUid, estado:'borrador', template_version: tpl.version, template_id: tpl.id }])
        .select('*')
      if (res.error) throw res.error
      newFormArr = res.data
    } catch (e) {
      if (e?.code === '42703') {
        // Columna template_id no existe aún: insertar sin ese campo
        const res2 = await supabase
          .from('vivienda_postventa_form')
          .insert([{ id_vivienda: vivienda.id_vivienda, beneficiario_uid: beneficiarioUid, estado:'borrador', template_version: tpl.version }])
          .select('*')
        if (res2.error) throw res2.error
        newFormArr = res2.data
      } else {
        throw e
      }
    }
    const newForm = newFormArr[0]
    const { data: tplItems, error: errTplItems } = await supabase
      .from('postventa_template_item')
      .select('*')
      .eq('template_id', tpl.id)
      .order('orden',{ ascending:true, nullsFirst: false })
      .order('id',{ ascending:true })
    if (errTplItems) throw errTplItems
    if (tplItems?.length) {
      const insertItems = tplItems.map((it, idx) => ({ 
        form_id: newForm.id, 
        categoria: it.categoria, 
        item: it.item, 
        ok: true, 
        severidad: null, 
        comentario: null, 
        crear_incidencia: true,  // Cambiado a true por defecto para que al marcar problema se cree incidencia
        orden: idx + 1 
      }))
      const { error: errInsItems } = await supabase.from('vivienda_postventa_item').insert(insertItems)
      if (errInsItems) throw errInsItems
    }
    return getPosventaForm(req,res)
  } catch (error) {
    console.error('Error createPosventaForm:', error)
    return res.status(500).json({ success:false, message:'Error creando formulario de posventa' })
  }
}

export async function savePosventaItems(req, res) {
  try {
    const beneficiarioUid = req.user?.uid || req.user?.sub
    const { items } = req.body || {}
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ success:false, message:'Items requeridos' })
    const { data: forms, error: errForm } = await supabase
      .from('vivienda_postventa_form')
      .select('*')
      .eq('beneficiario_uid', beneficiarioUid)
      .order('id',{ ascending:false })
      .limit(1)
    if (errForm) throw errForm
    if (!forms?.length) return res.status(404).json({ success:false, message:'No hay formulario para actualizar' })
    const form = forms[0]
    if (form.estado !== 'borrador') return res.status(400).json({ success:false, message:'Formulario no editable' })
    for (const it of items) {
      if (!it.id) continue
      const update = { 
        ok: !!it.ok, 
        severidad: it.ok ? null : (it.severidad || null), 
        comentario: it.comentario || null, 
        crear_incidencia: !it.ok ? (it.crear_incidencia !== false) : false 
      }
      console.log(`📝 Actualizando item ${it.id}: ok=${update.ok}, crear_incidencia=${update.crear_incidencia}`)
      const { error: errUp } = await supabase
        .from('vivienda_postventa_item')
        .update(update)
        .eq('id', it.id)
        .eq('form_id', form.id)
      if (errUp) throw errUp
    }
    return getPosventaForm(req,res)
  } catch (error) {
    console.error('Error savePosventaItems:', error)
    return res.status(500).json({ success:false, message:'Error guardando items' })
  }
}

export async function sendPosventaForm(req, res) {
  try {
    const beneficiarioUid = req.user?.uid || req.user?.sub
    const { data: forms, error: errForm } = await supabase
      .from('vivienda_postventa_form')
      .select('*')
      .eq('beneficiario_uid', beneficiarioUid)
      .order('id',{ ascending:false })
      .limit(1)
    if (errForm) throw errForm
    if (!forms?.length) return res.status(404).json({ success:false, message:'No hay formulario para enviar' })
    const form = forms[0]
    if (form.estado !== 'borrador') return res.status(400).json({ success:false, message:'Formulario ya enviado' })
    const { error: errUp } = await supabase
      .from('vivienda_postventa_form')
      .update({ estado:'enviada', fecha_enviada: new Date().toISOString() })
      .eq('id', form.id)
    if (errUp) throw errUp
    return getPosventaForm(req,res)
  } catch (error) {
    console.error('Error sendPosventaForm:', error)
    return res.status(500).json({ success:false, message:'Error enviando formulario' })
  }
}

// Devuelve los planos del template asociado al formulario de posventa activo del beneficiario
export async function getPosventaPlans(req, res) {
  try {
    const beneficiarioUid = req.user?.uid || req.user?.sub
    if (!beneficiarioUid) return res.status(401).json({ success:false, message:'No autenticado' })
    // Obtener vivienda y formulario más reciente
    const { data: vivienda, error: errV } = await supabase
      .from('viviendas')
      .select('id_vivienda, tipo_vivienda')
      .eq('beneficiario_uid', beneficiarioUid)
      .maybeSingle()
    if (errV) throw errV
    if (!vivienda) return res.status(404).json({ success:false, message:'No tienes vivienda asignada' })
    let formArr = null
    try {
      const res = await supabase
        .from('vivienda_postventa_form')
        .select('id, template_version, template_id')
        .eq('id_vivienda', vivienda.id_vivienda)
        .eq('beneficiario_uid', beneficiarioUid)
        .order('id',{ ascending:false })
        .limit(1)
      if (res.error) throw res.error
      formArr = res.data
    } catch (e) {
      // Fallback si la columna template_id no existe aún
      if (e?.code === '42703') {
        const res2 = await supabase
          .from('vivienda_postventa_form')
          .select('id, template_version')
          .eq('id_vivienda', vivienda.id_vivienda)
          .eq('beneficiario_uid', beneficiarioUid)
          .order('id',{ ascending:false })
          .limit(1)
        if (res2.error) throw res2.error
        formArr = res2.data
      } else {
        throw e
      }
    }
    if (!formArr?.length) return res.json({ success:true, data: [] })
    const form = formArr[0]
    // Si el form ya guarda template_id, usarlo directamente
    if (form.template_id) {
      const files = await listTemplatePlans(form.template_id)
      if (files?.length) return res.json({ success:true, data: files })
    }
    // Resolver template por version y tipo (fallback)
    const { data: tplArr, error: errTpl } = await supabase
      .from('postventa_template')
      .select('id, version, tipo_vivienda')
      .eq('version', form.template_version)
      .or(`tipo_vivienda.eq.${vivienda.tipo_vivienda || ''},tipo_vivienda.is.null`)
      .order('tipo_vivienda', { ascending: false })
      .order('id', { ascending: false })
      .limit(1)
    if (errTpl) throw errTpl
    let tpl = tplArr?.[0] || null
    let files = []
    if (tpl?.id) {
      files = await listTemplatePlans(tpl.id)
    }
    // Fallback: buscar cualquier template con la misma versión que tenga archivos
    if (!files?.length) {
      const { data: allSameVersion, error: errAll } = await supabase
        .from('postventa_template')
        .select('id, version, tipo_vivienda')
        .eq('version', form.template_version)
        .order('tipo_vivienda', { ascending: false })
        .order('id', { ascending: false })
      if (errAll) throw errAll
      for (const t of allSameVersion || []) {
        const f = await listTemplatePlans(t.id)
        if (f?.length) { files = f; tpl = t; break }
      }
    }
    // Último fallback: template activo más reciente para el tipo de vivienda
    if (!files?.length) {
      const { data: activeTpl, error: errAct } = await supabase
        .from('postventa_template')
        .select('id, version, tipo_vivienda')
        .eq('activo', true)
        .or(`tipo_vivienda.eq.${vivienda.tipo_vivienda || ''},tipo_vivienda.is.null`)
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
    console.error('Error getPosventaPlans:', error)
    return res.status(500).json({ success:false, message:'Error obteniendo planos' })
  }
}

// ==== DEV ONLY: Resetear formulario de posventa del beneficiario y recrear desde el template activo ====
export async function resetPosventaForm(req, res) {
  try {
    if ((process.env.NODE_ENV || 'development') === 'production') {
      return res.status(403).json({ success:false, message:'No permitido en producción' })
    }
    const beneficiarioUid = req.user?.uid || req.user?.sub
    if (!beneficiarioUid) return res.status(401).json({ success:false, message:'No autenticado' })
    const { data: vivienda, error: errV } = await supabase
      .from('viviendas')
      .select('id_vivienda, tipo_vivienda, estado')
      .eq('beneficiario_uid', beneficiarioUid)
      .maybeSingle()
    if (errV) throw errV
    if (!vivienda) return res.status(404).json({ success:false, message:'No tienes una vivienda asignada' })

    // Eliminar formularios existentes del beneficiario para esta vivienda
    const { error: errDel } = await supabase
      .from('vivienda_postventa_form')
      .delete()
      .eq('id_vivienda', vivienda.id_vivienda)
      .eq('beneficiario_uid', beneficiarioUid)
    if (errDel) throw errDel

    // Crear uno nuevo desde el template activo, sin exigir que la vivienda esté 'entregada' (solo DEV)
    const { data: template, error: errTpl } = await supabase
      .from('postventa_template')
      .select('*')
      .eq('activo', true)
      .or(`tipo_vivienda.eq.${vivienda.tipo_vivienda},tipo_vivienda.is.null`)
      .order('tipo_vivienda',{ ascending:false })
      .order('version',{ ascending:false })
      .order('id',{ ascending:false })
      .limit(1)
    if (errTpl) throw errTpl
    if (!template?.length) return res.status(400).json({ success:false, message:`No hay template de posventa activo para el tipo de vivienda '${vivienda.tipo_vivienda || 'general'}'` })
    const tpl = template[0]

    let newFormArr = null
    try {
      const res = await supabase
        .from('vivienda_postventa_form')
        .insert([{ id_vivienda: vivienda.id_vivienda, beneficiario_uid: beneficiarioUid, estado:'borrador', template_version: tpl.version, template_id: tpl.id }])
        .select('*')
      if (res.error) throw res.error
      newFormArr = res.data
    } catch (e) {
      if (e?.code === '42703') {
        const res2 = await supabase
          .from('vivienda_postventa_form')
          .insert([{ id_vivienda: vivienda.id_vivienda, beneficiario_uid: beneficiarioUid, estado:'borrador', template_version: tpl.version }])
          .select('*')
        if (res2.error) throw res2.error
        newFormArr = res2.data
      } else {
        throw e
      }
    }
    const newForm = newFormArr?.[0]

    const { data: tplItems, error: errTplItems } = await supabase
      .from('postventa_template_item')
      .select('*')
      .eq('template_id', tpl.id)
      .order('orden',{ ascending:true, nullsFirst: false })
      .order('id',{ ascending:true })
    if (errTplItems) throw errTplItems
    if (tplItems?.length && newForm?.id) {
      const insertItems = tplItems.map((it, idx) => ({ 
        form_id: newForm.id, 
        categoria: it.categoria, 
        item: it.item, 
        ok: true, 
        severidad: null, 
        comentario: null, 
        crear_incidencia: true,  // Cambiado a true por defecto
        orden: idx + 1 
      }))
      const { error: errInsItems } = await supabase.from('vivienda_postventa_item').insert(insertItems)
      if (errInsItems) throw errInsItems
    }
    // Devolver el formulario recién creado (enriquecido con rooms si aplica)
    return getPosventaForm(req, res)
  } catch (error) {
    console.error('Error resetPosventaForm:', error)
    return res.status(500).json({ success:false, message:'Error reseteando formulario de posventa' })
  }
}

/**
 * Controlador de Templates de Postventa (solo Admin)
 */
import { supabase } from '../supabaseClient.js'
import fetch from 'node-fetch'
import multer from 'multer'
import { listTemplatePlans, uploadTemplatePlan, deleteTemplatePlan, getSignedOrPublicUrlForPlan, getPlanosBucketName } from '../services/MediaService.js'
import { convertDWGUrlToPDF } from '../services/ConversionService.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })
function runMulter(req, res) {
  return new Promise((resolve, reject) => {
    upload.single('file')(req, res, (err) => (err ? reject(err) : resolve()))
  })
}

// Nota: mantenemos compatibilidad de campos extra, pero el front hoy solo usa 'item' y 'room_id'.

// ==================== Templates ====================
export async function listTemplates(req, res) {
  try {
    const { tipo_vivienda, activo } = req.query || {}
    let query = supabase.from('postventa_template').select('*').order('tipo_vivienda', { ascending: true }).order('version', { ascending: false })
    if (tipo_vivienda) query = query.eq('tipo_vivienda', tipo_vivienda)
    if (typeof activo !== 'undefined') query = query.eq('activo', String(activo) === 'true')
    const { data, error } = await query
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    console.error('Error listando templates:', error)
    res.status(500).json({ success: false, message: 'Error listando templates' })
  }
}

export async function createTemplate(req, res) {
  try {
    const { nombre, tipo_vivienda } = req.body || {}
    if (!nombre) return res.status(400).json({ success: false, message: 'nombre es obligatorio' })

    // Calcular próxima versión por tipo_vivienda
    let nextVersion = 1
    if (tipo_vivienda) {
      const { data: rows, error: errMax } = await supabase
        .from('postventa_template')
        .select('version')
        .eq('tipo_vivienda', tipo_vivienda)
        .order('version', { ascending: false })
        .limit(1)
      if (errMax) throw errMax
      if (rows && rows.length) nextVersion = Number(rows[0].version) + 1
    }

    // Desactivar versiones activas previas del mismo tipo
    if (tipo_vivienda) {
      await supabase.from('postventa_template').update({ activo: false }).eq('tipo_vivienda', tipo_vivienda).eq('activo', true)
    }

    const payload = { nombre, tipo_vivienda: tipo_vivienda || null, version: nextVersion, activo: true }
    const { data, error } = await supabase
      .from('postventa_template')
      .insert([payload])
      .select('*')
      .single()
    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (error) {
    console.error('Error creando template:', error)
    res.status(500).json({ success: false, message: 'Error creando template' })
  }
}

export async function updateTemplate(req, res) {
  try {
    const id = Number(req.params.id)
    const { nombre, activo } = req.body || {}
    if (!id) return res.status(400).json({ success: false, message: 'id inválido' })

    // Si se activa, desactivar otros del mismo tipo
    let updates = {}
    if (typeof nombre !== 'undefined') updates.nombre = nombre
    if (typeof activo !== 'undefined') updates.activo = !!activo

    if (!Object.keys(updates).length) return res.status(400).json({ success: false, message: 'Nada que actualizar' })

    if (typeof activo !== 'undefined' && activo) {
      const { data: tpl, error: e1 } = await supabase.from('postventa_template').select('id, tipo_vivienda').eq('id', id).single()
      if (e1) throw e1
      if (tpl?.tipo_vivienda) {
        await supabase.from('postventa_template').update({ activo: false }).eq('tipo_vivienda', tpl.tipo_vivienda).neq('id', id)
      }
    }

    const { data, error } = await supabase.from('postventa_template').update(updates).eq('id', id).select('*').single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    console.error('Error actualizando template:', error)
    res.status(500).json({ success: false, message: 'Error actualizando template' })
  }
}

export async function deactivateTemplate(req, res) {
  try {
    const id = Number(req.params.id)
    const { data, error } = await supabase.from('postventa_template').update({ activo: false }).eq('id', id).select('*').single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    console.error('Error desactivando template:', error)
    res.status(500).json({ success: false, message: 'Error desactivando template' })
  }
}

// ==================== Items ====================
export async function listTemplateItems(req, res) {
  try {
    const templateId = Number(req.params.id)
    const { data, error } = await supabase
      .from('postventa_template_item')
      .select('*')
      .eq('template_id', templateId)
      .order('orden', { ascending: true })
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    console.error('Error listando items del template:', error)
    res.status(500).json({ success: false, message: 'Error listando items del template' })
  }
}

export async function addTemplateItems(req, res) {
  try {
    const templateId = Number(req.params.id)
    const { items } = req.body || {}
    const arr = Array.isArray(items) ? items : []
    if (!arr.length) return res.status(400).json({ success: false, message: 'items es requerido (array)' })

    const payload = arr.map((it, idx) => ({
      template_id: templateId,
      categoria: it.categoria || 'General',
      item: it.item,
      orden: typeof it.orden === 'number' ? it.orden : idx + 1,
      severidad_sugerida: null,
      room_id: typeof it.room_id === 'number' ? it.room_id : (it.room_id ? Number(it.room_id) : null)
    }))
    const { data, error } = await supabase.from('postventa_template_item').insert(payload).select('*')
    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (error) {
    console.error('Error agregando items al template:', error)
    res.status(500).json({ success: false, message: 'Error agregando items al template' })
  }
}

export async function updateTemplateItem(req, res) {
  try {
    const templateId = Number(req.params.id)
    const itemId = Number(req.params.itemId)
  const { categoria, item, orden } = req.body || {}
    const updates = {}
    if (typeof categoria !== 'undefined') updates.categoria = categoria
    if (typeof item !== 'undefined') updates.item = item
    if (typeof orden !== 'undefined') updates.orden = Number(orden)
  if (typeof req.body?.room_id !== 'undefined') updates.room_id = req.body.room_id ? Number(req.body.room_id) : null
    if (!Object.keys(updates).length) return res.status(400).json({ success: false, message: 'Nada que actualizar' })

    const { data, error } = await supabase
      .from('postventa_template_item')
      .update(updates)
      .eq('template_id', templateId)
      .eq('id', itemId)
      .select('*')
      .single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    console.error('Error actualizando item del template:', error)
    res.status(500).json({ success: false, message: 'Error actualizando item del template' })
  }
}

// ==================== Rooms (Habitaciones) ====================
export async function listRooms(req, res) {
  try {
    const templateId = Number(req.params.id)
    const { data, error } = await supabase
      .from('postventa_template_room')
      .select('*')
      .eq('template_id', templateId)
      .order('orden', { ascending: true })
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    console.error('Error listando habitaciones:', error)
    res.status(500).json({ success: false, message: 'Error listando habitaciones' })
  }
}

export async function createRoom(req, res) {
  try {
    const templateId = Number(req.params.id)
    const { nombre, orden } = req.body || {}
    if (!nombre) return res.status(400).json({ success: false, message: 'nombre es obligatorio' })
    const payload = { template_id: templateId, nombre, orden: typeof orden === 'number' ? orden : null }
    const { data, error } = await supabase.from('postventa_template_room').insert([payload]).select('*').single()
    if (error) throw error
    res.status(201).json({ success: true, data })
  } catch (error) {
    console.error('Error creando habitación:', error)
    res.status(500).json({ success: false, message: 'Error creando habitación' })
  }
}

export async function updateRoom(req, res) {
  try {
    const templateId = Number(req.params.id)
    const roomId = Number(req.params.roomId)
    const { nombre, orden } = req.body || {}
    const updates = {}
    if (typeof nombre !== 'undefined') updates.nombre = nombre
    if (typeof orden !== 'undefined') updates.orden = Number(orden)
    if (!Object.keys(updates).length) return res.status(400).json({ success: false, message: 'Nada que actualizar' })
    const { data, error } = await supabase
      .from('postventa_template_room')
      .update(updates)
      .eq('template_id', templateId)
      .eq('id', roomId)
      .select('*')
      .single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    console.error('Error actualizando habitación:', error)
    res.status(500).json({ success: false, message: 'Error actualizando habitación' })
  }
}

export async function deleteRoom(req, res) {
  try {
    const templateId = Number(req.params.id)
    const roomId = Number(req.params.roomId)
    const { error } = await supabase
      .from('postventa_template_room')
      .delete()
      .eq('template_id', templateId)
      .eq('id', roomId)
    if (error) throw error
    res.json({ success: true })
  } catch (error) {
    console.error('Error eliminando habitación:', error)
    res.status(500).json({ success: false, message: 'Error eliminando habitación' })
  }
}

// ==================== Archivos (Planos) por Template ====================
export async function listTemplateFiles(req, res) {
  try {
    const templateId = Number(req.params.id)
    if (!templateId) return res.status(400).json({ success:false, message:'ID inválido' })
    const files = await listTemplatePlans(templateId)
    return res.json({ success:true, data: files })
  } catch (error) {
    console.error('Error listando planos del template:', error)
    return res.status(500).json({ success:false, message:'Error listando archivos' })
  }
}

export async function uploadTemplateFile(req, res) {
  try {
    await runMulter(req, res)
    const templateId = Number(req.params.id)
    if (!templateId) return res.status(400).json({ success:false, message:'ID inválido' })
    if (!req.file) return res.status(400).json({ success:false, message:'Archivo requerido' })
    const uploader = req.user?.uid || req.user?.sub || null
    const saved = await uploadTemplatePlan(templateId, req.file, uploader)
    return res.status(201).json({ success:true, data: saved })
  } catch (error) {
    console.error('Error subiendo plano del template:', error)
    return res.status(500).json({ success:false, message:'Error subiendo archivo' })
  }
}

export async function deleteTemplateFile(req, res) {
  try {
    const templateId = Number(req.params.id)
    const fileId = Number(req.params.fileId)
    if (!templateId || !fileId) return res.status(400).json({ success:false, message:'Parámetros inválidos' })
    await deleteTemplatePlan(templateId, fileId)
    return res.json({ success:true })
  } catch (error) {
    console.error('Error eliminando plano del template:', error)
    return res.status(500).json({ success:false, message:'Error eliminando archivo' })
  }
}

export async function deleteTemplateItem(req, res) {
  try {
    const templateId = Number(req.params.id)
    const itemId = Number(req.params.itemId)
    const { error } = await supabase
      .from('postventa_template_item')
      .delete()
      .eq('template_id', templateId)
      .eq('id', itemId)
    if (error) throw error
    res.json({ success: true })
  } catch (error) {
    console.error('Error eliminando item del template:', error)
    res.status(500).json({ success: false, message: 'Error eliminando item del template' })
  }
}

// ==================== Conversión DWG -> PDF (opcional, via CloudConvert) ====================
export async function convertTemplateFileToPdf(req, res) {
  try {
    const templateId = Number(req.params.id)
    const fileId = Number(req.params.fileId)
    if (!templateId || !fileId) return res.status(400).json({ success:false, message:'Parámetros inválidos' })

    if (!process.env.CLOUDCONVERT_API_KEY) {
      return res.status(501).json({ success:false, message:'Conversión no configurada. Falta CLOUDCONVERT_API_KEY.' })
    }

    // Buscar media row para validar DWG y obtener path
    const { data: mediaRow, error: selErr } = await supabase
      .from('media')
      .select('id, path, mime')
      .eq('entity_type', 'postventa_template')
      .eq('entity_id', templateId)
      .eq('id', fileId)
      .single()
    if (selErr) throw selErr
    if (!mediaRow) return res.status(404).json({ success:false, message:'Archivo no encontrado' })

    const isDWG = (mediaRow.mime || '').toLowerCase().includes('dwg') || /\.dwg$/i.test(mediaRow.path)
    if (!isDWG) {
      return res.status(400).json({ success:false, message:'El archivo no es DWG' })
    }

    // Obtener URL firmada o pública para que CloudConvert pueda descargar el DWG
    const inputUrl = await getSignedOrPublicUrlForPlan(mediaRow.path)
    if (!inputUrl) return res.status(500).json({ success:false, message:'No se pudo obtener URL del archivo DWG' })

    // Lanzar conversión y esperar resultado (sin colas por ahora)
    const result = await convertDWGUrlToPDF(inputUrl)
    const outUrl = result?.url
    const outName = (result?.filename || 'plano.pdf').replace(/[^a-zA-Z0-9_.-]/g, '_')
    if (!outUrl) throw new Error('Conversión sin URL de salida')

    // Descargar PDF resultante en buffer
    const resp = await fetch(outUrl)
    if (!resp.ok) throw new Error(`Error descargando PDF convertido: HTTP ${resp.status}`)
    const buf = Buffer.from(await resp.arrayBuffer())

    // Subir al bucket de planos bajo el mismo template
    const storagePath = `templates/${templateId}/${Date.now()}_${outName}`
    const bucket = getPlanosBucketName()
    const { error: upErr } = await supabase.storage.from(bucket).upload(storagePath, buf, { contentType: 'application/pdf', upsert: false })
    if (upErr) throw upErr

    // Registrar en media
    const { data: row, error: dbErr } = await supabase
      .from('media')
      .insert([{ entity_type: 'postventa_template', entity_id: templateId, path: storagePath, mime: 'application/pdf', bytes: buf.length, uploaded_by: req.user?.uid || req.user?.sub || null }])
      .select('id, path, mime, bytes, created_at')
      .single()
    if (dbErr) throw dbErr

    // Devolver nueva entrada
    const files = await listTemplatePlans(templateId)
    const added = files.find(f => f.id === row.id) || null
    return res.status(201).json({ success:true, data: added, message:'PDF generado desde DWG' })
  } catch (error) {
    console.error('Error convirtiendo DWG a PDF:', error)
    const msg = error?.code === 'NO_API_KEY' ? 'Conversión no configurada (falta CLOUDCONVERT_API_KEY)' : 'Error en conversión DWG->PDF'
    return res.status(500).json({ success:false, message: msg })
  }
}

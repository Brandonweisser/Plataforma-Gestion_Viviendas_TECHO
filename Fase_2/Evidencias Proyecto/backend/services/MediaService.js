/**
 * Servicio de Media: subir y listar archivos asociados a entidades
 */
import { supabase } from '../supabaseClient.js'

const DEFAULT_BUCKET = process.env.MEDIA_BUCKET || 'incidencias'
const PLANOS_BUCKET = process.env.PLANOS_BUCKET || 'planos'

async function ensureStorageBucket(bucket, options = { public: true }) {
  try {
    // Verificar si el bucket existe
    const { data: existing, error: getErr } = await supabase.storage.getBucket(bucket)
    if (existing && !getErr) return true
  } catch (_) {
    // si falla getBucket, intentamos crear
  }
  try {
    const { error: createErr } = await supabase.storage.createBucket(bucket, options)
    if (createErr) {
      // Si ya existe, ignoramos; otros errores se propagan
      const msg = createErr?.message || ''
      if (!/exists|already/i.test(msg)) throw createErr
    }
    return true
  } catch (e) {
    // No pudimos garantizar el bucket; se propagará y el caller decidirá
    throw e
  }
}

async function urlFor(path, bucket = DEFAULT_BUCKET) {
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    if (data?.publicUrl) return data.publicUrl
  } catch (_) {}
  try {
    const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 7) // 7 días
    return data?.signedUrl || null
  } catch (_) {
    return null
  }
}

export async function listMediaForIncidencias(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return {}
  const { data, error } = await supabase
    .from('media')
    .select('id, entity_id, path, mime, bytes, created_at')
    .eq('entity_type', 'incidencia')
    .in('entity_id', ids)

  if (error) throw error

  const grouped = {}
  for (const m of data || []) {
    const url = (await urlFor(m.path)) || m.path
    const item = { id: m.id, url, mime: m.mime, bytes: m.bytes, created_at: m.created_at }
    if (!grouped[m.entity_id]) grouped[m.entity_id] = []
    grouped[m.entity_id].push(item)
  }
  return grouped
}

function sanitizeFilename(name = '') {
  return name.replace(/[^a-zA-Z0-9_.-]/g, '_')
}

export async function uploadIncidenciaMedia(incidenciaId, file, uploaderUid) {
  if (!file || !file.buffer) {
    throw new Error('Archivo no recibido')
  }
  const fileName = `${Date.now()}_${sanitizeFilename(file.originalname || 'foto')}`
  const storagePath = `incidencias/${incidenciaId}/${fileName}`

  const { error: upErr } = await supabase
    .storage
    .from(DEFAULT_BUCKET)
    .upload(storagePath, file.buffer, { contentType: file.mimetype || 'application/octet-stream', upsert: false })
  if (upErr) throw upErr

  const { data: row, error: dbErr } = await supabase
    .from('media')
    .insert([{ entity_type: 'incidencia', entity_id: incidenciaId, path: storagePath, mime: file.mimetype || null, bytes: file.size || null, uploaded_by: uploaderUid || null }])
    .select('id, path, mime, bytes, created_at')
    .single()
  if (dbErr) throw dbErr

  const url = await urlFor(row.path)
  return { id: row.id, url: url || row.path, mime: row.mime, bytes: row.bytes, created_at: row.created_at }
}

// ======== Planos de Template de Postventa ========
export async function listTemplatePlans(templateId) {
  if (!templateId) return []
  const { data, error } = await supabase
    .from('media')
    .select('id, path, mime, bytes, created_at')
    .eq('entity_type', 'postventa_template')
    .eq('entity_id', templateId)
    .order('id', { ascending: false })
  if (error) throw error
  const out = []
  for (const m of data || []) {
    const url = (await urlFor(m.path, PLANOS_BUCKET)) || `${process.env.SUPABASE_URL}/storage/v1/object/public/${PLANOS_BUCKET}/${m.path}`
    out.push({ id: m.id, url, mime: m.mime, bytes: m.bytes, created_at: m.created_at })
  }
  return out
}

export async function uploadTemplatePlan(templateId, file, uploaderUid) {
  if (!file || !file.buffer) throw new Error('Archivo no recibido')
  const fileName = `${Date.now()}_${sanitizeFilename(file.originalname || 'plano')}`
  const storagePath = `templates/${templateId}/${fileName}`

  // Asegurar que el bucket para planos exista (crea si no existe)
  await ensureStorageBucket(PLANOS_BUCKET, { public: true })

  const { error: upErr } = await supabase
    .storage
    .from(PLANOS_BUCKET)
    .upload(storagePath, file.buffer, { contentType: file.mimetype || 'application/octet-stream', upsert: false })
  if (upErr) throw upErr

  const { data: row, error: dbErr } = await supabase
    .from('media')
    .insert([{ entity_type: 'postventa_template', entity_id: templateId, path: storagePath, mime: file.mimetype || null, bytes: file.size || null, uploaded_by: uploaderUid || null }])
    .select('id, path, mime, bytes, created_at')
    .single()
  if (dbErr) throw dbErr

  const url = await urlFor(row.path, PLANOS_BUCKET)
  return { id: row.id, url: url || row.path, mime: row.mime, bytes: row.bytes, created_at: row.created_at }
}

export async function deleteTemplatePlan(templateId, fileId) {
  // Buscar el registro para obtener el path
  const { data: row, error: selErr } = await supabase
    .from('media')
    .select('id, path')
    .eq('entity_type', 'postventa_template')
    .eq('entity_id', templateId)
    .eq('id', fileId)
    .single()
  if (selErr) throw selErr
  if (!row) return { success: false, message: 'Archivo no encontrado' }

  // Eliminar del storage (ignorar error si no existe)
  try {
    await ensureStorageBucket(PLANOS_BUCKET, { public: true })
    await supabase.storage.from(PLANOS_BUCKET).remove([row.path])
  } catch (_) {}

  // Eliminar metadata de DB
  const { error: delErr } = await supabase
    .from('media')
    .delete()
    .eq('id', fileId)
    .eq('entity_type', 'postventa_template')
    .eq('entity_id', templateId)
  if (delErr) throw delErr
  return { success: true }
}

// ======== Utilidades adicionales para Planos ========
export function getPlanosBucketName() {
  return PLANOS_BUCKET
}

export async function getSignedOrPublicUrlForPlan(path) {
  return (await urlFor(path, PLANOS_BUCKET))
}


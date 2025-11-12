import multer from 'multer'
import crypto from 'crypto'
import { supabase } from '../supabaseClient.js'

// Configuración de subida: memoria, 8MB por archivo
const storage = multer.memoryStorage()
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024, files: 1 } })

function runMulterSingle(req, res) {
  return new Promise((resolve, reject) => {
    upload.single('file')(req, res, err => {
      if (err) reject(err)
      else resolve()
    })
  })
}

async function ensurePublicBucket(bucket) {
  try {
    const { data } = await supabase.storage.getBucket(bucket)
    if (data) return true
  } catch (_) {}
  const { error } = await supabase.storage.createBucket(bucket, { public: true })
  if (error && !/exists|already/i.test(error.message || '')) throw error
  return true
}

export async function uploadPosventaItemFoto(req, res) {
  try {
    const beneficiarioUid = req.user?.uid || req.user?.sub
    const itemId = Number(req.params.itemId)
    if (!beneficiarioUid) return res.status(401).json({ success:false, message:'No autenticado' })
    if (!itemId) return res.status(400).json({ success:false, message:'ID de ítem inválido' })

    // Cargar ítem y validar propiedad + estado del formulario (borrador)
    const { data: itemRows, error: itemErr } = await supabase
      .from('vivienda_postventa_item')
      .select('id, fotos_json, form_id, form:vivienda_postventa_form!inner(id, estado, beneficiario_uid)')
      .eq('id', itemId)
      .limit(1)
    if (itemErr) throw itemErr
    const item = Array.isArray(itemRows) && itemRows[0] || null
    if (!item) return res.status(404).json({ success:false, message:'Ítem no encontrado' })
    if (item.form?.beneficiario_uid !== beneficiarioUid) {
      return res.status(403).json({ success:false, message:'No puedes adjuntar fotos a este ítem' })
    }
    if ((item.form?.estado || '').toLowerCase() !== 'borrador') {
      return res.status(400).json({ success:false, message:'El formulario no está en estado borrador' })
    }

    // Normalizar arreglo de fotos
    let fotos = []
    try {
      if (Array.isArray(item.fotos_json)) fotos = item.fotos_json
      else if (typeof item.fotos_json === 'string') fotos = JSON.parse(item.fotos_json || '[]')
    } catch(_) { fotos = [] }

    if (fotos.length >= 15) {
      return res.status(400).json({ success:false, message:'Máximo 15 fotos por ítem' })
    }

    await runMulterSingle(req, res)
    const file = req.file
    if (!file) return res.status(400).json({ success:false, message:'Archivo no recibido' })

    const bucket = process.env.POSTVENTA_BUCKET || 'posventa'
    await ensurePublicBucket(bucket)

    const ext = (file.originalname?.split('.').pop() || 'jpg').toLowerCase()
    const randomName = crypto.randomUUID() + '.' + ext
    const path = `${itemId}/${randomName}`

    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(path, file.buffer, { contentType: file.mimetype || 'application/octet-stream', upsert: false })
    if (upErr) throw upErr

    // URL pública
    let url = ''
    try {
      const { data } = await supabase.storage.from(bucket).getPublicUrl(path)
      url = data?.publicUrl || ''
    } catch(_) {}
    if (!url) url = `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`

    // Agregar URL a fotos_json (limitando a 15)
    const nuevas = [...fotos, url].slice(0, 15)
    const { error: upDbErr, data: updated } = await supabase
      .from('vivienda_postventa_item')
      .update({ fotos_json: nuevas })
      .eq('id', itemId)
      .select('id, fotos_json')
      .single()
    if (upDbErr) throw upDbErr

    // Registrar en media (opcional)
    try {
      await supabase
        .from('media')
        .insert([{ entity_type: 'postventa_item', entity_id: itemId, path: path, mime: file.mimetype || null, bytes: file.size || null, uploaded_by: beneficiarioUid, metadata: { original: file.originalname } }])
    } catch(_) {}

    return res.json({ success:true, data: { id: updated.id, fotos_json: updated.fotos_json, url }, message: 'Foto agregada' })
  } catch (error) {
    console.error('Error uploadPosventaItemFoto:', error)
    return res.status(500).json({ success:false, message: 'Error subiendo foto' })
  }
}

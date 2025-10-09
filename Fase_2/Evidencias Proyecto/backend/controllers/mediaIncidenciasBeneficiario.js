import multer from 'multer'
import { supabase } from '../supabaseClient.js'
import crypto from 'crypto'

// Configuración multer en memoria
const storage = multer.memoryStorage()
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024, files: 10 } }) // 5MB por archivo

// Middleware wrapper para Express 5 (async/await) manual
function runMulter(req, res) {
  return new Promise((resolve, reject) => {
    upload.array('files')(req, res, err => {
      if (err) reject(err)
      else resolve()
    })
  })
}

export async function uploadIncidenciaMediaBeneficiario(req, res) {
  try {
    const beneficiarioUid = req.user?.uid || req.user?.sub
    const incidenciaId = Number(req.params.id)
    if (!incidenciaId) return res.status(400).json({ success:false, message:'ID de incidencia inválido' })

    // Verificar que la incidencia pertenezca al beneficiario
    const { data: inc, error: errInc } = await supabase
      .from('incidencias')
      .select('id_incidencia,id_usuario_reporta')
      .eq('id_incidencia', incidenciaId)
      .single()
    if (errInc) throw errInc
    if (!inc || inc.id_usuario_reporta !== beneficiarioUid) {
      return res.status(403).json({ success:false, message:'No puedes adjuntar a esta incidencia' })
    }

    await runMulter(req, res)

    const files = req.files || []
    if (!files.length) return res.status(400).json({ success:false, message:'Sin archivos' })

    const bucket = 'incidencias'
    const uploaded = []

    for (const file of files) {
      const ext = (file.originalname.split('.').pop() || 'bin').toLowerCase()
      const randomName = crypto.randomUUID() + '.' + ext
      const path = `${incidenciaId}/${randomName}`

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file.buffer, { contentType: file.mimetype, upsert: false })
      if (upErr) {
        console.warn('Error subiendo archivo', file.originalname, upErr.message)
        continue
      }

      // Registrar en tabla media
      const { data: mediaRow, error: mediaErr } = await supabase
        .from('media')
        .insert([{
          entity_type: 'incidencia',
          entity_id: incidenciaId,
            path,
          mime: file.mimetype,
          bytes: file.size,
          uploaded_by: beneficiarioUid,
          metadata: { original: file.originalname }
        }])
        .select('*')
        .single()
      if (mediaErr) {
        console.warn('Error insert media row', mediaErr.message)
      } else {
        uploaded.push({ ...mediaRow })
      }
    }

    return res.json({ success:true, data: uploaded, count: uploaded.length })
  } catch (error) {
    console.error('Error uploadIncidenciaMediaBeneficiario:', error)
    return res.status(500).json({ success:false, message:'Error subiendo archivos' })
  }
}

export async function listIncidenciaMediaBeneficiario(req, res) {
  try {
    const beneficiarioUid = req.user?.uid || req.user?.sub
    const incidenciaId = Number(req.params.id)
    if (!incidenciaId) return res.status(400).json({ success:false, message:'ID inválido' })

    // Verificar propiedad
    const { data: inc, error: errInc } = await supabase
      .from('incidencias')
      .select('id_incidencia,id_usuario_reporta')
      .eq('id_incidencia', incidenciaId)
      .single()
    if (errInc) throw errInc
    if (!inc || inc.id_usuario_reporta !== beneficiarioUid) {
      return res.status(403).json({ success:false, message:'No puedes ver media de esta incidencia' })
    }

    const { data: media, error: mediaErr } = await supabase
      .from('media')
      .select('id,path,mime,bytes,created_at')
      .eq('entity_type','incidencia')
      .eq('entity_id', incidenciaId)
      .order('id', { ascending:false })
    if (mediaErr) throw mediaErr

    // Generar URLs públicas (asumiendo bucket público) / si privado usar signedURL
    const bucket = 'incidencias'
    const enriched = (media || []).map(m => ({
      ...m,
      url: `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${m.path}`
    }))

    return res.json({ success:true, data: enriched })
  } catch (error) {
    console.error('Error listIncidenciaMediaBeneficiario:', error)
    return res.status(500).json({ success:false, message:'Error listando media' })
  }
}

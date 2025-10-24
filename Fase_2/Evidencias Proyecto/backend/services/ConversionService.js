/**
 * Servicio de Conversión de archivos (DWG -> PDF) usando CloudConvert API
 * Este módulo es opcional. Requiere CLOUDCONVERT_API_KEY en el entorno.
 */
import fetch from 'node-fetch'

const CC_API = 'https://api.cloudconvert.com/v2'
const API_KEY = process.env.CLOUDCONVERT_API_KEY || ''
// Opcional: preferir engine específico ("cad" o "autocad"). Si no se define, intentaremos sin engine.
const CAD_ENGINE = (process.env.CLOUDCONVERT_CAD_ENGINE || '').trim().toLowerCase()

function ensureApiKey() {
  if (!API_KEY) {
    const err = new Error('CLOUDCONVERT_API_KEY no configurada')
    err.code = 'NO_API_KEY'
    throw err
  }
}

async function createJob(inputUrl, { engine } = {}) {
  const body = {
    tasks: {
      'import-1': { operation: 'import/url', url: inputUrl },
      'convert-1': {
        operation: 'convert',
        input: 'import-1',
        input_format: 'dwg',
        output_format: 'pdf',
        // Agregar engine solo si viene definido; algunos planes/conversiones no aceptan especificar engine
        ...(engine ? { engine } : {}),
        // Opciones básicas; se pueden ajustar según necesidad
        // options: { } 
      },
      'export-1': { operation: 'export/url', input: 'convert-1', inline: false }
    }
  }
  const res = await fetch(`${CC_API}/jobs`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data?.message || `CloudConvert error HTTP ${res.status}`
    const err = new Error(msg)
    err.data = data
    throw err
  }
  return data?.data
}

async function getJob(jobId) {
  const res = await fetch(`${CC_API}/jobs/${jobId}`, { headers: { 'Authorization': `Bearer ${API_KEY}` } })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data?.message || `CloudConvert error HTTP ${res.status}`)
    err.data = data
    throw err
  }
  return data?.data
}

function extractExportUrls(job) {
  const tasks = job?.tasks || []
  const exportTasks = tasks.filter(t => t.operation === 'export/url' && t.status === 'finished')
  const urls = []
  for (const t of exportTasks) {
    (t.result?.files || []).forEach(f => { if (f?.url) urls.push({ url: f.url, filename: f.filename }) })
  }
  return urls
}

export async function convertDWGUrlToPDF(inputUrl, { timeoutMs = 5 * 60 * 1000, pollEveryMs = 3000 } = {}) {
  ensureApiKey()
  const start = Date.now()
  // Estrategia: 1) intentar con engine por env si existe; 2) intentar sin engine; 3) intentar engine alternativo
  let job = null
  let lastErr = null
  const tryEngines = []
  if (CAD_ENGINE) tryEngines.push(CAD_ENGINE)
  tryEngines.push(null) // sin engine
  // Alternativa: probar 'cad' o 'autocad' si no fueron probados
  if (!tryEngines.includes('cad')) tryEngines.push('cad')
  if (!tryEngines.includes('autocad')) tryEngines.push('autocad')

  for (const eng of tryEngines) {
    try {
      job = await createJob(inputUrl, { engine: eng || undefined })
      break
    } catch (e) {
      // Si CloudConvert rechaza el engine, intentamos siguiente
      lastErr = e
      // Solo continuar si es un error de datos (p. ej., INVALID_DATA). Otros errores se re-lanzan
      const code = e?.data?.code || e?.code || ''
      if (code && String(code).toUpperCase() !== 'INVALID_DATA') {
        throw e
      }
      // continuar a siguiente engine
    }
  }
  if (!job) {
    throw lastErr || new Error('No se pudo crear el job de conversión')
  }
  const id = job?.id
  if (!id) throw new Error('No se pudo crear el job de conversión')

  // Polling hasta terminar o agotar timeout
  while (true) {
    if (Date.now() - start > timeoutMs) {
      const err = new Error('Conversión DWG->PDF expiró por timeout')
      err.code = 'TIMEOUT'
      throw err
    }
    const cur = await getJob(id)
    if (cur?.status === 'finished') {
      const files = extractExportUrls(cur)
      if (!files.length) throw new Error('Conversión finalizada pero sin archivos de salida')
      return files[0] // url y filename
    }
    if (cur?.status === 'error' || cur?.status === 'failed') {
      const err = new Error('Conversión DWG->PDF falló')
      err.data = cur
      throw err
    }
    await new Promise(r => setTimeout(r, pollEveryMs))
  }
}

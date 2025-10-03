import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import { supabase } from '../supabaseClient.js'
import { fileURLToPath } from 'url'
import path from 'path'

dotenv.config()

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10)
const BATCH_SIZE = parseInt(process.env.MIGRATION_BATCH_SIZE || '200', 10)

async function countCandidates() {
  const { count, error } = await supabase
    .from('usuarios')
    .select('uid', { count: 'exact', head: true })
    .or('password_hash.is.null,password_hash.eq.')
  if (error) throw error
  return count || 0
}

async function fetchBatch() {
  // Selecciona filas donde password_hash sea NULL o cadena vacía
  const { data, error } = await supabase
    .from('usuarios')
    .select('uid, "contraseña", password_hash')
    .or('password_hash.is.null,password_hash.eq.')
    .limit(BATCH_SIZE)
  if (error) throw error
  return data || []
}

async function updatePassword(uid, password_hash) {
  const { error } = await supabase
    .from('usuarios')
    .update({ password_hash })
    .eq('uid', uid)
  if (error) throw error
}

export async function runMigration({ dryRun = false } = {}) {
  console.log('[migracion] Iniciando...')
  let totalStart = 0
  try {
    totalStart = await countCandidates()
  } catch (e) {
    console.warn('[migracion] No se pudo contar candidatos inicialmente (continuando):', e.message)
  }
  console.log(`[migracion] Candidatos estimados iniciales: ${totalStart}`)

  let processed = 0
  let batchNum = 0
  for (;;) {
    const batch = await fetchBatch()
    if (!batch.length) {
      if (batchNum === 0) console.log('[migracion] No se encontraron filas para migrar (password_hash ya poblado o columna vacía).')
      break
    }
    batchNum++
    console.log(`[migracion] Batch ${batchNum} tamaño ${batch.length}`)
    for (const row of batch) {
      const original = row['contraseña']
      if (!original) {
        console.warn(`[migracion] UID ${row.uid} sin valor en columna "contraseña" (posible dato corrupto), saltando`)
        continue
      }
      let finalHash
      if (original.startsWith('$2')) {
        // Ya es hash
        finalHash = original
      } else {
        finalHash = await bcrypt.hash(original, SALT_ROUNDS)
      }
      if (!dryRun) {
        await updatePassword(row.uid, finalHash)
      }
      processed++
    }
    console.log(`[migracion] Procesadas acumuladas: ${processed}`)
  }
  console.log(`[migracion] Finalizado. Total procesadas: ${processed}`)
  return processed
}

// Ejecución directa robusta (compat Windows):
const thisFile = fileURLToPath(import.meta.url)
const invoked = process.argv[1] ? path.resolve(process.argv[1]) : ''
if (invoked && invoked.toLowerCase() === thisFile.toLowerCase()) {
  const dryRun = process.argv.includes('--dry-run')
  console.log(`[migracion] Archivo ejecutado directamente (${thisFile}) dryRun=${dryRun}`)
  runMigration({ dryRun }).catch(e => { console.error('Error migrando contraseñas:', e); process.exit(1) })
} else {
  // Uncomment para depurar si no se ejecuta automáticamente
  // console.log('[migracion] No se auto‑ejecuta runMigration; probable import o condición de ruta')
}

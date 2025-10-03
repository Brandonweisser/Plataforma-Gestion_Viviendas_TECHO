#!/usr/bin/env node
/**
 * Ejecuta un archivo .sql arbitrario contra la base usando la RPC exec_sql en Supabase.
 * Uso:
 *   node run-sql-file.js ../database/017_estado_lista_desacoplar_asignacion.sql
 *   npm run sql -- ../database/018_fix_estado_lista_constraint.sql
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { supabase } from './supabaseClient.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const rel = process.argv[2]
  if (!rel) {
    console.error('❌ Debes indicar la ruta al archivo .sql')
    process.exit(1)
  }
  const fullPath = path.resolve(__dirname, rel)
  if (!fs.existsSync(fullPath)) {
    console.error('❌ No existe el archivo:', fullPath)
    process.exit(1)
  }
  if (!fullPath.endsWith('.sql')) {
    console.error('❌ El archivo debe tener extensión .sql')
    process.exit(1)
  }
  console.log('📄 Leyendo SQL de:', fullPath)
  const sql = fs.readFileSync(fullPath, 'utf8')
  if (!sql.trim()) {
    console.error('⚠️ El archivo está vacío')
    process.exit(1)
  }
  console.log('🚀 Preparando sentencias...')
  // Elimina líneas de comentario simples y conserva el resto
  const lines = sql.split(/\r?\n/)
  let filtered = []
  for (let ln of lines) {
    // quitar comentarios -- excepto si están dentro de una cadena (asumimos que no usamos -- dentro de strings)
    const idx = ln.indexOf('--')
    if (idx >= 0) ln = ln.slice(0, idx)
    if (ln.trim()) filtered.push(ln)
  }
  const cleaned = filtered.join('\n')
  // Quitar BEGIN/COMMIT para evitar el error 'EXECUTE of transaction commands'
  const noTrans = cleaned.replace(/\bBEGIN\b;?/gi, '').replace(/\bCOMMIT\b;?/gi, '')
  // Split rudimentario por ';' respetando cadenas simples
  const statements = []
  let current = ''
  let inSingle = false
  for (let i = 0; i < noTrans.length; i++) {
    const ch = noTrans[i]
    if (ch === "'" && noTrans[i - 1] !== '\\') {
      inSingle = !inSingle
      current += ch
      continue
    }
    if (ch === ';' && !inSingle) {
      const stmt = current.trim()
      if (stmt) statements.push(stmt)
      current = ''
    } else {
      current += ch
    }
  }
  const last = current.trim()
  if (last) statements.push(last)

  if (!statements.length) {
    console.log('⚠️ No se encontraron sentencias ejecutables.')
    process.exit(0)
  }
  console.log(`➡️  ${statements.length} sentencias a ejecutar`)

  let ok = 0
  for (const stmt of statements) {
    const preview = stmt.length > 80 ? stmt.slice(0, 77) + '...' : stmt
    process.stdout.write(`   • Ejecutando: ${preview} ... `)
    const { error, data } = await supabase.rpc('exec_sql', { sql: stmt })
    if (error) {
      console.error(`\n❌ Error en sentencia:`, error)
      process.exit(1)
    } else {
      ok++
      process.stdout.write('OK\n')
    }
  }
  console.log(`✅ Ejecutadas ${ok}/${statements.length} sentencias correctamente.`)
}

main().catch(e => {
  console.error('❌ Excepción no controlada:', e)
  process.exit(1)
})

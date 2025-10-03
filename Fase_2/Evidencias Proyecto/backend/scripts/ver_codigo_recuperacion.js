import dotenv from 'dotenv'
import { supabase } from '../supabaseClient.js'

dotenv.config()

async function main() {
  const emailArg = process.argv[2]
  if (!emailArg) {
    console.log('Uso: node scripts/ver_codigo_recuperacion.js correo@example.com')
    process.exit(1)
  }
  const email = emailArg.toLowerCase()
  const { data, error } = await supabase
    .from('password_recovery_codes')
    .select('email, code, expires_at, used, created_at')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
  if (error) {
    console.error('Error consultando códigos:', error.message)
    process.exit(1)
  }
  if (!data || !data.length) {
    console.log('No hay códigos para ese email.')
    process.exit(0)
  }
  const row = data[0]
  console.log('Último código:')
  console.log(' Email:      ', row.email)
  console.log(' Código:     ', row.code)
  console.log(' Expira:     ', row.expires_at)
  console.log(' Usado:      ', row.used ? 'sí' : 'no')
  console.log(' Creado:     ', row.created_at)
  const msLeft = new Date(row.expires_at) - Date.now()
  if (msLeft > 0) {
    console.log(' Minutos restantes ~', Math.round(msLeft / 60000))
  } else {
    console.log(' (Ya expiró)')
  }
  process.exit(0)
}

main().catch(e => {
  console.error('Fallo inesperado:', e)
  process.exit(1)
})

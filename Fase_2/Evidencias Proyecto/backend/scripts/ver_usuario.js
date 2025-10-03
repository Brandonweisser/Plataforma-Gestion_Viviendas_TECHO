import dotenv from 'dotenv'
import { supabase } from '../supabaseClient.js'
dotenv.config()

async function main() {
  const email = (process.argv[2] || '').toLowerCase()
  if (!email) {
    console.log('Uso: node scripts/ver_usuario.js correo@dominio.com')
    process.exit(1)
  }
  const { data, error } = await supabase
    .from('usuarios')
    .select('uid, email, rol, password_hash, rut')
    .eq('email', email)
    .maybeSingle()
  if (error) { console.error('Error:', error.message); process.exit(1) }
  if (!data) { console.log('No existe usuario'); process.exit(0) }
  const hashInfo = data.password_hash ? `${data.password_hash.slice(0,10)}... len=${data.password_hash.length}` : 'NULL/ vacío'
  console.log('UID:          ', data.uid)
  console.log('Email:        ', data.email)
  console.log('Rol:          ', data.rol)
  console.log('RUT:          ', data.rut)
  console.log('Hash presente:', !!data.password_hash)
  console.log('Hash preview: ', hashInfo)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })

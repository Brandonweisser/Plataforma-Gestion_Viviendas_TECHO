import { supabase } from '../supabaseClient.js'
import dotenv from 'dotenv'
dotenv.config()

async function main() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('uid, nombre, email, rol, rut')
    .order('uid', { ascending: true })
    .limit(100)
  if (error) {
    console.error('Error obteniendo usuarios:', error.message)
    process.exit(1)
  }
  console.log('UID  | ROL            | EMAIL                  | NOMBRE')
  console.log('-----+-----------------+------------------------+-----------------------')
  for (const u of data) {
    console.log(`${String(u.uid).padEnd(4)} | ${u.rol.padEnd(15)} | ${u.email.padEnd(22)} | ${u.nombre}`)
  }
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })

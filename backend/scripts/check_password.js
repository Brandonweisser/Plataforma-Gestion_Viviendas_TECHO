import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import { supabase } from '../supabaseClient.js'
dotenv.config()

async function main() {
  const email = (process.argv[2] || '').toLowerCase()
  const candidate = process.argv[3]
  if (!email || !candidate) {
    console.log('Uso: node scripts/check_password.js correo@dominio.com passwordAProbar')
    process.exit(1)
  }
  const { data: user, error } = await supabase
    .from('usuarios')
    .select('uid, email, rol, password_hash')
    .eq('email', email)
    .maybeSingle()
  if (error) { console.error('Error buscando usuario:', error.message); process.exit(1) }
  if (!user) { console.log('Usuario no encontrado'); process.exit(0) }
  if (!user.password_hash || !user.password_hash.startsWith('$2')) {
    console.log('El usuario no tiene password_hash válido.')
    process.exit(0)
  }
  const ok = await bcrypt.compare(candidate, user.password_hash)
  console.log(`Compare resultado: ${ok ? 'CORRECTA' : 'INCORRECTA'}`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })

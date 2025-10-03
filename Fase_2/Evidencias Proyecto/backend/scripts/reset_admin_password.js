import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import { supabase } from '../supabaseClient.js'

dotenv.config()

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10)

async function main() {
  const email = (process.argv[2] || '').toLowerCase()
  const newPlain = process.argv[3]
  if (!email || !newPlain) {
    console.log('Uso: node scripts/reset_admin_password.js admin@techo.org NuevaClave123')
    process.exit(1)
  }
  const { data: user, error } = await supabase
    .from('usuarios')
    .select('uid, email, rol')
    .eq('email', email)
    .maybeSingle()
  if (error) { console.error('Error buscando usuario:', error.message); process.exit(1) }
  if (!user) { console.error('Usuario no encontrado'); process.exit(1) }
  const hash = await bcrypt.hash(newPlain, SALT_ROUNDS)
  const { error: upErr } = await supabase
    .from('usuarios')
    .update({ password_hash: hash })
    .eq('uid', user.uid)
  if (upErr) { console.error('Error actualizando contraseña:', upErr.message); process.exit(1) }
  console.log(`Contraseña actualizada para ${email} (uid=${user.uid}, rol=${user.rol})`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })

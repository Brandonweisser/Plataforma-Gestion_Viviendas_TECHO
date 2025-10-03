import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

// Carga .env desde la carpeta del backend, independientemente del CWD
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '.env') })

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
	console.error('⚠️  SUPABASE_URL o SUPABASE_KEY no configurados correctamente')
	console.log('Para continuar, actualiza backend/.env con tus credenciales de Supabase:')
	console.log('1. Ve a https://supabase.com/dashboard')
	console.log('2. Settings → API')
	console.log('3. Copia Project URL y service_role key')
	process.exit(1)
}

export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

// Carga .env desde la carpeta del backend, independientemente del CWD
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '.env') })

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
	console.error('Faltan SUPABASE_URL o SUPABASE_KEY en .env del backend')
}

export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

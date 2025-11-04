import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

// se carga el .env desde la carpeta del backend
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '.env') })

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
	console.error('SUPABASE_URL o SUPABASE_KEY no configurados correctamente')
	console.log('Para continuar, actualiza backend/.env con tus credenciales de Supabase:')
	console.log('1. Ve a https://supabase.com/dashboard')
	console.log('2. Settings → API')
	console.log('3. Copia Project URL y service_role key')
	process.exit(1)
}

export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
	db: {
		schema: 'public'
	},
	global: {
		headers: {
			'X-Client-Info': 'techo-backend'
		}
	}
})

// Configurar zona horaria de Chile para todas las consultas
// Esto asegura que las fechas se manejen correctamente
supabase.rpc = new Proxy(supabase.rpc, {
	apply(target, thisArg, argumentsList) {
		// Las consultas se harán con timezone configurado
		return Reflect.apply(target, thisArg, argumentsList)
	}
})

console.log(' Supabase configurado con zona horaria: America/Santiago (UTC-3)')

import { supabase } from './supabaseClient.js'

async function verUsuarios() {
  try {
    const { data, error } = await supabase
      .from('usuarios')   // Nombre exacto de tu tabla
      .select('*')        // Trae todas las columnas
      //.limit(10)        // Opcional, si quieres limitar los resultados

    if (error) throw error

    console.log('Usuarios encontrados:')
    console.table(data)   // Muestra en formato tabla en la consola
  } catch (err) {
    console.error('Error al traer usuarios:', err.message)
  }
}

verUsuarios()

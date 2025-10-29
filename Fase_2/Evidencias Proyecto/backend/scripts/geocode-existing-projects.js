/**
 * Script para geocodificar proyectos existentes que no tienen coordenadas
 * Ejecutar con: node scripts/geocode-existing-projects.js
 */

import { supabase } from '../supabaseClient.js'
import { geocodeSearch } from '../services/GeocodingService.js'

async function geocodeExistingProjects() {
  console.log('Iniciando geocodificación de proyectos existentes...\n')

  try {
    // Obtener proyectos sin coordenadas
    const { data: projects, error } = await supabase
      .from('proyecto')
      .select('id_proyecto, nombre, ubicacion, latitud, longitud')
      .or('latitud.is.null,longitud.is.null')
    
    if (error) throw error

    if (!projects || projects.length === 0) {
      console.log('Todos los proyectos ya tienen coordenadas')
      return
    }

    console.log(`Encontrados ${projects.length} proyectos sin coordenadas\n`)

    let successCount = 0
    let failCount = 0

    for (const project of projects) {
      console.log(`\nProyecto: ${project.nombre}`)
      console.log(`  Ubicación: ${project.ubicacion}`)

      if (!project.ubicacion) {
        console.log('  Sin dirección - omitido')
        failCount++
        continue
      }

      try {
        const results = await geocodeSearch(project.ubicacion)
        
        if (results && results.length > 0) {
          const first = results[0]
          
          if (first.center && Array.isArray(first.center) && first.center.length === 2) {
            const lng = Number(first.center[0])
            const lat = Number(first.center[1])
            
            if (isFinite(lat) && isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
              // Actualizar proyecto con coordenadas
              const { error: updateError } = await supabase
                .from('proyecto')
                .update({
                  latitud: lat,
                  longitud: lng,
                  geocode_provider: 'mapbox',
                  geocode_score: first.relevance || 1,
                  geocode_at: new Date().toISOString()
                })
                .eq('id_proyecto', project.id_proyecto)
              
              if (updateError) throw updateError
              
              console.log(`  Geocodificado: ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
              console.log(`  ${first.place_name}`)
              successCount++
            } else {
              console.log('  Coordenadas fuera de rango')
              failCount++
            }
          } else {
            console.log('  Formato de respuesta inválido')
            failCount++
          }
        } else {
          console.log('  No se encontraron resultados')
          failCount++
        }
      } catch (geoError) {
        console.log(`  Error: ${geoError.message}`)
        failCount++
      }

      // Pequeña pausa para no saturar la API
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    console.log('\n' + '='.repeat(60))
    console.log(`\nResumen:`)
    console.log(`  Exitosos: ${successCount}`)
    console.log(`  Fallidos: ${failCount}`)
    console.log(`  Total procesados: ${projects.length}\n`)

  } catch (error) {
    console.error('Error general:', error)
    process.exit(1)
  }
}

// Ejecutar
geocodeExistingProjects()
  .then(() => {
    console.log('Script finalizado')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Error fatal:', err)
    process.exit(1)
  })

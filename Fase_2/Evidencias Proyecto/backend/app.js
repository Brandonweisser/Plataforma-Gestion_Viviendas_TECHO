/**
 * Aplicación Principal - Plataforma de Gestión de Viviendas TECHO
 * Este archivo configura el servidor Express y organiza todas las rutas
 * de manera modular para facilitar el mantenimiento y escalabilidad.
 */

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// Importar rutas modulares
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'
import beneficiarioRoutes from './routes/beneficiario.js'
import tecnicoRoutes from './routes/tecnico.js'
import geocodingRoutes from './routes/geocoding.js'
import incidenciasRoutes from './routes/incidencias.js'
import posventaRoutes from './routes/posventa.js'
import setupRoutes from './routes/setup.js'

// Configurar variables de entorno
dotenv.config()

const app = express()

// Middleware global
app.use(cors())
app.use(express.json())

// Health check general de la aplicación
app.get('/api/health', (req, res) => {
  res.json({ 
    ok: true, 
    message: 'Plataforma TECHO API funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  })
})

// Configurar rutas modulares
app.use('/api', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/beneficiario', beneficiarioRoutes)
app.use('/api/tecnico', tecnicoRoutes)
app.use('/api/geo', geocodingRoutes)
app.use('/api', incidenciasRoutes)
app.use('/api/posventa', posventaRoutes)
app.use('/api/setup', setupRoutes)

// Rutas de posventa montadas arriba

// Middleware para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.path
  })
})

// Middleware de manejo de errores
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error)
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  })
})

const PORT = process.env.PORT || 5000

// Solo iniciar servidor si este archivo se ejecuta directamente (no cuando se importa)
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`Servidor TECHO corriendo en puerto ${PORT}`)
    console.log(`Health check: http://localhost:${PORT}/api/health`)
    console.log(`Auth routes: http://localhost:${PORT}/api/`)
    console.log(`Admin routes: http://localhost:${PORT}/api/admin/`)
    console.log(`Beneficiario routes: http://localhost:${PORT}/api/beneficiario/`)
    console.log(`Técnico routes: http://localhost:${PORT}/api/tecnico/`)
  })
}

export default app

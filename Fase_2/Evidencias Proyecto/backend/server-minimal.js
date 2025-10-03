// Servidor mínimo para debugging
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// Endpoint básico
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() })
})

// Endpoint de prueba para forgot-password
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    
    console.log('=== RECUPERACIÓN DE CONTRASEÑA ===')
    console.log('Email:', email)
    
    // Generar código
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    console.log('Código generado:', code)
    
    // Mostrar en consola (simular envío)
    console.log('MODO DESARROLLO - Código de recuperación:')
    console.log(`Para: ${email}`)
    console.log(`Código: ${code}`)
    console.log(`El código expira en 5 minutos`)
    console.log('====================================')
    
    res.json({
      success: true,
      message: 'Código generado (revisa la consola del servidor)'
    })
    
  } catch (error) {
    console.error('Error en forgot-password:', error)
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    })
  }
})

const PORT = process.env.PORT || 3002

const server = app.listen(PORT, () => {
  console.log(`Servidor mínimo corriendo en puerto ${PORT}`)
  console.log('Endpoints disponibles:')
  console.log('- GET  /api/health')
  console.log('- POST /api/forgot-password')
})

// Manejo de errores del servidor
server.on('error', (error) => {
  console.error('Error del servidor:', error)
})

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('Cerrando servidor...')
  server.close(() => {
    console.log('Servidor cerrado')
    process.exit(0)
  })
})

export { app }
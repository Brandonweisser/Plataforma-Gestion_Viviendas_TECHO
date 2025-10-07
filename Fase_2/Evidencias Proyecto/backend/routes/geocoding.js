/**
 * Rutas de Geocodificación y Validación de Direcciones (Chile)
 */
import express from 'express'
import rateLimit from 'express-rate-limit'
import { geocodeSearch, validateAddress, validateFromFeature } from '../services/GeocodingService.js'

const router = express.Router()

// Límite básico para proteger proveedores externos
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
})

router.use(limiter)

// Autocompletado / búsqueda de direcciones
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').toString()
    if (!q || q.length < 3) {
      return res.status(400).json({ success: false, message: 'Parámetro q mínimo 3 caracteres' })
    }
    const results = await geocodeSearch(q)
    res.json({ success: true, data: results })
  } catch (error) {
    console.error('Error en /geo/search:', error)
    res.status(500).json({ success: false, message: 'Error buscando direcciones' })
  }
})

// Validación estricta de dirección chilena
router.post('/validate', async (req, res) => {
  try {
    const { address, comuna, region, feature } = req.body || {}
    let result
    if (feature) {
      result = await validateFromFeature(feature, { comuna, region, addressQuery: address })
    } else {
      if (!address) {
        return res.status(400).json({ success: false, message: 'address es obligatorio' })
      }
      result = await validateAddress({ address, comuna, region })
    }
    if (!result.valid) {
      return res.status(422).json({ success: false, message: result.reason || 'Dirección no válida', data: result })
    }
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Error en /geo/validate:', error)
    res.status(500).json({ success: false, message: 'Error validando dirección' })
  }
})

export default router

import express from 'express'
import { verifyToken } from '../middleware/auth.js'
import { supabase } from '../supabaseClient.js'

const router = express.Router()

router.use(verifyToken)

// Historial público (para cualquier rol autenticado)
router.get('/incidencias/:id/historial', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { data, error } = await supabase
      .from('incidencia_historial')
      .select('*')
      .eq('incidencia_id', id)
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json({ success:true, data: data || [] })
  } catch (error) {
    console.error('Error en historial de incidencia:', error)
    res.status(500).json({ success:false, message:'Error al obtener historial' })
  }
})

export default router

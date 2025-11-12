import express from 'express'
import { verifyToken } from '../middleware/auth.js'
import { supabase } from '../supabaseClient.js'

const router = express.Router()

router.use(verifyToken)

// Historial público (para cualquier rol autenticado)
router.get('/incidencias/:id/historial', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { data: historial, error } = await supabase
      .from('incidencia_historial')
      .select('*')
      .eq('incidencia_id', id)
      .order('created_at', { ascending: false })
    if (error) throw error
    
    // Enriquecer con información del actor
    if (historial && historial.length > 0) {
      const actorUids = [...new Set(historial.map(h => h.actor_uid).filter(Boolean))]
      if (actorUids.length > 0) {
        const { data: actors } = await supabase
          .from('usuarios')
          .select('uid, nombre, email, rol')
          .in('uid', actorUids)
        
        const actorMap = new Map((actors || []).map(a => [a.uid, a]))
        historial.forEach(h => {
          if (h.actor_uid) {
            h.actor = actorMap.get(h.actor_uid) || null
          }
        })
      }
    }
    
    res.json({ success:true, data: historial || [] })
  } catch (error) {
    console.error('Error en historial de incidencia:', error)
    res.status(500).json({ success:false, message:'Error al obtener historial' })
  }
})

export default router

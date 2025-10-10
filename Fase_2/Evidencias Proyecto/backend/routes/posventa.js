/**
 * Rutas de Posventa (PDF y utilidades)
 */
import express from 'express'
import { verifyToken, requireTechnicianOrAdmin } from '../middleware/auth.js'
import { posventaPDFService } from '../services/PosventaPDFService.js'

const router = express.Router()

// Todas requieren auth de técnico o admin
router.use(verifyToken)
router.use(requireTechnicianOrAdmin)

// Generar PDF para un formulario
router.post('/form/:id/generar-pdf', async (req, res) => {
  try {
    const formId = Number(req.params.id)
    if (!formId) return res.status(400).json({ success:false, message:'ID inválido' })

    const { buffer, filename } = await posventaPDFService.generarPDF(formId)
    const saved = await posventaPDFService.guardarPDFEnSupabase(formId, buffer, filename)

    return res.json({ success:true, data: { pdf_path: saved.path, pdf_url: saved.url } })
  } catch (error) {
    console.error('Error en generar-pdf:', error)
    return res.status(500).json({ success:false, message:'Error generando PDF' })
  }
})

// Obtener URL pública de PDF si existe
router.get('/form/:id/pdf', async (req, res) => {
  try {
    const formId = Number(req.params.id)
    if (!formId) return res.status(400).json({ success:false, message:'ID inválido' })

    const { data: form, error } = await (await import('../supabaseClient.js')).supabase
      .from('vivienda_postventa_form')
      .select('pdf_path')
      .eq('id', formId)
      .single()
    if (error) throw error
    if (!form || !form.pdf_path) return res.status(404).json({ success:false, message:'PDF no encontrado' })

    const download_url = `${process.env.SUPABASE_URL}/storage/v1/object/public/formularios-pdf/${form.pdf_path}`
    return res.json({ success:true, data: { download_url } })
  } catch (error) {
    console.error('Error obteniendo PDF:', error)
    return res.status(500).json({ success:false, message:'Error obteniendo PDF' })
  }
})

export default router

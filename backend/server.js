import express from 'express'
import cors from 'cors'
import { supabase } from './supabaseClient.js'

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3001

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

app.post('/usuarios', async (req, res) => {
  const { nombre, email, rol, auth_id } = req.body

  try {
    const { data, error } = await supabase
      .from('usuarios')
      .insert([{ nombre, email, rol, auth_id }]) // auth_id es opcional si quieres relacionarlo con Supabase Auth

    if (error) throw error

    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

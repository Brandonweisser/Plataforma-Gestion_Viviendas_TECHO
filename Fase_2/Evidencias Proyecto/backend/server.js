import dotenv from 'dotenv'
import app from './app.js'

dotenv.config()

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Servidor TECHO refactorizado corriendo en puerto ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)
})

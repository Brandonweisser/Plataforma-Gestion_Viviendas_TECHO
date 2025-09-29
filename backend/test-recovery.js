// Script para probar recuperación de contraseña
import { sendRecoveryEmail } from './services/EmailService.js'

console.log('Probando envío de código de recuperación...')

try {
  const result = await sendRecoveryEmail('test@example.com', '123456', 'Usuario Prueba')
  console.log('Resultado:', result)
} catch (error) {
  console.error('Error:', error)
}
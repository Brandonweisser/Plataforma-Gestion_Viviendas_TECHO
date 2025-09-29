// Test simple del flujo de recuperación sin servidor HTTP
import { sendRecoveryEmail } from './services/EmailService.js'
import dotenv from 'dotenv'

dotenv.config()

console.log('=== PRUEBA DE RECUPERACIÓN DE CONTRASEÑA ===')
console.log('EMAIL_MODE:', process.env.EMAIL_MODE)
console.log('')

// Simular el flujo completo
async function testRecovery() {
  try {
    console.log('1. Generando código de recuperación...')
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    console.log('   Código generado:', code)
    
    console.log('2. Enviando email (modo consola)...')
    await sendRecoveryEmail('usuario@test.com', code, 'Usuario Prueba')
    
    console.log('3. ✅ Flujo completado exitosamente')
    
  } catch (error) {
    console.error('❌ Error en el flujo:', error)
  }
}

testRecovery()
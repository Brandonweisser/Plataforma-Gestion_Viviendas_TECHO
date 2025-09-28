#!/usr/bin/env node

/**
 * Script de prueba para email real
 * Ejecutar con: node test-email.js
 */

import { sendRecoveryEmail, verifyEmailConfig } from './services/EmailService.js'

async function testEmail() {
  console.log('🧪 Probando sistema de email...\n')

  try {
    // 1. Verificar configuración
    console.log('1️⃣ Verificando configuración...')
    const isConfigured = await verifyEmailConfig()
    
    if (!isConfigured) {
      console.log('\n⚠️  Email no configurado - se mostrará en consola')
      console.log('📝 Para email real, configura las variables en .env')
      console.log('📖 Ver CONFIGURACION_EMAIL.md para instrucciones\n')
    }

    // 2. Probar envío
    console.log('2️⃣ Enviando email de prueba...')
    const testEmail = process.env.EMAIL_USER || 'test@example.com'
    const testCode = '123456'
    const testName = 'Usuario de Prueba'

    const success = await sendRecoveryEmail(testEmail, testCode, testName)
    
    if (success) {
      console.log('✅ Email enviado exitosamente')
      console.log(`📧 Revisa la bandeja de entrada de: ${testEmail}`)
    } else {
      console.log('❌ Error enviando email - revisar configuración')
    }

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message)
  }

  console.log('\n🎉 Prueba completada')
  process.exit(0)
}

testEmail()
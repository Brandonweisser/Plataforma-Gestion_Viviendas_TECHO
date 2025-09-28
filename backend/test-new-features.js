#!/usr/bin/env node

/**
 * Script de prueba para las nuevas funcionalidades:
 * - Registro con RUT
 * - Recuperación de contraseña
 */

import { supabase } from './supabaseClient.js'
import bcrypt from 'bcrypt'

async function testNewFeatures() {
  console.log('🧪 Iniciando pruebas de nuevas funcionalidades...\n')

  try {
    // 1. Probar registro con RUT
    console.log('1️⃣ Probando registro con RUT...')
    
    const testUser = {
      uid: 999,
      nombre: 'Usuario Prueba RUT',
      email: 'test-rut@example.com',
      rut: '12345678-9',
      direccion: 'Dirección de prueba 123',
      rol: 'beneficiario',
      password_hash: await bcrypt.hash('password123', 10)
    }

    // Limpiar usuario de prueba si existe
    await supabase.from('usuarios').delete().eq('email', testUser.email)
    await supabase.from('usuarios').delete().eq('rut', testUser.rut)

    // Insertar usuario de prueba
    const { data: insertData, error: insertError } = await supabase
      .from('usuarios')
      .insert([testUser])
      .select()

    if (insertError) {
      console.log('❌ Error insertando usuario:', insertError.message)
    } else {
      console.log('✅ Usuario registrado exitosamente con RUT')
      console.log('   - UID:', insertData[0].uid)
      console.log('   - RUT:', insertData[0].rut)
    }

    // 2. Probar duplicado de RUT
    console.log('\n2️⃣ Probando prevención de RUT duplicado...')
    
    const duplicateUser = {
      uid: 1000,
      nombre: 'Otro Usuario',
      email: 'otro-test@example.com',
      rut: '12345678-9', // Mismo RUT
      rol: 'beneficiario',
      password_hash: await bcrypt.hash('password456', 10)
    }

    const { error: duplicateError } = await supabase
      .from('usuarios')
      .insert([duplicateUser])

    if (duplicateError && duplicateError.code === '23505') {
      console.log('✅ RUT duplicado correctamente rechazado')
      console.log('   - Error:', duplicateError.message)
    } else {
      console.log('❌ RUT duplicado no fue rechazado correctamente')
    }

    // 3. Probar tabla de códigos de recuperación
    console.log('\n3️⃣ Probando tabla de códigos de recuperación...')
    
    const recoveryCode = {
      email: testUser.email,
      code: '123456',
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    }

    const { data: codeData, error: codeError } = await supabase
      .from('password_recovery_codes')
      .insert([recoveryCode])
      .select()

    if (codeError) {
      console.log('❌ Error insertando código de recuperación:', codeError.message)
    } else {
      console.log('✅ Código de recuperación guardado exitosamente')
      console.log('   - Código:', recoveryCode.code)
      console.log('   - Expira:', recoveryCode.expires_at)
    }

    // 4. Probar validación de código
    console.log('\n4️⃣ Probando validación de código...')
    
    const { data: validationData, error: validationError } = await supabase
      .from('password_recovery_codes')
      .select('*')
      .eq('email', testUser.email)
      .eq('code', '123456')
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())

    if (validationError) {
      console.log('❌ Error validando código:', validationError.message)
    } else if (validationData && validationData.length > 0) {
      console.log('✅ Código válido encontrado')
      console.log('   - ID:', validationData[0].id)
      console.log('   - Usado:', validationData[0].used)
    } else {
      console.log('❌ Código no encontrado o inválido')
    }

    // Limpiar datos de prueba
    console.log('\n🧹 Limpiando datos de prueba...')
    await supabase.from('password_recovery_codes').delete().eq('email', testUser.email)
    await supabase.from('usuarios').delete().eq('email', testUser.email)
    console.log('✅ Datos de prueba eliminados')

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message)
  }

  console.log('\n🎉 Pruebas completadas')
}

testNewFeatures()
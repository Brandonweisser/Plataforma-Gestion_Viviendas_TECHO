#!/usr/bin/env node

/**
 * Script para ejecutar la migración 010_password_recovery.sql
 * Ejecutar con: node run-migration.js
 */

import { supabase } from './supabaseClient.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runMigration() {
  try {
    console.log('📊 Ejecutando migración 010_password_recovery.sql...')
    
    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, '..', 'database', '010_password_recovery.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Ejecutar la migración
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      console.error('❌ Error ejecutando migración:', error)
      return
    }
    
    console.log('✅ Migración ejecutada exitosamente')
    console.log('📋 Se han creado:')
    console.log('   - Tabla password_recovery_codes')
    console.log('   - Índices para optimización')
    console.log('   - Función clean_expired_recovery_codes()')
    console.log('   - Campo RUT único para usuarios')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    process.exit(0)
  }
}

runMigration()
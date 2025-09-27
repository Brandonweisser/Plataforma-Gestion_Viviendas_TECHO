// Script para actualizar contraseña del admin y verificar usuarios
// Ejecutar con: node actualizarAdmin.js

import bcrypt from 'bcrypt';
import { supabase } from './supabaseClient.js';

const SALT_ROUNDS = 10;

async function verificarUsuarios() {
  console.log('👥 Verificando usuarios existentes...');
  
  try {
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('uid, nombre, email, rol')
      .order('uid');
      
    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }
    
    console.log('\n📋 Usuarios encontrados:');
    usuarios.forEach(u => {
      console.log(`${u.uid}: ${u.email} (${u.rol}) - ${u.nombre}`);
    });
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

async function actualizarPasswordAdmin() {
  console.log('\n🔧 Actualizando contraseña del administrador...');
  
  try {
    const passwordHash = await bcrypt.hash('techo123', SALT_ROUNDS);
    
    const { data, error } = await supabase
      .from('usuarios')
      .update({ password_hash: passwordHash })
      .eq('email', 'admin@techo.org')
      .select();
      
    if (error) {
      console.error('❌ Error actualizando admin:', error.message);
    } else if (data && data.length > 0) {
      console.log('✅ Contraseña del admin actualizada correctamente');
    } else {
      console.log('⚠️  No se encontró usuario admin@techo.org');
      
      // Crear admin si no existe
      console.log('🔧 Creando usuario administrador...');
      const { data: newAdmin, error: createError } = await supabase
        .from('usuarios')
        .insert([{
          uid: 100,
          nombre: 'Administrador TECHO',
          email: 'admin@techo.org',
          rol: 'administrador',
          password_hash: passwordHash,
          rut: '11111111-1',
          direccion: 'Oficina Central TECHO'
        }])
        .select();
        
      if (createError) {
        console.error('❌ Error creando admin:', createError.message);
      } else {
        console.log('✅ Administrador creado exitosamente');
      }
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

async function ejecutar() {
  await verificarUsuarios();
  await actualizarPasswordAdmin();
  
  console.log('\n🎯 Credenciales actualizadas:');
  console.log('Email: admin@techo.org');
  console.log('Contraseña: techo123');
  console.log('Rol: administrador');
  
  console.log('\n✨ Completado');
}

ejecutar().catch(error => {
  console.error('💥 Error general:', error);
});
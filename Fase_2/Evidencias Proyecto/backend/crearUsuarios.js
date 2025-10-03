import { supabase } from './supabaseClient.js'
import bcrypt from 'bcrypt'

// Script de seed controlado:
// - Asegura creación/actualización de usuarios base.
// - Usa el campo password_hash (no 'contraseña').
// - Agrega un segundo beneficiario (beneficiario2@techo.org) sin vivienda asignada
//   para pruebas de asignación en el panel administrador.

async function crearUsuariosEspecificos() {
  try {
    console.log('Creando usuarios específicos para cada rol...');
    
    // Configuración para hashear contraseñas
    const SALT_ROUNDS = 10;
    
    // Usuarios a crear
    const usuarios = [
      {
        nombre: 'Admin TECHO',
        email: 'admin@techo.org',
        password: 'admin123',
        rol: 'administrador'
      },
      {
        nombre: 'Técnico Especialista',
        email: 'tecnico@techo.org', 
        password: 'tecnico123',
        rol: 'tecnico'
      },
      {
        nombre: 'Beneficiario Ejemplo',
        email: 'beneficiario@techo.org',
        password: 'beneficiario123',
        rol: 'beneficiario'
      },
      {
        nombre: 'Beneficiario Libre',
        email: 'beneficiario2@techo.org',
        password: 'beneficiario123',
        rol: 'beneficiario'
      }
    ];

    for (const userData of usuarios) {
      try {
        // Verificar si el usuario ya existe
        const { data: existente, error: errExiste } = await supabase
          .from('usuarios')
          .select('uid')
          .eq('email', userData.email.toLowerCase())
          .maybeSingle();

        if (existente) {
          console.log(`Usuario ${userData.email} ya existe. Actualizando...`);
          
          // Actualizar usuario existente
          const password_hash = await bcrypt.hash(userData.password, SALT_ROUNDS);
          
          const { error: errUpdate } = await supabase
            .from('usuarios')
            .update({
              nombre: userData.nombre,
              rol: userData.rol,
              password_hash: password_hash
            })
            .eq('uid', existente.uid);

          if (errUpdate) {
            console.error(`Error actualizando ${userData.email}:`, errUpdate);
          } else {
            console.log(`✅ Usuario ${userData.email} actualizado como ${userData.rol}`);
          }
        } else {
          // Crear nuevo usuario
          // Obtener el próximo UID
          const { data: lastUser, error: errLast } = await supabase
            .from('usuarios')
            .select('uid')
            .order('uid', { ascending: false })
            .limit(1);

          let newUid = 1;
          if (!errLast && lastUser && lastUser.length > 0) {
            newUid = Number(lastUser[0].uid) + 1;
          }

          // Hashear contraseña
          const password_hash = await bcrypt.hash(userData.password, SALT_ROUNDS);

          // Insertar usuario
          const { data: insertado, error: errInsert } = await supabase
            .from('usuarios')
            .insert([{
              uid: newUid,
              nombre: userData.nombre,
              email: userData.email.toLowerCase(),
              rol: userData.rol,
              password_hash: password_hash
            }])
            .select('uid, nombre, email, rol')
            .single();

          if (errInsert) {
            console.error(`Error creando ${userData.email}:`, errInsert);
          } else {
            console.log(`✅ Usuario ${userData.email} creado como ${userData.rol}`);
          }
        }
      } catch (userError) {
        console.error(`Error procesando ${userData.email}:`, userError);
      }
    }

    console.log('\n📋 Credenciales para probar:');
    console.log('🔵 ADMINISTRADOR:');
    console.log('   Email: admin@techo.org');
    console.log('   Contraseña: admin123');
    console.log('');
    console.log('🟠 TÉCNICO:');
    console.log('   Email: tecnico@techo.org'); 
    console.log('   Contraseña: tecnico123');
    console.log('');
  console.log('🟢 BENEFICIARIOS:');
  console.log('   Email: beneficiario@techo.org');
  console.log('   Contraseña: beneficiario123');
  console.log('');
  console.log('   Email: beneficiario2@techo.org');
  console.log('   Contraseña: beneficiario123 (sin vivienda asignada inicialmente)');

  } catch (error) {
    console.error('Error general:', error);
  }
}

crearUsuariosEspecificos();
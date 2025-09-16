import { supabase } from './supabaseClient.js'

async function testLogin(email, password) {
  try {
    console.log('Testing login for:', email);
    
    const { data: usuario, error: errSel } = await supabase
      .from('usuarios')
      .select('uid, nombre, email, contraseña, rol')
      .eq('email', email.toLowerCase())
      .single()

    if (errSel || !usuario) {
      console.log('User not found or error:', errSel);
      return;
    }

    console.log('User found:', {
      uid: usuario.uid,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol
    });

    // Test password validation
    const stored = usuario['contraseña'] || ''
    let ok = false;
    if (stored.startsWith('$2')) {
      // Would need bcrypt here, but just showing logic
      console.log('Password is hashed');
    } else {
      ok = password === stored;
      console.log('Password validation (plain):', ok);
    }

  } catch (error) {
    console.error('Test error:', error);
  }
}

// Test the three main accounts
console.log('Testing user roles...');
testLogin('carlos@correo.cl', 'qwerty');  // Should be administrador
testLogin('ana@correo.cl', 'abcd');       // Should be tecnico  
testLogin('juan@correo.cl', '1234');      // Should be beneficiario
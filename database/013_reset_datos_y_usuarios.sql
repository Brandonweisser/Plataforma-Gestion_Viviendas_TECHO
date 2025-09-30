-- 013_reset_datos_y_usuarios.sql
-- Script para LIMPIAR datos funcionales y crear usuarios base para pruebas.
-- ADVERTENCIA: Esto borra información de negocio (menos tablas estructurales vacías)!
-- Ejecutar SOLO en entornos de desarrollo / pruebas.

BEGIN;

-- 1. Borrar datos dependientes en orden seguro (evitar violaciones FK)
TRUNCATE TABLE
  media,
  incidencia_historial,
  incidencias,
  vivienda_postventa_item,
  vivienda_postventa_form,
  vivienda_recepcion_item,
  vivienda_recepcion,
  viviendas,
  proyecto,
  password_recovery_codes
RESTART IDENTITY CASCADE;

-- 2. Borrar todos los usuarios actuales
DELETE FROM usuarios;

-- 3. Insertar usuarios base (2 administradores, 2 técnicos, 2 beneficiarios)
-- Contraseñas en texto plano (para que las sepas) y su hash bcrypt (10 rondas):
--  Admin1: Admin123!
--  Admin2: Admin456!
--  Tec1:   Tecnic123!
--  Tec2:   Tecnic456!
--  Bene1:  Bene123!
--  Bene2:  Bene456!
-- Hashes generados con bcrypt (cost 10). Si necesitas regenerarlos, usar Node/bcrypt.
-- Formato: uid, nombre, email, rol, rut, direccion, password_hash

INSERT INTO usuarios (uid, nombre, email, rol, rut, direccion, password_hash) VALUES
  (1001, 'Admin Uno', 'admin1@example.com', 'administrador', 'admin1rut', 'Direccion Admin 1', '$2b$10$4.hxHcGo3quWtd4z15j3FOhEd7mDZrDrorlB/aKwpsRtd9vYWWZqa'),
  (1002, 'Admin Dos', 'admin2@example.com', 'administrador', 'admin2rut', 'Direccion Admin 2', '$2b$10$HCmNmIM7snNKc4c91DqI7OGwbU6Y.pTJP/L16L219UbD6X.nzVqq.'),
  (1101, 'Tecnico Uno', 'tec1@example.com', 'tecnico', 'tec1rut', 'Direccion Tecnico 1', '$2b$10$6Ndn4mdhq6.CtzEPENeuOOcJOysuREUAzns41jmooET/TxKssvr3u'),
  (1102, 'Tecnico Dos', 'tec2@example.com', 'tecnico', 'tec2rut', 'Direccion Tecnico 2', '$2b$10$JT.XO8FIxilpNq9C8DJ5f.T8yurglZ/9t/fjkWf/XS/BeqhCUWVpW'),
  (1201, 'Beneficiario Uno', 'bene1@example.com', 'beneficiario', 'bene1rut', 'Direccion Beneficiario 1', '$2b$10$HNj0hDovT79FBoCvilYIM.XXNKT4TwUk9z6g5PL.Bg4iNY/wDTkq6'),
  (1202, 'Beneficiario Dos', 'bene2@example.com', 'beneficiario', 'bene2rut', 'Direccion Beneficiario 2', '$2b$10$g57jrCpzA6kp/5SFvjMHGOgINvuCTcyyoYkydhHcDLE.J4zT9JI2m');

COMMIT;

-- Para verificar:
-- SELECT uid, nombre, email, rol FROM usuarios ORDER BY uid;

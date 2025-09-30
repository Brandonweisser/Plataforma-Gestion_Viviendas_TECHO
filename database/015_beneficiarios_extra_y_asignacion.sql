-- 015_beneficiarios_extra_y_asignacion.sql
-- Agrega 8 beneficiarios nuevos y asigna una vivienda distinta del Proyecto 3 a cada uno
-- Estados actuales del Proyecto 3: viviendas 'asignada' (listas pero no entregadas)
-- Contraseñas en texto plano para pruebas y sus hashes (cost 10):
-- 1203 Bene303! -> hash abajo
-- 1204 Bene304!
-- 1205 Bene305!
-- 1206 Bene306!
-- 1207 Bene307!
-- 1208 Bene308!
-- 1209 Bene309!
-- 1210 Bene310!
-- IMPORTANTE: NO ejecutar si ya existen estos uid (evitar conflicto). Ajustar según necesidad.

BEGIN;

-- 1. Insertar nuevos beneficiarios
INSERT INTO usuarios (uid, nombre, email, rol, rut, direccion, password_hash) VALUES
  (1203, 'Beneficiario 303', 'bene303@example.com', 'beneficiario', 'bene303rut', 'Direccion Bene 303', '$2b$10$2Ep5wEvxirOW2lhF6UkUKuXtZ5guvOHEVXG6lr5aL6AuF8DjvnJt6'),
  (1204, 'Beneficiario 304', 'bene304@example.com', 'beneficiario', 'bene304rut', 'Direccion Bene 304', '$2b$10$bVkCT.u0aMli860JSWEdBOWmbTXOvoW027kzawt9/Z4SPttOaZDW2'),
  (1205, 'Beneficiario 305', 'bene305@example.com', 'beneficiario', 'bene305rut', 'Direccion Bene 305', '$2b$10$eaqrSq7jKZh9VXozPb0Y4OY.iSMAU/7ESaVD.LYPHYU22ZUwONZBi'),
  (1206, 'Beneficiario 306', 'bene306@example.com', 'beneficiario', 'bene306rut', 'Direccion Bene 306', '$2b$10$bx2zNBcc63VoR7Qc.AQkxes5PddtbWGwaT3GFyTsf75Cr4E5JWKXa'),
  (1207, 'Beneficiario 307', 'bene307@example.com', 'beneficiario', 'bene307rut', 'Direccion Bene 307', '$2b$10$3SQNhZQ8yAFvBcUkgTxIwe7ldyIirsFWRWkn92.tj94GoUD8YxuXm'),
  (1208, 'Beneficiario 308', 'bene308@example.com', 'beneficiario', 'bene308rut', 'Direccion Bene 308', '$2b$10$s34seBaR.brUYEG0llyhjuTwQKE9JEdRaiyqJePjs0KqKUKUsOZ6e'),
  (1209, 'Beneficiario 309', 'bene309@example.com', 'beneficiario', 'bene309rut', 'Direccion Bene 309', '$2b$10$F0wH5jt3A0Div8/gPjdWZeA8KiWBpk9qko.06/CrCWEyI5VcZbb.G'),
  (1210, 'Beneficiario 310', 'bene310@example.com', 'beneficiario', 'bene310rut', 'Direccion Bene 310', '$2b$10$jWL.orQodo1e.PVOj09y7uId8TZl/1QNsD5ecSbG6M1Aw9q5hVcja');

-- 2. Reasignar viviendas del Proyecto 3 (id_proyecto=2003) para cubrir 10 beneficiarios distintos
-- Viviendas 3021..3030
-- Beneficiarios finales: 1201..1210 uno a uno
UPDATE viviendas SET beneficiario_uid = 1201 WHERE id_vivienda = 3021;
UPDATE viviendas SET beneficiario_uid = 1202 WHERE id_vivienda = 3022;
UPDATE viviendas SET beneficiario_uid = 1203 WHERE id_vivienda = 3023;
UPDATE viviendas SET beneficiario_uid = 1204 WHERE id_vivienda = 3024;
UPDATE viviendas SET beneficiario_uid = 1205 WHERE id_vivienda = 3025;
UPDATE viviendas SET beneficiario_uid = 1206 WHERE id_vivienda = 3026;
UPDATE viviendas SET beneficiario_uid = 1207 WHERE id_vivienda = 3027;
UPDATE viviendas SET beneficiario_uid = 1208 WHERE id_vivienda = 3028;
UPDATE viviendas SET beneficiario_uid = 1209 WHERE id_vivienda = 3029;
UPDATE viviendas SET beneficiario_uid = 1210 WHERE id_vivienda = 3030;

COMMIT;

-- Verificaciones sugeridas:
-- SELECT uid, email FROM usuarios WHERE uid BETWEEN 1201 AND 1210 ORDER BY uid;
-- SELECT id_vivienda, beneficiario_uid FROM viviendas WHERE id_vivienda BETWEEN 3021 AND 3030 ORDER BY id_vivienda;

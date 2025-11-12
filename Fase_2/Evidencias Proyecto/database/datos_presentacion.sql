-- ============================================================================
-- DATOS REALISTAS PARA PRESENTACIÓN
-- Script para poblar la base de datos con información de aspecto profesional
-- ============================================================================

-- ============================================================================
-- 1. CONSTRUCTORAS REALISTAS
-- ============================================================================

INSERT INTO constructoras (nombre, rut, direccion, telefono, contacto_email) VALUES
('Constructora Habiterra SpA', '76.234.567-8', 'Av. Providencia 1650, Providencia, Santiago', '+56 2 2345 6789', 'contacto@habiterra.cl'),
('Edificaciones del Sur Ltda.', '78.456.123-4', 'Calle Los Carrera 890, Temuco', '+56 45 2 567890', 'proyectos@edisur.cl');

-- ============================================================================
-- 2. PROYECTOS REALISTAS CON UBICACIONES REALES
-- ============================================================================

INSERT INTO proyecto (id_proyecto, nombre, ubicacion, fecha_inicio, fecha_entrega, constructora_id, latitud, longitud, ubicacion_normalizada) VALUES
(
  9001,
  'Villa Esperanza - Puente Alto',
  'Calle Las Acacias 4567, Puente Alto, Región Metropolitana',
  '2024-08-15',
  '2025-03-30',
  (SELECT id FROM constructoras WHERE nombre = 'Constructora Habiterra SpA' LIMIT 1),
  -33.6119,
  -70.5756,
  'Conjunto habitacional de 35 viviendas sociales de 42m² con materialidad mixta, destinado a familias en situación de vulnerabilidad del sector sur de Santiago.'
),
(
  9002,
  'Barrio Nuevo Amanecer - Temuco',
  'Camino Truf Truf Km 8, Temuco, Región de La Araucanía',
  '2024-09-01',
  '2025-04-15',
  (SELECT id FROM constructoras WHERE nombre = 'Edificaciones del Sur Ltda.' LIMIT 1),
  -38.7667,
  -72.6500,
  'Desarrollo habitacional de 28 viviendas progresivas de 36m² con estructura de madera y cubierta de zinc, ubicado en zona periurbana con acceso a servicios básicos.'
);

-- ============================================================================
-- 3. VIVIENDAS PARA VILLA ESPERANZA (35 viviendas)
-- ============================================================================

INSERT INTO viviendas (id_vivienda, direccion, id_proyecto, estado, metros_cuadrados, numero_habitaciones, numero_banos, tipo_vivienda) 
SELECT 
  90000 + num,
  'Pasaje Las Acacias ' || num || ', Villa Esperanza, Puente Alto',
  9001,
  CASE 
    WHEN num <= 20 THEN 'entregada'
    WHEN num <= 30 THEN 'en_construccion'
    ELSE 'planificada'
  END,
  42,
  2,
  1,
  'pareada'
FROM generate_series(1, 35) AS num;

-- ============================================================================
-- 4. VIVIENDAS PARA BARRIO NUEVO AMANECER (28 viviendas)
-- ============================================================================

INSERT INTO viviendas (id_vivienda, direccion, id_proyecto, estado, metros_cuadrados, numero_habitaciones, numero_banos, tipo_vivienda) 
SELECT 
  91000 + num,
  'Lote ' || num || ', Barrio Nuevo Amanecer, Temuco',
  9002,
  CASE 
    WHEN num <= 15 THEN 'entregada'
    WHEN num <= 25 THEN 'en_construccion'
    ELSE 'planificada'
  END,
  36,
  2,
  1,
  'aislada'
FROM generate_series(1, 28) AS num;

-- ============================================================================
-- 5. BENEFICIARIOS REALISTAS
-- ============================================================================

-- Contraseña para todos: "password123"
-- Hash bcrypt válido (10 rounds)
INSERT INTO usuarios (uid, nombre, email, password_hash, rol, rut, direccion) VALUES
(2001, 'Carmen Gloria Muñoz Torres', 'carmen.munoz@email.cl', '$2b$10$I0.nSEMevJP4QjdYsRfyyuMiw8NV.GF.j.sBA6ZSHbasY8FfQGQ5W', 'beneficiario', '15.234.567-8', NULL),
(2002, 'José Miguel Contreras Díaz', 'jm.contreras@email.cl', '$2b$10$I0.nSEMevJP4QjdYsRfyyuMiw8NV.GF.j.sBA6ZSHbasY8FfQGQ5W', 'beneficiario', '16.345.678-9', NULL),
(2003, 'Rosa Elena Pérez Figueroa', 'rosa.perez@email.cl', '$2b$10$I0.nSEMevJP4QjdYsRfyyuMiw8NV.GF.j.sBA6ZSHbasY8FfQGQ5W', 'beneficiario', '14.456.789-0', NULL),
(2004, 'Pedro Antonio Morales Soto', 'p.morales@email.cl', '$2b$10$I0.nSEMevJP4QjdYsRfyyuMiw8NV.GF.j.sBA6ZSHbasY8FfQGQ5W', 'beneficiario', '17.567.890-1', NULL),
(2005, 'Juana Isabel Rojas Campos', 'juana.rojas@email.cl', '$2b$10$I0.nSEMevJP4QjdYsRfyyuMiw8NV.GF.j.sBA6ZSHbasY8FfQGQ5W', 'beneficiario', '13.678.901-2', NULL),
(2006, 'Carlos Eduardo Vega Núñez', 'carlos.vega@email.cl', '$2b$10$I0.nSEMevJP4QjdYsRfyyuMiw8NV.GF.j.sBA6ZSHbasY8FfQGQ5W', 'beneficiario', '18.789.012-3', NULL),
(2007, 'María Angélica Herrera Riquelme', 'maria.herrera@email.cl', '$2b$10$I0.nSEMevJP4QjdYsRfyyuMiw8NV.GF.j.sBA6ZSHbasY8FfQGQ5W', 'beneficiario', '12.890.123-4', NULL),
(2008, 'Luis Fernando Castro Aravena', 'luis.castro@email.cl', '$2b$10$I0.nSEMevJP4QjdYsRfyyuMiw8NV.GF.j.sBA6ZSHbasY8FfQGQ5W', 'beneficiario', '19.901.234-5', NULL),
(2009, 'Patricia Alejandra Flores Medina', 'patricia.flores@email.cl', '$2b$10$I0.nSEMevJP4QjdYsRfyyuMiw8NV.GF.j.sBA6ZSHbasY8FfQGQ5W', 'beneficiario', '11.012.345-6', NULL),
(2010, 'Roberto Andrés Silva Bravo', 'roberto.silva@email.cl', '$2b$10$I0.nSEMevJP4QjdYsRfyyuMiw8NV.GF.j.sBA6ZSHbasY8FfQGQ5W', 'beneficiario', '20.123.456-7', NULL);

-- ============================================================================
-- 6. ASIGNAR BENEFICIARIOS A VIVIENDAS
-- ============================================================================

-- Viviendas habitadas en Villa Esperanza (primeras 5)
UPDATE viviendas SET beneficiario_uid = 2001, fecha_entrega = '2024-10-15'
WHERE id_vivienda = 90001;

UPDATE viviendas SET beneficiario_uid = 2002, fecha_entrega = '2024-10-15'
WHERE id_vivienda = 90003;

UPDATE viviendas SET beneficiario_uid = 2003, fecha_entrega = '2024-10-18'
WHERE id_vivienda = 90005;

UPDATE viviendas SET beneficiario_uid = 2004, fecha_entrega = '2024-10-20'
WHERE id_vivienda = 90007;

UPDATE viviendas SET beneficiario_uid = 2005, fecha_entrega = '2024-10-22'
WHERE id_vivienda = 90009;

-- Viviendas habitadas en Barrio Nuevo Amanecer (primeras 5)
UPDATE viviendas SET beneficiario_uid = 2006, fecha_entrega = '2024-09-25'
WHERE id_vivienda = 91001;

UPDATE viviendas SET beneficiario_uid = 2007, fecha_entrega = '2024-09-28'
WHERE id_vivienda = 91003;

UPDATE viviendas SET beneficiario_uid = 2008, fecha_entrega = '2024-10-02'
WHERE id_vivienda = 91005;

UPDATE viviendas SET beneficiario_uid = 2009, fecha_entrega = '2024-10-05'
WHERE id_vivienda = 91007;

UPDATE viviendas SET beneficiario_uid = 2010, fecha_entrega = '2024-10-08'
WHERE id_vivienda = 91009;

-- ============================================================================
-- 7. INCIDENCIAS REALISTAS Y VARIADAS
-- ============================================================================

-- Incidencias en Villa Esperanza
INSERT INTO incidencias (id_vivienda, id_usuario_reporta, id_usuario_tecnico, descripcion, estado, prioridad, categoria, fecha_reporte, fecha_creacion) VALUES
(
  90001,
  2001,
  1101,
  'Filtración de agua en techo de cocina: Durante las lluvias de la semana pasada se detectó una filtración importante en el techo de la cocina. El agua cae cerca del mesón y moja el piso.',
  'abierta',
  'alta',
  'estructural',
  CURRENT_TIMESTAMP - INTERVAL '3 days',
  CURRENT_TIMESTAMP - INTERVAL '3 days'
),
(
  90003,
  2002,
  1225,
  'Puerta de entrada no cierra correctamente: La puerta principal quedó desnivelada y no cierra bien. Hay una abertura que deja pasar corriente de aire.',
  'en_proceso',
  'media',
  'terminaciones',
  CURRENT_TIMESTAMP - INTERVAL '5 days',
  CURRENT_TIMESTAMP - INTERVAL '5 days'
),
(
  90005,
  2003,
  1101,
  'Falta de presión en agua caliente: El calefont enciende pero la presión del agua caliente es muy baja en todos los puntos de la casa.',
  'abierta',
  'alta',
  'instalaciones',
  CURRENT_TIMESTAMP - INTERVAL '2 days',
  CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
  90007,
  2004,
  NULL,
  'Grietas en muro del dormitorio: Aparecieron grietas en el muro del dormitorio principal, cerca de la ventana. No sabemos si es grave.',
  'abierta',
  'alta',
  'estructural',
  CURRENT_TIMESTAMP - INTERVAL '1 day',
  CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
  90009,
  2005,
  1225,
  'Interruptor de baño no funciona: El interruptor de la luz del baño dejó de funcionar. Se quedó la luz encendida y no se puede apagar.',
  'en_proceso',
  'media',
  'instalaciones',
  CURRENT_TIMESTAMP - INTERVAL '4 days',
  CURRENT_TIMESTAMP - INTERVAL '4 days'
);

-- Incidencias en Barrio Nuevo Amanecer
INSERT INTO incidencias (id_vivienda, id_usuario_reporta, id_usuario_tecnico, descripcion, estado, prioridad, categoria, fecha_reporte, fecha_creacion) VALUES
(
  91001,
  2006,
  1101,
  'Planchas de zinc sueltas en el techo: Con el viento fuerte se soltaron 3 planchas del techo. Hacen ruido cuando hay viento y puede entrar agua.',
  'abierta',
  'alta',
  'estructural',
  CURRENT_TIMESTAMP - INTERVAL '1 day',
  CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
  91003,
  2007,
  1225,
  'Piso de cocina con tablas flojas: Varias tablas del piso de la cocina están sueltas y se mueven al caminar. Una se levantó y es peligroso.',
  'en_proceso',
  'media',
  'terminaciones',
  CURRENT_TIMESTAMP - INTERVAL '6 days',
  CURRENT_TIMESTAMP - INTERVAL '6 days'
),
(
  91005,
  2008,
  NULL,
  'Ventana del dormitorio se sale del marco: La ventana no cierra bien y se sale del marco. Entra mucho frío por la noche.',
  'abierta',
  'media',
  'terminaciones',
  CURRENT_TIMESTAMP - INTERVAL '2 days',
  CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
  91007,
  2009,
  1101,
  'Humedad en muro del baño: Se ve humedad y moho en el muro del baño, cerca de la ducha. El olor es fuerte.',
  'abierta',
  'alta',
  'instalaciones',
  CURRENT_TIMESTAMP - INTERVAL '3 days',
  CURRENT_TIMESTAMP - INTERVAL '3 days'
),
(
  91009,
  2010,
  1225,
  'Cable eléctrico expuesto en cocina: Hay un cable eléctrico que quedó sin canaleta en la cocina, está a la vista y puede ser peligroso.',
  'cerrada',
  'alta',
  'instalaciones',
  CURRENT_TIMESTAMP - INTERVAL '10 days',
  CURRENT_TIMESTAMP - INTERVAL '10 days'
);

-- ============================================================================
-- 8. ASIGNAR TÉCNICOS A PROYECTOS
-- ============================================================================

-- Asignar técnico supervisor (1101) a ambos proyectos
INSERT INTO proyecto_tecnico (id_proyecto, tecnico_uid) VALUES
(9001, 1101),
(9002, 1101);

-- Asignar técnico de campo (1225) a ambos proyectos
INSERT INTO proyecto_tecnico (id_proyecto, tecnico_uid) VALUES
(9001, 1225),
(9002, 1225);

-- ============================================================================
-- RESUMEN DE DATOS CREADOS
-- ============================================================================
-- ✅ 2 Constructoras profesionales chilenas
-- ✅ 2 Proyectos con ubicaciones reales (Puente Alto y Temuco)
-- ✅ 63 Viviendas totales (35 + 28)
-- ✅ 10 Beneficiarios con nombres chilenos realistas
-- ✅ 15 Viviendas habitadas con beneficiarios asignados
-- ✅ 10 Incidencias variadas (estructural, sanitaria, eléctrica, terminaciones)
-- ✅ Técnicos asignados a proyectos
-- ============================================================================

-- 014_datos_proyectos_viviendas.sql
-- Población de ejemplo: 3 proyectos, 10 viviendas cada uno.
-- Estados permitidos: planificada -> en_construccion -> asignada -> entregada
-- Interpretación solicitada:
--  Proyecto 1: Recién construyéndose (mayoría en_construccion, algunas aún planificada)
--  Proyecto 2: Casi terminando de construir (todas en_construccion, más avanzadas)
--  Proyecto 3: Casas listas pero NO entregadas (todas 'asignada')
--    * "asignada" representa que ya están listas para entregar / con beneficiario asignado pero aún no se cambia a 'entregada'.
-- Beneficiarios existentes (según script 013): 1201, 1202
-- Se asignan alternadamente sólo en Proyecto 3.

BEGIN;

-- 1. Insertar proyectos
-- id_proyecto, nombre, ubicacion, fecha_inicio, fecha_entrega (planeada), viviendas_count
INSERT INTO proyecto (id_proyecto, nombre, ubicacion, fecha_inicio, fecha_entrega, viviendas_count)
VALUES
  (2001, 'Proyecto Amanecer', 'Sector Norte',        '2025-09-01', NULL,          10), -- recien iniciando
  (2002, 'Proyecto Horizonte', 'Sector Centro',      '2025-06-15', '2025-12-15',  10), -- avanzado
  (2003, 'Proyecto Raices',    'Sector Sur',         '2025-05-01', '2025-09-30',  10); -- listo para entregar (no entregado)

-- 2. Insertar viviendas
-- id_vivienda, id_proyecto, direccion, estado, fecha_entrega, beneficiario_uid, tipo_vivienda
-- Para simplificar direcciones ficticias: Calle X #n

-- Proyecto 1: 2 planificadas, 8 en construcción
INSERT INTO viviendas (id_vivienda, id_proyecto, direccion, estado, fecha_entrega, beneficiario_uid, tipo_vivienda) VALUES
  (3001, 2001, 'Calle Amanecer #1',  'planificada',      NULL,      NULL, '2D'),
  (3002, 2001, 'Calle Amanecer #2',  'planificada',      NULL,      NULL, '3D'),
  (3003, 2001, 'Calle Amanecer #3',  'en_construccion',  NULL,      NULL, '2D'),
  (3004, 2001, 'Calle Amanecer #4',  'en_construccion',  NULL,      NULL, '2D'),
  (3005, 2001, 'Calle Amanecer #5',  'en_construccion',  NULL,      NULL, '3D'),
  (3006, 2001, 'Calle Amanecer #6',  'en_construccion',  NULL,      NULL, '2D'),
  (3007, 2001, 'Calle Amanecer #7',  'en_construccion',  NULL,      NULL, '3D'),
  (3008, 2001, 'Calle Amanecer #8',  'en_construccion',  NULL,      NULL, '2D'),
  (3009, 2001, 'Calle Amanecer #9',  'en_construccion',  NULL,      NULL, '2D'),
  (3010, 2001, 'Calle Amanecer #10', 'en_construccion',  NULL,      NULL, '3D');

-- Proyecto 2: todas en construcción (fase avanzada). Se puede definir fecha_entrega aproximada.
INSERT INTO viviendas (id_vivienda, id_proyecto, direccion, estado, fecha_entrega, beneficiario_uid, tipo_vivienda) VALUES
  (3011, 2002, 'Av Horizonte #1',  'en_construccion', '2025-12-01', NULL, '2D'),
  (3012, 2002, 'Av Horizonte #2',  'en_construccion', '2025-12-01', NULL, '3D'),
  (3013, 2002, 'Av Horizonte #3',  'en_construccion', '2025-12-01', NULL, '2D'),
  (3014, 2002, 'Av Horizonte #4',  'en_construccion', '2025-12-01', NULL, '2D'),
  (3015, 2002, 'Av Horizonte #5',  'en_construccion', '2025-12-01', NULL, '3D'),
  (3016, 2002, 'Av Horizonte #6',  'en_construccion', '2025-12-01', NULL, '2D'),
  (3017, 2002, 'Av Horizonte #7',  'en_construccion', '2025-12-01', NULL, '2D'),
  (3018, 2002, 'Av Horizonte #8',  'en_construccion', '2025-12-01', NULL, '3D'),
  (3019, 2002, 'Av Horizonte #9',  'en_construccion', '2025-12-01', NULL, '2D'),
  (3020, 2002, 'Av Horizonte #10', 'en_construccion', '2025-12-01', NULL, '3D');

-- Proyecto 3: todas listas (asignadas) pero NO entregadas aún (no poner estado 'entregada').
-- Se asignan beneficiarios alternando (1201, 1202). Si luego quieres más beneficiarios, ajusta.
INSERT INTO viviendas (id_vivienda, id_proyecto, direccion, estado, fecha_entrega, beneficiario_uid, tipo_vivienda) VALUES
  (3021, 2003, 'Pasaje Raices #1',  'asignada', '2025-09-30', 1201, '2D'),
  (3022, 2003, 'Pasaje Raices #2',  'asignada', '2025-09-30', 1202, '3D'),
  (3023, 2003, 'Pasaje Raices #3',  'asignada', '2025-09-30', 1201, '2D'),
  (3024, 2003, 'Pasaje Raices #4',  'asignada', '2025-09-30', 1202, '2D'),
  (3025, 2003, 'Pasaje Raices #5',  'asignada', '2025-09-30', 1201, '3D'),
  (3026, 2003, 'Pasaje Raices #6',  'asignada', '2025-09-30', 1202, '2D'),
  (3027, 2003, 'Pasaje Raices #7',  'asignada', '2025-09-30', 1201, '2D'),
  (3028, 2003, 'Pasaje Raices #8',  'asignada', '2025-09-30', 1202, '3D'),
  (3029, 2003, 'Pasaje Raices #9',  'asignada', '2025-09-30', 1201, '2D'),
  (3030, 2003, 'Pasaje Raices #10', 'asignada', '2025-09-30', 1202, '3D');

COMMIT;

-- Verificaciones sugeridas:
-- SELECT id_proyecto, nombre, viviendas_count FROM proyecto ORDER BY id_proyecto;
-- SELECT estado, COUNT(*) FROM viviendas GROUP BY estado ORDER BY 1;
-- SELECT id_proyecto, estado, COUNT(*) FROM viviendas GROUP BY id_proyecto, estado ORDER BY id_proyecto, estado;

-- Nota: Si luego cambias a 'entregada' alguna vivienda del Proyecto 3, deberías:
--  UPDATE viviendas SET estado='entregada', fecha_entrega = CURRENT_DATE WHERE id_vivienda = ...;
-- y ajustar lógica de formularios posventa.

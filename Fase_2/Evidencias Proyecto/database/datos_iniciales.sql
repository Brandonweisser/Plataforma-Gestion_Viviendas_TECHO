-- ========================================
-- DATOS DE PRUEBA - SISTEMA TECHO
-- ========================================

-- Usuarios del sistema
INSERT INTO usuarios (uid, nombre, email, rol, rut, direccion, password_hash) VALUES
(1, 'Administrador Sistema', 'admin@techo.org', 'administrador', '12345678-9', 'Oficina Central TECHO', '$2b$10$8K1p/a0dFFsg'),
(2, 'Carlos Mendoza', 'carlos.mendoza@techo.org', 'tecnico', '23456789-0', 'Región Metropolitana', '$2b$10$8K1p/a0dFFsg'),
(3, 'María González', 'maria.gonzalez@techo.org', 'tecnico', '34567890-1', 'Región del Maule', '$2b$10$8K1p/a0dFFsg'),
(4, 'Juan Pérez', 'juan.perez@email.com', 'beneficiario', '45678901-2', 'La Pintana, Santiago', '$2b$10$8K1p/a0dFFsg'),
(5, 'Ana Silva', 'ana.silva@email.com', 'beneficiario', '56789012-3', 'Puente Alto, Santiago', '$2b$10$8K1p/a0dFFsg'),
(6, 'Pedro Morales', 'pedro.morales@email.com', 'beneficiario', '67890123-4', 'Maipú, Santiago', '$2b$10$8K1p/a0dFFsg');

-- Proyectos habitacionales
INSERT INTO proyecto (id_proyecto, nombre, ubicacion, fecha_inicio, fecha_entrega, viviendas_count) VALUES
(1, 'Villa Esperanza', 'La Pintana, Región Metropolitana', '2024-01-15', '2024-08-30', 25),
(2, 'Conjunto Los Aromos', 'Puente Alto, Región Metropolitana', '2024-03-01', '2024-10-15', 18),
(3, 'Barrio Nuevo Amanecer', 'Maipú, Región Metropolitana', '2024-02-10', '2024-09-20', 12);

-- Viviendas
INSERT INTO viviendas (id_vivienda, id_proyecto, direccion, estado, fecha_entrega, beneficiario_uid, tipo_vivienda) VALUES
(1, 1, 'Calle Principal 123', 'entregada', '2024-08-15', 4, '2D'),
(2, 1, 'Calle Principal 125', 'entregada', '2024-08-20', 5, '2D'),
(3, 1, 'Calle Principal 127', 'asignada', NULL, 6, '1D'),
(4, 2, 'Los Aromos 45', 'en_construccion', NULL, NULL, '3D'),
(5, 2, 'Los Aromos 47', 'planificada', NULL, NULL, '2D'),
(6, 3, 'Nuevo Amanecer 12', 'planificada', NULL, NULL, '1D');

-- Incidencias de ejemplo
INSERT INTO incidencias (id_vivienda, id_usuario_reporta, id_usuario_tecnico, descripcion, estado, categoria, prioridad, fecha_reporte) VALUES
(1, 4, 2, 'Problema con la llave del lavaplatos que gotea constantemente', 'en_proceso', 'Plomería', 'media', '2024-09-01 10:30:00'),
(2, 5, 2, 'Interruptor de luz del dormitorio no funciona', 'abierta', 'Eléctrica', 'alta', '2024-09-05 14:15:00'),
(1, 4, 3, 'Puerta principal no cierra correctamente', 'resuelta', 'Carpintería', 'baja', '2024-08-25 09:00:00');

-- Templates de postventa
INSERT INTO postventa_template (id, nombre, tipo_vivienda, version, activo) VALUES
(1, 'Evaluación Estándar 1D', '1D', 1, true),
(2, 'Evaluación Estándar 2D', '2D', 1, true),
(3, 'Evaluación Estándar 3D', '3D', 1, true);

-- Items de template para vivienda 1D
INSERT INTO postventa_template_item (template_id, categoria, item, orden, severidad_sugerida) VALUES
(1, 'Estructura', 'Estado de paredes exteriores', 1, 'mayor'),
(1, 'Estructura', 'Estado del techo', 2, 'mayor'),
(1, 'Estructura', 'Condición del piso', 3, 'media'),
(1, 'Instalaciones', 'Sistema eléctrico', 4, 'mayor'),
(1, 'Instalaciones', 'Instalaciones de agua', 5, 'mayor'),
(1, 'Acabados', 'Estado de puertas', 6, 'media'),
(1, 'Acabados', 'Estado de ventanas', 7, 'media'),
(1, 'Limpieza', 'Limpieza general', 8, 'menor');

-- Items de template para vivienda 2D
INSERT INTO postventa_template_item (template_id, categoria, item, orden, severidad_sugerida) VALUES
(2, 'Estructura', 'Estado de paredes exteriores', 1, 'mayor'),
(2, 'Estructura', 'Estado del techo', 2, 'mayor'),
(2, 'Estructura', 'Condición del piso sala', 3, 'media'),
(2, 'Estructura', 'Condición del piso dormitorios', 4, 'media'),
(2, 'Instalaciones', 'Sistema eléctrico general', 5, 'mayor'),
(2, 'Instalaciones', 'Instalaciones de agua cocina', 6, 'mayor'),
(2, 'Instalaciones', 'Instalaciones de agua baño', 7, 'mayor'),
(2, 'Acabados', 'Estado de puertas', 8, 'media'),
(2, 'Acabados', 'Estado de ventanas', 9, 'media'),
(2, 'Limpieza', 'Limpieza general', 10, 'menor');

-- Items de template para vivienda 3D
INSERT INTO postventa_template_item (template_id, categoria, item, orden, severidad_sugerida) VALUES
(3, 'Estructura', 'Estado de paredes exteriores', 1, 'mayor'),
(3, 'Estructura', 'Estado del techo', 2, 'mayor'),
(3, 'Estructura', 'Condición del piso planta baja', 3, 'media'),
(3, 'Estructura', 'Condición del piso segundo piso', 4, 'media'),
(3, 'Instalaciones', 'Sistema eléctrico planta baja', 5, 'mayor'),
(3, 'Instalaciones', 'Sistema eléctrico segundo piso', 6, 'mayor'),
(3, 'Instalaciones', 'Instalaciones de agua cocina', 7, 'mayor'),
(3, 'Instalaciones', 'Instalaciones de agua baños', 8, 'mayor'),
(3, 'Acabados', 'Estado de puertas interiores', 9, 'media'),
(3, 'Acabados', 'Estado de ventanas', 10, 'media'),
(3, 'Acabados', 'Escalera interna', 11, 'mayor'),
(3, 'Limpieza', 'Limpieza general', 12, 'menor');


BEGIN;

TRUNCATE TABLE
	audit_log,
	incidencia_historial,
	incidencias,
	media,
	media_legacy,
	password_recovery_codes,
	postventa_template_item,
	postventa_template,
	proyecto_tecnico,
	vivienda_postventa_item,
	vivienda_postventa_form,
	vivienda_recepcion_item,
	vivienda_recepcion,
	viviendas,
	proyecto
RESTART IDENTITY CASCADE;


-- Recalcular contador
UPDATE proyecto p SET viviendas_count = (
	SELECT COUNT(*) FROM viviendas v WHERE v.id_proyecto = p.id_proyecto
);

-- (Opcional) Asignar técnico (descomentar si hay rol = 'tecnico')
-- INSERT INTO proyecto_tecnico (id_proyecto, tecnico_uid)
-- SELECT p.id_proyecto,
--        (SELECT u.uid FROM usuarios u WHERE u.rol = 'tecnico' ORDER BY u.uid LIMIT 1)
-- FROM proyecto p
-- WHERE EXISTS (SELECT 1 FROM usuarios u2 WHERE u2.rol = 'tecnico');

-- (Opcional) Distribuir beneficiarios a viviendas asignadas / entregadas
-- WITH beneficiarios AS (
--   SELECT uid, ROW_NUMBER() OVER (ORDER BY uid) rn FROM usuarios WHERE rol = 'beneficiario'
-- ), target AS (
--   SELECT id_vivienda, ROW_NUMBER() OVER (ORDER BY id_vivienda) rn
--   FROM viviendas WHERE estado IN ('asignada','entregada')
-- )
-- UPDATE viviendas v SET beneficiario_uid = b.uid
-- FROM target t JOIN beneficiarios b ON b.rn = t.rn
-- WHERE v.id_vivienda = t.id_vivienda;

COMMIT;

-- Verificación (ejecutar según necesites)
-- SELECT id_proyecto, nombre, viviendas_count FROM proyecto ORDER BY id_proyecto;
-- SELECT id_proyecto, estado, COUNT(*) FROM viviendas GROUP BY 1,2 ORDER BY 1,2;
-- ========================= FIN BLOQUE RESETEO ========================

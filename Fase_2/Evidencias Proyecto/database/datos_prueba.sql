-- ========================================
-- DATOS DE PRUEBA - PLATAFORMA TECHO
-- Datos iniciales para testing y demostración
-- ========================================

-- ========================================
-- USUARIOS DE PRUEBA
-- ========================================

-- Contraseñas hasheadas con bcrypt (todas usan "123456" para simplicidad)
INSERT INTO usuarios (uid, nombre, email, rol, rut, direccion, password_hash) VALUES
(1, 'Administrador Sistema', 'admin@techo.org', 'administrador', '12345678-9', 'Oficina Central TECHO', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(2, 'Juan Pérez', 'tecnico@techo.org', 'tecnico', '87654321-0', 'Santiago Centro', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(3, 'María González', 'beneficiario@techo.org', 'beneficiario', '11111111-1', 'Villa Esperanza 123', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(4, 'Carlos Rodríguez', 'tecnico2@techo.org', 'tecnico', '22222222-2', 'Maipú', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(5, 'Ana Martínez', 'beneficiario2@techo.org', 'beneficiario', '33333333-3', 'Villa Nueva 456', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(6, 'Pedro Silva', 'beneficiario3@techo.org', 'beneficiario', '44444444-4', 'El Bosque', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (uid) DO NOTHING;

-- ========================================
-- PROYECTOS DE PRUEBA
-- ========================================

INSERT INTO proyecto (id_proyecto, nombre, ubicacion, fecha_inicio, fecha_entrega, viviendas_count) VALUES
(1, 'Villa Esperanza', 'Santiago', '2024-01-15', '2024-06-30', 15),
(2, 'Nuevo Horizonte', 'Valparaíso', '2024-03-01', '2024-08-15', 20),
(3, 'Casa Propia', 'Concepción', '2024-05-01', '2024-10-30', 12)
ON CONFLICT (id_proyecto) DO NOTHING;

-- ========================================
-- VIVIENDAS DE PRUEBA
-- ========================================

INSERT INTO viviendas (id_vivienda, id_proyecto, direccion, estado, fecha_entrega, beneficiario_uid, tipo_vivienda) VALUES
-- Proyecto Villa Esperanza
(1, 1, 'Villa Esperanza 123', 'entregada', '2024-06-15', 3, '2D'),
(2, 1, 'Villa Esperanza 124', 'entregada', '2024-06-20', 5, '2D'),
(3, 1, 'Villa Esperanza 125', 'asignada', NULL, 6, '2D'),
(4, 1, 'Villa Esperanza 126', 'en_construccion', NULL, NULL, '2D'),
(5, 1, 'Villa Esperanza 127', 'planificada', NULL, NULL, '2D'),

-- Proyecto Nuevo Horizonte
(6, 2, 'Nuevo Horizonte 201', 'entregada', '2024-08-10', NULL, '3D'),
(7, 2, 'Nuevo Horizonte 202', 'asignada', NULL, NULL, '3D'),
(8, 2, 'Nuevo Horizonte 203', 'en_construccion', NULL, NULL, '2D'),
(9, 2, 'Nuevo Horizonte 204', 'planificada', NULL, NULL, '2D'),

-- Proyecto Casa Propia
(10, 3, 'Casa Propia 301', 'en_construccion', NULL, NULL, '1D'),
(11, 3, 'Casa Propia 302', 'planificada', NULL, NULL, '1D'),
(12, 3, 'Casa Propia 303', 'planificada', NULL, NULL, '2D')
ON CONFLICT (id_vivienda) DO NOTHING;

-- ========================================
-- INCIDENCIAS DE PRUEBA
-- ========================================

INSERT INTO incidencias (id_vivienda, id_usuario_reporta, id_usuario_tecnico, descripcion, estado, categoria, prioridad) VALUES
(1, 3, 2, 'Filtración en el techo durante días de lluvia', 'en_proceso', 'Estructura', 'alta'),
(1, 3, 2, 'Problema con el desagüe de la cocina', 'abierta', 'Instalaciones', 'media'),
(2, 5, 4, 'Puerta principal no cierra correctamente', 'resuelta', 'Acabados', 'baja'),
(6, 3, 2, 'Falta de agua caliente en el baño', 'abierta', 'Instalaciones', 'alta')
ON CONFLICT DO NOTHING;

-- ========================================
-- TEMPLATES DE POSTVENTA BÁSICOS
-- ========================================

-- Template para viviendas 2D (más común)
INSERT INTO postventa_template (id, nombre, tipo_vivienda, version, activo) VALUES
(2, 'Template 2 Dormitorios', '2D', 1, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO postventa_template_item (template_id, categoria, item, orden, severidad_sugerida) VALUES
(2, 'Estructura', 'Estado de paredes exteriores', 1, 'mayor'),
(2, 'Estructura', 'Estado del techo', 2, 'mayor'),
(2, 'Estructura', 'Tabiques internos', 3, 'media'),
(2, 'Instalaciones', 'Funcionamiento eléctrico', 4, 'mayor'),
(2, 'Instalaciones', 'Sistema de agua en cocina', 5, 'mayor'),
(2, 'Instalaciones', 'Sistema de agua en baño', 6, 'mayor'),
(2, 'Instalaciones', 'Desagües', 7, 'media'),
(2, 'Acabados', 'Puertas dormitorios', 8, 'media'),
(2, 'Acabados', 'Ventanas', 9, 'media'),
(2, 'Acabados', 'Pintura interior', 10, 'menor'),
(2, 'Limpieza', 'Estado general', 11, 'menor')
ON CONFLICT DO NOTHING;

-- ========================================
-- ACTUALIZAR CONTADORES
-- ========================================

-- Actualizar conteo de viviendas por proyecto
UPDATE proyecto SET viviendas_count = (
    SELECT COUNT(*) FROM viviendas WHERE viviendas.id_proyecto = proyecto.id_proyecto
);
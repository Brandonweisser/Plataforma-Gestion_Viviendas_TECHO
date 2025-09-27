-- Script para crear datos de prueba en la base de datos
-- Ejecutar en el SQL Editor de Supabase

-- 1. CREAR USUARIOS DE PRUEBA
INSERT INTO usuarios (uid, nombre, email, rol, rut, direccion, password_hash) VALUES 
  -- Administradores
  (1, 'María Administradora', 'admin@techo.org', 'administrador', '12345678-9', 'Santiago, Chile', '$2b$10$example.hash.for.password123'),
  
  -- Técnicos
  (2, 'Juan Técnico Principal', 'tecnico1@techo.org', 'tecnico', '23456789-0', 'Valparaíso, Chile', '$2b$10$example.hash.for.password123'),
  (3, 'Ana Técnica Especialista', 'tecnico2@techo.org', 'tecnico', '34567890-1', 'Concepción, Chile', '$2b$10$example.hash.for.password123'),
  
  -- Beneficiarios
  (4, 'Carlos Beneficiario González', 'carlos.gonzalez@email.com', 'beneficiario', '45678901-2', 'Población Los Olivos, Lote 15', '$2b$10$example.hash.for.password123'),
  (5, 'Patricia Beneficiaria López', 'patricia.lopez@email.com', 'beneficiario', '56789012-3', 'Villa Esperanza, Casa 22', '$2b$10$example.hash.for.password123'),
  (6, 'Roberto Beneficiario Martínez', 'roberto.martinez@email.com', 'beneficiario', '67890123-4', 'Nuevo Amanecer, Sitio 8', '$2b$10$example.hash.for.password123'),
  (7, 'Sofía Beneficiaria Ramírez', 'sofia.ramirez@email.com', 'beneficiario', '78901234-5', 'Las Flores, Manzana B Casa 5', '$2b$10$example.hash.for.password123')
ON CONFLICT (uid) DO NOTHING;

-- 2. CREAR PROYECTOS
INSERT INTO proyecto (id_proyecto, nombre, ubicacion, fecha_inicio, fecha_entrega, viviendas_count) VALUES 
  (1, 'Proyecto Villa Esperanza', 'San Bernardo, Región Metropolitana', '2024-03-15', '2024-08-30', 25),
  (2, 'Proyecto Nuevo Amanecer', 'Valparaíso, Región de Valparaíso', '2024-05-01', '2024-10-15', 30),
  (3, 'Proyecto Las Flores', 'Concepción, Región del Biobío', '2024-06-10', '2024-11-20', 20)
ON CONFLICT (id_proyecto) DO NOTHING;

-- 3. CREAR VIVIENDAS
INSERT INTO viviendas (id_vivienda, id_proyecto, direccion, estado, fecha_entrega, beneficiario_uid, tipo_vivienda) VALUES 
  -- Proyecto Villa Esperanza (entregadas)
  (1, 1, 'Villa Esperanza, Casa 22', 'entregada', '2024-08-30', 5, '2D'),
  (2, 1, 'Villa Esperanza, Casa 23', 'entregada', '2024-08-30', 4, '2D'),
  (3, 1, 'Villa Esperanza, Casa 24', 'entregada', '2024-08-30', 6, '3D'),
  
  -- Proyecto Nuevo Amanecer (en construcción y algunas entregadas)
  (4, 2, 'Nuevo Amanecer, Sitio 8', 'entregada', '2024-10-15', 6, '1D'),
  (5, 2, 'Nuevo Amanecer, Sitio 9', 'en_construccion', null, null, '2D'),
  (6, 2, 'Nuevo Amanecer, Sitio 10', 'en_construccion', null, null, '2D'),
  
  -- Proyecto Las Flores (planificadas)
  (7, 3, 'Las Flores, Manzana B Casa 5', 'entregada', '2024-11-20', 7, '3D'),
  (8, 3, 'Las Flores, Manzana B Casa 6', 'planificada', null, null, '2D'),
  (9, 3, 'Las Flores, Manzana B Casa 7', 'planificada', null, null, '1D')
ON CONFLICT (id_vivienda) DO NOTHING;

-- 4. CREAR INCIDENCIAS DE EJEMPLO
INSERT INTO incidencias (id_vivienda, id_usuario_reporta, id_usuario_tecnico, descripcion, estado, fecha_reporte, categoria, prioridad) VALUES 
  (1, 5, 2, 'Goteo en la llave de la cocina que se ha intensificado desde ayer', 'abierta', '2024-12-20', 'plomeria', 'media'),
  (1, 5, null, 'Puerta del baño no cierra correctamente, la cerradura está suelta', 'abierta', '2024-12-21', 'carpinteria', 'baja'),
  (2, 4, 2, 'Corte de luz intermitente en la habitación principal', 'en_proceso', '2024-12-19', 'electrico', 'alta'),
  (3, 6, 3, 'Grieta pequeña apareció en la pared del living', 'abierta', '2024-12-22', 'estructura', 'media'),
  (4, 6, null, 'Ventana de la cocina no abre completamente', 'abierta', '2024-12-23', 'carpinteria', 'baja'),
  (7, 7, 2, 'Humedad en el techo del baño después de las lluvias', 'resuelta', '2024-12-18', 'estructura', 'alta')
ON CONFLICT DO NOTHING;

-- 5. CREAR TEMPLATES DE POSVENTA
INSERT INTO postventa_template (nombre, tipo_vivienda, version, activo) VALUES 
  ('Template Genérico', null, 1, true),
  ('Template 1 Dormitorio', '1D', 1, true),
  ('Template 2 Dormitorios', '2D', 1, true),
  ('Template 3 Dormitorios', '3D', 1, true)
ON CONFLICT DO NOTHING;

-- 6. CREAR ITEMS DE TEMPLATE GENÉRICO
INSERT INTO postventa_template_item (template_id, categoria, item, orden, severidad_sugerida) VALUES 
  -- Template genérico (ID = 1)
  (1, 'Estructura', 'Techo sin filtraciones', 1, 'mayor'),
  (1, 'Estructura', 'Muros sin grietas visibles', 2, 'media'),
  (1, 'Estructura', 'Piso nivelado y sin daños', 3, 'media'),
  (1, 'Instalaciones Eléctricas', 'Enchufes funcionando correctamente', 4, 'mayor'),
  (1, 'Instalaciones Eléctricas', 'Interruptores operativos', 5, 'mayor'),
  (1, 'Instalaciones Eléctricas', 'Sin cables expuestos', 6, 'mayor'),
  (1, 'Plomería', 'Sin goteos en llaves', 7, 'media'),
  (1, 'Plomería', 'Desagües funcionando', 8, 'mayor'),
  (1, 'Plomería', 'Presión de agua adecuada', 9, 'media'),
  (1, 'Puertas y Ventanas', 'Puertas abren y cierran correctamente', 10, 'menor'),
  (1, 'Puertas y Ventanas', 'Ventanas selladas', 11, 'media'),
  (1, 'Puertas y Ventanas', 'Cerraduras funcionando', 12, 'menor')
ON CONFLICT DO NOTHING;

-- 7. CREAR ITEMS ESPECÍFICOS PARA TEMPLATE 2D
INSERT INTO postventa_template_item (template_id, categoria, item, orden, severidad_sugerida) VALUES 
  (3, 'Dormitorio Principal', 'Ventana del dormitorio sellada', 13, 'media'),
  (3, 'Dormitorio Principal', 'Puerta del dormitorio alineada', 14, 'menor'),
  (3, 'Dormitorio Secundario', 'Espacio libre de humedad', 15, 'mayor'),
  (3, 'Cocina', 'Mesón instalado correctamente', 16, 'media')
ON CONFLICT DO NOTHING;

-- 8. CREAR ITEMS ESPECÍFICOS PARA TEMPLATE 3D  
INSERT INTO postventa_template_item (template_id, categoria, item, orden, severidad_sugerida) VALUES 
  (4, 'Dormitorio Principal', 'Closet instalado', 17, 'menor'),
  (4, 'Dormitorios Secundarios', 'Ambos dormitorios con ventilación', 18, 'media'),
  (4, 'Living-Comedor', 'Espacio amplio sin obstrucciones', 19, 'menor'),
  (4, 'Baño', 'Ducha con presión adecuada', 20, 'mayor')
ON CONFLICT DO NOTHING;

-- 9. CREAR HISTORIAL INICIAL PARA INCIDENCIAS EXISTENTES
INSERT INTO incidencia_historial (incidencia_id, actor_uid, actor_rol, tipo_evento, estado_anterior, estado_nuevo, comentario) VALUES 
  (1, 5, 'beneficiario', 'creada', null, 'abierta', 'Incidencia reportada por beneficiario'),
  (2, 5, 'beneficiario', 'creada', null, 'abierta', 'Incidencia reportada por beneficiario'),
  (3, 4, 'beneficiario', 'creada', null, 'abierta', 'Incidencia reportada por beneficiario'),
  (3, 2, 'tecnico', 'asignacion', 'abierta', 'en_proceso', 'Técnico asignado para revisión'),
  (4, 6, 'beneficiario', 'creada', null, 'abierta', 'Incidencia reportada por beneficiario'),
  (5, 6, 'beneficiario', 'creada', null, 'abierta', 'Incidencia reportada por beneficiario'),
  (6, 7, 'beneficiario', 'creada', null, 'abierta', 'Incidencia reportada por beneficiario'),
  (6, 2, 'tecnico', 'resolucion', 'en_proceso', 'resuelta', 'Problema solucionado, se aplicó sellante al techo')
ON CONFLICT DO NOTHING;

-- Actualizar las secuencias para que los próximos IDs sean correctos
SELECT setval('usuarios_uid_seq', (SELECT MAX(uid) FROM usuarios), true);
SELECT setval('proyecto_id_proyecto_seq', (SELECT MAX(id_proyecto) FROM proyecto), true);  
SELECT setval('viviendas_id_vivienda_seq', (SELECT MAX(id_vivienda) FROM viviendas), true);

-- Verificación: mostrar resumen de datos creados
SELECT 'Usuarios creados:' as tabla, COUNT(*) as total FROM usuarios
UNION ALL
SELECT 'Proyectos creados:', COUNT(*) FROM proyecto  
UNION ALL
SELECT 'Viviendas creadas:', COUNT(*) FROM viviendas
UNION ALL
SELECT 'Incidencias creadas:', COUNT(*) FROM incidencias
UNION ALL
SELECT 'Templates creados:', COUNT(*) FROM postventa_template
UNION ALL  
SELECT 'Items de template:', COUNT(*) FROM postventa_template_item
UNION ALL
SELECT 'Eventos de historial:', COUNT(*) FROM incidencia_historial;
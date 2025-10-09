-- Nueva tabla: Templates de Casa
-- Estos definen los tipos de casa con todas sus características

CREATE TABLE IF NOT EXISTS casa_templates (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE, -- "Casa 2D Básica", "Casa 3D Premium", etc.
    descripcion TEXT,
    metros_totales NUMERIC(6,2) NOT NULL,
    numero_habitaciones INTEGER NOT NULL,
    numero_banos INTEGER NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de habitaciones por template
CREATE TABLE IF NOT EXISTS casa_template_habitaciones (
    id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL REFERENCES casa_templates(id) ON DELETE CASCADE,
    nombre_habitacion TEXT NOT NULL, -- "Dormitorio Principal", "Cocina", "Baño", etc.
    metros_cuadrados NUMERIC(6,2) NOT NULL,
    tipo_habitacion TEXT NOT NULL, -- "dormitorio", "cocina", "bano", "living", "otro"
    orden INTEGER DEFAULT 1, -- Para ordenar en formularios
    caracteristicas_especiales JSONB DEFAULT '{}', -- ventanas, instalaciones, etc.
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Items de formulario por habitación (para formularios de postventa)
CREATE TABLE IF NOT EXISTS habitacion_form_items (
    id SERIAL PRIMARY KEY,
    template_habitacion_id INTEGER NOT NULL REFERENCES casa_template_habitaciones(id) ON DELETE CASCADE,
    nombre_item TEXT NOT NULL, -- "Estado de ventanas", "Funcionamiento grifería", etc.
    tipo_input TEXT NOT NULL, -- "text", "select", "checkbox", "rating", "textarea"
    opciones JSONB DEFAULT '[]', -- Para selects: ["Excelente", "Bueno", "Regular", "Malo"]
    obligatorio BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 1,
    categoria TEXT, -- "instalaciones", "estructura", "acabados", "limpieza"
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_template_habitaciones_template ON casa_template_habitaciones(template_id);
CREATE INDEX IF NOT EXISTS idx_form_items_habitacion ON habitacion_form_items(template_habitacion_id);

-- Datos iniciales de ejemplo
INSERT INTO casa_templates (nombre, descripcion, metros_totales, numero_habitaciones, numero_banos) VALUES
('Casa 1D Básica', 'Casa de 1 dormitorio, ideal para personas solas', 42.0, 1, 1),
('Casa 2D Estándar', 'Casa de 2 dormitorios, perfecta para familias pequeñas', 62.0, 2, 1),
('Casa 3D Familiar', 'Casa de 3 dormitorios con espacios amplios', 85.0, 3, 2)
ON CONFLICT (nombre) DO NOTHING;

-- Habitaciones para Casa 1D Básica
INSERT INTO casa_template_habitaciones (template_id, nombre_habitacion, metros_cuadrados, tipo_habitacion, orden) 
SELECT id, 'Dormitorio Principal', 12.0, 'dormitorio', 1 FROM casa_templates WHERE nombre = 'Casa 1D Básica'
UNION ALL
SELECT id, 'Cocina-Comedor', 15.0, 'cocina', 2 FROM casa_templates WHERE nombre = 'Casa 1D Básica'
UNION ALL
SELECT id, 'Baño', 6.0, 'bano', 3 FROM casa_templates WHERE nombre = 'Casa 1D Básica'
UNION ALL
SELECT id, 'Living', 9.0, 'living', 4 FROM casa_templates WHERE nombre = 'Casa 1D Básica';

-- Habitaciones para Casa 2D Estándar
INSERT INTO casa_template_habitaciones (template_id, nombre_habitacion, metros_cuadrados, tipo_habitacion, orden) 
SELECT id, 'Dormitorio Principal', 14.0, 'dormitorio', 1 FROM casa_templates WHERE nombre = 'Casa 2D Estándar'
UNION ALL
SELECT id, 'Dormitorio Secundario', 10.0, 'dormitorio', 2 FROM casa_templates WHERE nombre = 'Casa 2D Estándar'
UNION ALL
SELECT id, 'Cocina', 12.0, 'cocina', 3 FROM casa_templates WHERE nombre = 'Casa 2D Estándar'
UNION ALL
SELECT id, 'Comedor', 10.0, 'comedor', 4 FROM casa_templates WHERE nombre = 'Casa 2D Estándar'
UNION ALL
SELECT id, 'Baño', 8.0, 'bano', 5 FROM casa_templates WHERE nombre = 'Casa 2D Estándar'
UNION ALL
SELECT id, 'Living', 8.0, 'living', 6 FROM casa_templates WHERE nombre = 'Casa 2D Estándar';

-- Items de formulario de ejemplo para Dormitorio Principal
INSERT INTO habitacion_form_items (template_habitacion_id, nombre_item, tipo_input, opciones, categoria, orden)
SELECT h.id, 'Estado general de la habitación', 'select', '["Excelente", "Bueno", "Regular", "Malo"]', 'estructura', 1
FROM casa_template_habitaciones h 
JOIN casa_templates t ON h.template_id = t.id 
WHERE h.nombre_habitacion = 'Dormitorio Principal' AND t.nombre = 'Casa 2D Estándar'
UNION ALL
SELECT h.id, 'Funcionamiento de ventanas', 'select', '["Perfecto", "Funciona bien", "Con dificultades", "No funciona"]', 'instalaciones', 2
FROM casa_template_habitaciones h 
JOIN casa_templates t ON h.template_id = t.id 
WHERE h.nombre_habitacion = 'Dormitorio Principal' AND t.nombre = 'Casa 2D Estándar'
UNION ALL
SELECT h.id, 'Comentarios adicionales', 'textarea', '[]', 'general', 3
FROM casa_template_habitaciones h 
JOIN casa_templates t ON h.template_id = t.id 
WHERE h.nombre_habitacion = 'Dormitorio Principal' AND t.nombre = 'Casa 2D Estándar';

-- Actualizar tabla viviendas para usar template_id en lugar de campos individuales
ALTER TABLE viviendas 
ADD COLUMN IF NOT EXISTS template_id INTEGER REFERENCES casa_templates(id),
ADD COLUMN IF NOT EXISTS template_nombre TEXT; -- Para mantener compatibilidad

-- Comentarios
COMMENT ON TABLE casa_templates IS 'Templates de tipos de casa con especificaciones completas';
COMMENT ON TABLE casa_template_habitaciones IS 'Habitaciones específicas de cada template de casa';
COMMENT ON TABLE habitacion_form_items IS 'Items de formulario de postventa por habitación';
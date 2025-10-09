-- Migración: Agregar campo tipo_template a viviendas
-- Fecha: 2025-10-07
-- Descripción: Agrega el campo tipo_template para diferenciar los formularios de postventa

ALTER TABLE viviendas 
ADD COLUMN IF NOT EXISTS tipo_template TEXT NOT NULL DEFAULT '2D' CHECK (tipo_template IN ('1D', '2D', '3D'));

-- Comentario para documentar el campo
COMMENT ON COLUMN viviendas.tipo_template IS 'Template de formulario de postventa: 1D (Básico), 2D (Estándar), 3D (Avanzado)';
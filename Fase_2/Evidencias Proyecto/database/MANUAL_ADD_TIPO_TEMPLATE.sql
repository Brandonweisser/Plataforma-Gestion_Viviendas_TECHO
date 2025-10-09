-- INSTRUCCIONES PARA EJECUTAR EN SUPABASE SQL EDITOR
-- 
-- 1. Ve a tu proyecto Supabase
-- 2. Abre el SQL Editor
-- 3. Ejecuta este comando:

ALTER TABLE viviendas 
ADD COLUMN tipo_template TEXT NOT NULL DEFAULT '2D' 
CHECK (tipo_template IN ('1D', '2D', '3D'));

-- 4. Agregar comentario para documentación:
COMMENT ON COLUMN viviendas.tipo_template IS 'Template de formulario de postventa: 1D (Básico), 2D (Estándar), 3D (Avanzado)';

-- 5. Verificar que se agregó correctamente:
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'viviendas' AND column_name = 'tipo_template';

-- 6. Actualizar viviendas existentes con base en tipo_vivienda (opcional):
-- UPDATE viviendas SET tipo_template = '1D' WHERE tipo_vivienda = 'departamento';
-- UPDATE viviendas SET tipo_template = '3D' WHERE tipo_vivienda = 'duplex';
-- Las casas mantendrán el default '2D'
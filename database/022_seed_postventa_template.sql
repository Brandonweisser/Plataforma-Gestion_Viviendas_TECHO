-- 022_seed_postventa_template.sql
-- Crea un template genérico básico si no existe ninguno activo.
-- Idempotente.


-- Crear template genérico base (version 1) sólo si no existe alguno genérico activo
WITH existing AS (
  SELECT id FROM postventa_template 
  WHERE tipo_vivienda IS NULL AND activo = true
  LIMIT 1
), inserted AS (
  INSERT INTO postventa_template (nombre, tipo_vivienda, version, activo)
  SELECT 'Template Genérico Base', NULL, 1, true
  WHERE NOT EXISTS (SELECT 1 FROM existing)
  RETURNING id
)
SELECT 'Template genérico base OK' AS info;

-- Poblar items mínimos si el template recién creado tiene 0 items
WITH gen AS (
  SELECT id FROM postventa_template 
  WHERE tipo_vivienda IS NULL AND activo = true
  ORDER BY version DESC, id DESC
  LIMIT 1
), cnt AS (
  SELECT COUNT(*) AS c FROM postventa_template_item WHERE template_id = (SELECT id FROM gen)
)
INSERT INTO postventa_template_item (template_id, categoria, item, orden, severidad_sugerida)
SELECT (SELECT id FROM gen), x.categoria, x.item, x.orden, x.severidad
FROM (
  VALUES
    ('General','Estructura básica sin daños', 1, 'media'),
    ('General','Puertas y ventanas funcionales', 2, 'menor'),
    ('General','Instalaciones eléctricas seguras', 3, 'mayor'),
    ('General','Red de agua sin filtraciones visibles', 4, 'media')
) AS x(categoria,item,orden,severidad)
WHERE (SELECT c FROM cnt) = 0;


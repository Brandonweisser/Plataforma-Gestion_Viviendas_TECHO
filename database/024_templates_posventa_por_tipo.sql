-- 024_templates_posventa_por_tipo.sql
-- Crea templates específicos por tipo de vivienda (2D y 3D) si no existen.
-- Cada uno con un set diferenciado de items. Idempotente.


-- Template 2D versión 1
WITH t2d AS (
  SELECT id FROM postventa_template WHERE tipo_vivienda = '2D' AND version = 1 LIMIT 1
), ins2d AS (
  INSERT INTO postventa_template (nombre, tipo_vivienda, version, activo)
  SELECT 'Template 2D v1','2D',1,true
  WHERE NOT EXISTS (SELECT 1 FROM t2d)
  RETURNING id
)
SELECT 'Template 2D listo' AS info;

-- Items 2D si vacío
WITH t AS (
  SELECT id FROM postventa_template WHERE tipo_vivienda = '2D' AND version = 1 LIMIT 1
), cnt AS (
  SELECT COUNT(*) c FROM postventa_template_item WHERE template_id = (SELECT id FROM t)
)
INSERT INTO postventa_template_item (template_id, categoria, item, orden, severidad_sugerida)
SELECT (SELECT id FROM t), categoria, item, orden, sev FROM (
  VALUES
    ('Dormitorio Principal','Ventana sellada',1,'media'),
    ('Dormitorio Principal','Puerta alineada',2,'menor'),
    ('Dormitorio Secundario','Espacio libre de humedad',3,'mayor'),
    ('Cocina','Mesón firme y sin daños',4,'media'),
    ('Cocina','Instalación eléctrica segura',5,'mayor'),
    ('Baño','Desagüe funcionando',6,'mayor'),
    ('Baño','Lavamanos sin filtraciones',7,'media'),
    ('General','Ventilación adecuada',8,'media')
) AS x(categoria,item,orden,sev)
WHERE (SELECT c FROM cnt)=0;

-- Template 3D versión 1
WITH t3d AS (
  SELECT id FROM postventa_template WHERE tipo_vivienda = '3D' AND version = 1 LIMIT 1
), ins3d AS (
  INSERT INTO postventa_template (nombre, tipo_vivienda, version, activo)
  SELECT 'Template 3D v1','3D',1,true
  WHERE NOT EXISTS (SELECT 1 FROM t3d)
  RETURNING id
)
SELECT 'Template 3D listo' AS info;

-- Items 3D si vacío
WITH t AS (
  SELECT id FROM postventa_template WHERE tipo_vivienda = '3D' AND version = 1 LIMIT 1
), cnt AS (
  SELECT COUNT(*) c FROM postventa_template_item WHERE template_id = (SELECT id FROM t)
)
INSERT INTO postventa_template_item (template_id, categoria, item, orden, severidad_sugerida)
SELECT (SELECT id FROM t), categoria, item, orden, sev FROM (
  VALUES
    ('Dormitorio Principal','Closet instalado',1,'menor'),
    ('Dormitorio Principal','Ventilación adecuada',2,'media'),
    ('Dormitorios Secundarios','Ventilación en ambos dormitorios',3,'media'),
    ('Dormitorios Secundarios','Puertas correctamente alineadas',4,'menor'),
    ('Living-Comedor','Espacio sin obstrucciones',5,'menor'),
    ('Living-Comedor','Iluminación natural suficiente',6,'menor'),
    ('Baño','Ducha con presión adecuada',7,'mayor'),
    ('Baño','Extractor funcionando (si aplica)',8,'media'),
    ('Cocina','Muebles firmes y bien instalados',9,'media'),
    ('Cocina','Conexiones de gas seguras',10,'mayor'),
    ('General','Instalaciones eléctricas adicionales OK',11,'mayor'),
    ('General','Ausencia de filtraciones en ampliaciones',12,'media')
) AS x(categoria,item,orden,sev)
WHERE (SELECT c FROM cnt)=0;


-- 025_fix_templates_posventa_tipos.sql
-- Corrige templates específicos 2D y 3D si fueron creados parcialmente (p.ej. sólo 0/1 ítem)
-- Lógica: si el template activo (mayor versión) tiene < umbral esperado, se borran sus items y se insertan los correctos.
-- Umbrales: 2D => 8 items, 3D => 12 items.

-- ==== FIX 2D (espera 8 items) ====
WITH t AS (
  SELECT id FROM postventa_template WHERE tipo_vivienda = '2D' AND activo = true ORDER BY version DESC, id DESC LIMIT 1
), cnt AS (
  SELECT (SELECT id FROM t) AS id, (SELECT COUNT(*) FROM postventa_template_item WHERE template_id = (SELECT id FROM t)) AS c
), del AS (
  DELETE FROM postventa_template_item WHERE template_id = (SELECT id FROM cnt) AND (SELECT c FROM cnt) < 8 RETURNING 1
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
WHERE (SELECT c FROM cnt) < 8;

-- ==== FIX 3D (espera 12 items) ====
WITH t AS (
  SELECT id FROM postventa_template WHERE tipo_vivienda = '3D' AND activo = true ORDER BY version DESC, id DESC LIMIT 1
), cnt AS (
  SELECT (SELECT id FROM t) AS id, (SELECT COUNT(*) FROM postventa_template_item WHERE template_id = (SELECT id FROM t)) AS c
), del AS (
  DELETE FROM postventa_template_item WHERE template_id = (SELECT id FROM cnt) AND (SELECT c FROM cnt) < 12 RETURNING 1
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
WHERE (SELECT c FROM cnt) < 12;

-- Ver resumen después del fix
SELECT '2D items tras fix' AS info, (SELECT COUNT(*) FROM postventa_template_item WHERE template_id = (SELECT id FROM postventa_template WHERE tipo_vivienda='2D' AND activo=true ORDER BY version DESC LIMIT 1)) AS total
UNION ALL
SELECT '3D items tras fix', (SELECT COUNT(*) FROM postventa_template_item WHERE template_id = (SELECT id FROM postventa_template WHERE tipo_vivienda='3D' AND activo=true ORDER BY version DESC LIMIT 1));
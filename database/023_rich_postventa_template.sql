-- 023_rich_postventa_template.sql
-- Crea / actualiza un template genérico más rico (version 2) con ~20 items.
-- Desactiva versiones genéricas anteriores.
-- Idempotente: sólo inserta la versión 2 si no existe.


-- Insertar versión 2 genérica si no existe
WITH have AS (
  SELECT id FROM postventa_template WHERE tipo_vivienda IS NULL AND version = 2 LIMIT 1
), ins AS (
  INSERT INTO postventa_template (nombre, tipo_vivienda, version, activo)
  SELECT 'Template Genérico V2', NULL, 2, true
  WHERE NOT EXISTS (SELECT 1 FROM have)
  RETURNING id
)
SELECT 'Template genérico v2 OK' AS info;

-- Desactivar otras versiones genéricas activas distintas de la 2
UPDATE postventa_template
SET activo = false
WHERE tipo_vivienda IS NULL AND version <> 2 AND activo = true;

-- Poblar items si la versión 2 no tiene
WITH t AS (
  SELECT id FROM postventa_template WHERE tipo_vivienda IS NULL AND version = 2 LIMIT 1
), cnt AS (
  SELECT COUNT(*) c FROM postventa_template_item WHERE template_id = (SELECT id FROM t)
)
INSERT INTO postventa_template_item (template_id, categoria, item, orden, severidad_sugerida)
SELECT (SELECT id FROM t), categoria, item, orden, severidad FROM (
  VALUES
    ('Estructura','Techo sin filtraciones',1,'mayor'),
    ('Estructura','Muros sin grietas visibles',2,'media'),
    ('Estructura','Piso nivelado y sin daños',3,'media'),
    ('Estructura','Uniones estructurales firmes',4,'mayor'),
    ('Instalaciones Eléctricas','Enchufes funcionando',5,'mayor'),
    ('Instalaciones Eléctricas','Interruptores operativos',6,'mayor'),
    ('Instalaciones Eléctricas','Sin cables expuestos',7,'mayor'),
    ('Instalaciones Eléctricas','Tablero eléctrico sellado',8,'mayor'),
    ('Plomería','Sin goteos en llaves',9,'media'),
    ('Plomería','Desagües funcionando',10,'mayor'),
    ('Plomería','Presión de agua adecuada',11,'media'),
    ('Plomería','WC descarga correctamente',12,'media'),
    ('Puertas y Ventanas','Puertas abren/cierra bien',13,'menor'),
    ('Puertas y Ventanas','Ventanas selladas',14,'media'),
    ('Puertas y Ventanas','Cerraduras funcionando',15,'menor'),
    ('Acabados','Pintura sin desprendimientos mayores',16,'menor'),
    ('Acabados','Revestimientos bien instalados',17,'media'),
    ('Ambientes','Ventilación adecuada general',18,'media'),
    ('Ambientes','Iluminación natural suficiente',19,'menor'),
    ('Seguridad','Ausencia de riesgos inmediatos',20,'mayor')
) AS x(categoria,item,orden,severidad)
WHERE (SELECT c FROM cnt) = 0;


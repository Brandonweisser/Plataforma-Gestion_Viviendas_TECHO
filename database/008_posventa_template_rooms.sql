-- 008_posventa_template_rooms.sql
-- Template posventa por habitaciones (Living, Cocina, Baño, Habitaciones, Exterior)
-- Idempotente: sólo inserta si no existe un template con este nombre.

BEGIN;

DO $$
DECLARE tpl_id BIGINT; BEGIN
  SELECT id INTO tpl_id FROM postventa_template WHERE nombre = 'Posventa Habitaciones Base' LIMIT 1;
  IF tpl_id IS NULL THEN
    INSERT INTO postventa_template (nombre, tipo_vivienda, version, activo)
    VALUES ('Posventa Habitaciones Base', NULL, 1, true)
    RETURNING id INTO tpl_id;

    -- Living
    INSERT INTO postventa_template_item (template_id, categoria, item, orden) VALUES
      (tpl_id, 'Living', 'Estado de piso adecuado', 1),
      (tpl_id, 'Living', 'Ventanas selladas y sin filtraciones', 2),
      (tpl_id, 'Living', 'Enchufes funcionando', 3),
      (tpl_id, 'Living', 'Interruptores operativos', 4),
      (tpl_id, 'Living', 'Puerta principal cierra correctamente', 5);

    -- Cocina
    INSERT INTO postventa_template_item (template_id, categoria, item, orden) VALUES
      (tpl_id, 'Cocina', 'Lavaplatos sin fugas', 1),
      (tpl_id, 'Cocina', 'Gabinetes/almacenaje en buen estado', 2),
      (tpl_id, 'Cocina', 'Enchufes cocina funcionando (zona segura)', 3),
      (tpl_id, 'Cocina', 'Extractor / ventilación operativa', 4),
      (tpl_id, 'Cocina', 'Llave de gas (si aplica) sin fugas', 5);

    -- Baño
    INSERT INTO postventa_template_item (template_id, categoria, item, orden) VALUES
      (tpl_id, 'Baño', 'WC descarga correctamente', 1),
      (tpl_id, 'Baño', 'Lavamanos sin filtraciones', 2),
      (tpl_id, 'Baño', 'Ducha o grifería sin goteos', 3),
      (tpl_id, 'Baño', 'Ventilación adecuada / sin humedad', 4),
      (tpl_id, 'Baño', 'Enchufe (si aplica) funcionando', 5);

    -- Habitación 1
    INSERT INTO postventa_template_item (template_id, categoria, item, orden) VALUES
      (tpl_id, 'Habitación 1', 'Ventana sin filtraciones', 1),
      (tpl_id, 'Habitación 1', 'Paredes sin grietas', 2),
      (tpl_id, 'Habitación 1', 'Enchufes funcionando', 3),
      (tpl_id, 'Habitación 1', 'Puerta cierra correctamente', 4),
      (tpl_id, 'Habitación 1', 'Closet / almacenamiento (si aplica) en buen estado', 5);

    -- Habitación 2
    INSERT INTO postventa_template_item (template_id, categoria, item, orden) VALUES
      (tpl_id, 'Habitación 2', 'Ventana sin filtraciones', 1),
      (tpl_id, 'Habitación 2', 'Paredes sin grietas', 2),
      (tpl_id, 'Habitación 2', 'Enchufes funcionando', 3),
      (tpl_id, 'Habitación 2', 'Puerta cierra correctamente', 4),
      (tpl_id, 'Habitación 2', 'Closet / almacenamiento (si aplica) en buen estado', 5);

    -- Exterior
    INSERT INTO postventa_template_item (template_id, categoria, item, orden) VALUES
      (tpl_id, 'Exterior', 'Techo sin filtraciones visibles', 1),
      (tpl_id, 'Exterior', 'Canaletas limpias y sin obstrucciones', 2),
      (tpl_id, 'Exterior', 'Revestimiento sin daños mayores', 3),
      (tpl_id, 'Exterior', 'Desagües/evacuaciones de agua despejados', 4);
  END IF;
END$$;

COMMIT;

-- Para usar este template basta con tenerlo activo y sin tipo_vivienda.
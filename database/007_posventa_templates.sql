-- 007_posventa_templates.sql
-- Soporte de templates por tipo de vivienda para formulario posventa.
-- Idempotente.

BEGIN;

-- Columna tipo_vivienda en viviendas (si no existe) para mapear template.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='viviendas' AND column_name='tipo_vivienda'
  ) THEN
    ALTER TABLE viviendas ADD COLUMN tipo_vivienda TEXT; -- valores ejemplo: '1D','2D','3D'
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS postventa_template (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo_vivienda TEXT, -- NULL = genérico
  version INT NOT NULL DEFAULT 1,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS postventa_template_item (
  id BIGSERIAL PRIMARY KEY,
  template_id BIGINT NOT NULL REFERENCES postventa_template(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  item TEXT NOT NULL,
  orden INT,
  severidad_sugerida TEXT NULL,
  CHECK (severidad_sugerida IS NULL OR severidad_sugerida IN ('menor','media','mayor'))
);

CREATE INDEX IF NOT EXISTS idx_postventa_template_tipo ON postventa_template(tipo_vivienda, activo);
CREATE INDEX IF NOT EXISTS idx_postventa_template_item_template ON postventa_template_item(template_id);

-- Seeds básicos sólo si no hay ningún template (para ambiente dev/demo)
DO $$
DECLARE c INT; BEGIN
  SELECT COUNT(*) INTO c FROM postventa_template;
  IF c = 0 THEN
    INSERT INTO postventa_template (nombre, tipo_vivienda, version) VALUES
      ('Genérico Posventa', NULL, 1),
      ('Posventa 1D', '1D', 1),
      ('Posventa 2D', '2D', 1),
      ('Posventa 3D', '3D', 1);

    -- Genérico
    INSERT INTO postventa_template_item (template_id, categoria, item, orden) SELECT id, 'Estructura', 'Techo sin filtraciones', 1 FROM postventa_template WHERE nombre='Genérico Posventa';
    INSERT INTO postventa_template_item (template_id, categoria, item, orden) SELECT id, 'Estructura', 'Muros sin grietas', 2 FROM postventa_template WHERE nombre='Genérico Posventa';
    INSERT INTO postventa_template_item (template_id, categoria, item, orden) SELECT id, 'Instalaciones', 'Enchufes funcionando', 3 FROM postventa_template WHERE nombre='Genérico Posventa';
    INSERT INTO postventa_template_item (template_id, categoria, item, orden) SELECT id, 'Plomería', 'Sin goteos visibles', 4 FROM postventa_template WHERE nombre='Genérico Posventa';

    -- 2D ejemplo extra item
    INSERT INTO postventa_template_item (template_id, categoria, item, orden) SELECT id, 'Habitaciones', 'Ventanas selladas', 5 FROM postventa_template WHERE nombre='Posventa 2D';
    INSERT INTO postventa_template_item (template_id, categoria, item, orden) SELECT id, 'Habitaciones', 'Puertas alineadas', 6 FROM postventa_template WHERE nombre='Posventa 3D';
  END IF; END$$;

COMMIT;

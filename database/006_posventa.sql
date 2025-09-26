-- 006_posventa.sql
-- Formulario Posventa (MVP)
-- Permite que un beneficiario complete un checklist posterior a la entrega de la vivienda.
-- Estados: borrador -> enviada -> revisada (la revisión la hará el técnico en fase 2).
-- Idempotente.

BEGIN;

CREATE TABLE IF NOT EXISTS vivienda_postventa_form (
  id BIGSERIAL PRIMARY KEY,
  id_vivienda BIGINT NOT NULL REFERENCES viviendas(id_vivienda) ON DELETE CASCADE,
  beneficiario_uid BIGINT NOT NULL REFERENCES usuarios(uid) ON DELETE RESTRICT,
  estado TEXT NOT NULL,
  fecha_creada TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_enviada TIMESTAMPTZ,
  fecha_revisada TIMESTAMPTZ,
  items_no_ok_count INT NOT NULL DEFAULT 0,
  observaciones_count INT NOT NULL DEFAULT 0,
  template_version INT,
  CHECK (estado IN ('borrador','enviada','revisada'))
);

CREATE TABLE IF NOT EXISTS vivienda_postventa_item (
  id BIGSERIAL PRIMARY KEY,
  form_id BIGINT NOT NULL REFERENCES vivienda_postventa_form(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  item TEXT NOT NULL,
  ok BOOLEAN NOT NULL,
  severidad TEXT,
  comentario TEXT,
  fotos_json JSONB DEFAULT '[]'::jsonb,
  crear_incidencia BOOLEAN NOT NULL DEFAULT true,
  incidencia_id BIGINT REFERENCES incidencias(id_incidencia) ON DELETE SET NULL,
  orden INT,
  CHECK (severidad IS NULL OR severidad IN ('menor','media','mayor'))
);

-- Única activa (borrador/enviada) por vivienda
CREATE UNIQUE INDEX IF NOT EXISTS uniq_postventa_form_activa
  ON vivienda_postventa_form(id_vivienda) WHERE estado IN ('borrador','enviada');

CREATE INDEX IF NOT EXISTS idx_postventa_form_estado ON vivienda_postventa_form(estado);
CREATE INDEX IF NOT EXISTS idx_postventa_item_form ON vivienda_postventa_item(form_id);
CREATE INDEX IF NOT EXISTS idx_postventa_item_ok ON vivienda_postventa_item(form_id, ok);

COMMIT;

-- Notas:
-- * observaciones_count puede interpretarse como subconjunto de items_no_ok_count (ej. severidad menor) si se desea.
-- * template_version reservado para futura tabla de templates.
-- * Generación de incidencias se hará en fase 2 (técnico revisa).

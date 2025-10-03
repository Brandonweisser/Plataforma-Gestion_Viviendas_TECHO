-- 001_beneficiario_schema.sql
-- Esquema inicial para el módulo Beneficiario (recepción de vivienda + incidencias extendidas + media)
-- Idempotente: usa IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
-- NO activa RLS todavía.
-- Ejecutar en Supabase SQL Editor o psql.

BEGIN;

/* =============================================================
   1. Extensiones / prerequisitos (si no existen)
   ============================================================= */
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- por si se requiere luego

/* =============================================================
   2. Ampliar tabla incidencias (categoría y prioridad)
   ============================================================= */
ALTER TABLE incidencias
  ADD COLUMN IF NOT EXISTS categoria text;

-- Prioridad con CHECK suave (permitir NULL = no asignada)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='incidencias' AND column_name='prioridad'
  ) THEN
    EXECUTE 'ALTER TABLE incidencias ADD COLUMN prioridad text';
  END IF;
END;$$;

-- Añadir constraint sólo si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'incidencias_prioridad_chk'
  ) THEN
    ALTER TABLE incidencias
      ADD CONSTRAINT incidencias_prioridad_chk
      CHECK (prioridad IS NULL OR prioridad IN ('baja','media','alta'));
  END IF;
END;$$;

/* =============================================================
   3. Tabla vivienda_recepcion
      Representa el formulario inicial de recepción de la vivienda
      - estado: 'borrador' (aún editable), 'enviada' (beneficiario la mandó), 'revisada' (técnico revisó)
      - observaciones_count: número de ítems con ok=false acumulados al enviar
      Regla: sólo se permite UNA recepción activa (borrador/enviada) por vivienda.
   ============================================================= */
CREATE TABLE IF NOT EXISTS vivienda_recepcion (
  id               BIGSERIAL PRIMARY KEY,
  id_vivienda      BIGINT NOT NULL REFERENCES viviendas(id_vivienda) ON DELETE CASCADE,
  beneficiario_uid BIGINT NOT NULL REFERENCES usuarios(uid) ON DELETE RESTRICT,
  tecnico_uid      BIGINT REFERENCES usuarios(uid) ON DELETE SET NULL,
  estado           TEXT   NOT NULL,
  fecha_creada     TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_enviada    TIMESTAMPTZ,
  fecha_revisada   TIMESTAMPTZ,
  observaciones_count INT NOT NULL DEFAULT 0,
  comentario_tecnico TEXT
);

-- Constraint de estado (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='vivienda_recepcion_estado_chk'
  ) THEN
    ALTER TABLE vivienda_recepcion
      ADD CONSTRAINT vivienda_recepcion_estado_chk
      CHECK (estado IN ('borrador','enviada','revisada'));
  END IF;
END;$$;

-- Unique parcial: una recepción activa (borrador/enviada) por vivienda
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'uniq_vivienda_recepcion_activa'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX uniq_vivienda_recepcion_activa ON vivienda_recepcion(id_vivienda) WHERE estado IN (''borrador'',''enviada'')';
  END IF;
END;$$;

CREATE INDEX IF NOT EXISTS idx_vivienda_recepcion_vivienda ON vivienda_recepcion(id_vivienda);
CREATE INDEX IF NOT EXISTS idx_vivienda_recepcion_estado ON vivienda_recepcion(estado);

/* =============================================================
   4. Tabla vivienda_recepcion_item
      Cada fila = un ítem del checklist
      - categoria: Agrupa (Habitación 1, Cocina, Baño, etc.)
      - item: Nombre del ítem ("Ventana", "Puerta", "Piso", etc.)
      - ok: TRUE si está correcto, FALSE si presenta problema
      - comentario: detalle extra cuando ok = FALSE (o nota general)
      - fotos_json: array JSON de rutas en storage (['media/...'])
      - orden: para mantener orden consistente en UI
   ============================================================= */
CREATE TABLE IF NOT EXISTS vivienda_recepcion_item (
  id            BIGSERIAL PRIMARY KEY,
  recepcion_id  BIGINT NOT NULL REFERENCES vivienda_recepcion(id) ON DELETE CASCADE,
  categoria     TEXT   NOT NULL,
  item          TEXT   NOT NULL,
  ok            BOOLEAN NOT NULL,
  comentario    TEXT,
  fotos_json    JSONB DEFAULT '[]'::jsonb,
  orden         INT
);
CREATE INDEX IF NOT EXISTS idx_recepcion_item_recepcion ON vivienda_recepcion_item(recepcion_id);
CREATE INDEX IF NOT EXISTS idx_recepcion_item_categoria ON vivienda_recepcion_item(categoria);

/* =============================================================
   5. Tabla media
      Archivos subidos (fotos) asociados a una incidencia O a un item de recepción
      Regla exclusión: exactamente uno de (incidencia_id, recepcion_item_id) debe estar presente
   ============================================================= */
CREATE TABLE IF NOT EXISTS media (
  id               BIGSERIAL PRIMARY KEY,
  incidencia_id    BIGINT REFERENCES incidencias(id_incidencia) ON DELETE CASCADE,
  recepcion_item_id BIGINT REFERENCES vivienda_recepcion_item(id) ON DELETE CASCADE,
  path             TEXT NOT NULL,
  mime             TEXT,
  bytes            INT,
  uploaded_by      BIGINT REFERENCES usuarios(uid) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT now(),
  CHECK ( (incidencia_id IS NOT NULL AND recepcion_item_id IS NULL)
       OR (incidencia_id IS NULL AND recepcion_item_id IS NOT NULL) )
);
CREATE INDEX IF NOT EXISTS idx_media_incidencia ON media(incidencia_id);
CREATE INDEX IF NOT EXISTS idx_media_recepcion_item ON media(recepcion_item_id);

/* =============================================================
   6. (Opcional futuro) Vista resumen de recepción
   ============================================================= */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_views WHERE viewname='vista_recepcion_resumen'
  ) THEN
    EXECUTE 'CREATE VIEW vista_recepcion_resumen AS
      SELECT r.id,
             r.id_vivienda,
             r.beneficiario_uid,
             r.estado,
             r.observaciones_count,
             COUNT(i.id) AS total_items,
             COUNT(*) FILTER (WHERE NOT i.ok) AS items_con_problema,
             r.fecha_creada,
             r.fecha_enviada,
             r.fecha_revisada
      FROM vivienda_recepcion r
      LEFT JOIN vivienda_recepcion_item i ON i.recepcion_id = r.id
      GROUP BY r.id';
  END IF;
END;$$;

/* =============================================================
   7. Notas de modelo (documentación embebida)
   ============================================================= */
COMMENT ON TABLE vivienda_recepcion IS 'Formulario de recepción inicial de la vivienda (una activa por vivienda).';
COMMENT ON COLUMN vivienda_recepcion.estado IS 'borrador | enviada | revisada';
COMMENT ON TABLE vivienda_recepcion_item IS 'Ítems checklist de la recepción de la vivienda.';
COMMENT ON COLUMN vivienda_recepcion_item.ok IS 'TRUE=correcto, FALSE=observación';
COMMENT ON TABLE media IS 'Archivos (fotos) de incidencias o de ítems de recepción en Supabase Storage (path relativo).';

COMMIT;

/* =============================================================
   Cómo se guardan los datos (resumen):
   - Una recepción (vivienda_recepcion) representa un formulario completo.
   - Cada ítem del checklist se serializa como fila en vivienda_recepcion_item con categoria + item.
   - Fotos: dos estrategias posibles:
     a) Guardar rutas en fotos_json dentro de vivienda_recepcion_item (ya soportado).
     b) Guardar cada foto como fila en media con recepcion_item_id (más flexible a futuro). Puedes usar ambas si quieres transición.
   - Incidencias mantienen ahora categoria y prioridad.
   - Unique parcial evita dos recepciones activas simultáneas para la misma vivienda.
============================================================= */

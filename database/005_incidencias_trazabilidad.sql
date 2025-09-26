-- Fase 1: Trazabilidad básica de incidencias
-- Añade columnas mínimas y tabla historial.

-- Columnas nuevas (ignorar errores si ya existen)
ALTER TABLE incidencias
  ADD COLUMN IF NOT EXISTS prioridad_origen VARCHAR(10),
  ADD COLUMN IF NOT EXISTS prioridad_final VARCHAR(10),
  ADD COLUMN IF NOT EXISTS fecha_asignada TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS fecha_en_proceso TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS fecha_resuelta TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS fecha_cerrada TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;

-- Tabla historial de eventos de incidencias
CREATE TABLE IF NOT EXISTS incidencia_historial (
  id BIGSERIAL PRIMARY KEY,
  incidencia_id BIGINT NOT NULL REFERENCES incidencias(id_incidencia) ON DELETE CASCADE,
  actor_uid BIGINT NULL,
  actor_rol VARCHAR(30) NULL,
  tipo_evento VARCHAR(40) NOT NULL,
  estado_anterior VARCHAR(30) NULL,
  estado_nuevo VARCHAR(30) NULL,
  datos_diff JSONB NULL,
  comentario TEXT NULL,
  metadata JSONB NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidencia_historial_inc_created ON incidencia_historial(incidencia_id, created_at DESC);

-- Evento inicial (opcional) se podrá backfill con:
-- INSERT INTO incidencia_historial (incidencia_id, actor_uid, actor_rol, tipo_evento, estado_nuevo, comentario)
-- SELECT id_incidencia, NULL, NULL, 'created_backfill', estado, 'Backfill inicial' FROM incidencias
-- WHERE id_incidencia NOT IN (SELECT incidencia_id FROM incidencia_historial);

-- 011_normalizacion_esquema.sql
-- Migración incremental para adaptar una base EXISTENTE al esquema objetivo definido en 000_base_schema.sql
-- Ejecutar en Supabase SQL Editor (idealmente en transacciones por bloques). Revísalo antes de correr en producción.
-- Enfoque: idempotente en lo posible (IF EXISTS / DO $$ / checks dinámicos).
-- PASOS PRINCIPALES:
--   1. Usuarios: añadir created_at si falta.
--   2. Proyecto: convertir fechas texto -> DATE.
--   3. Viviendas: convertir fecha_entrega a DATE, asegurar estados válidos, agregar created_at.
--   4. Incidencias: ampliar estados permitidos, convertir fecha_reporte a TIMESTAMPTZ.
--   5. Posventa: reemplazar estado 'revisada' por 'revisado_correcto' / 'revisado_con_problemas'; actualizar constraint.
--   6. Media: migrar esquema antiguo (incidencia_id, recepcion_item_id) a modelo unificado (entity_type, entity_id).
--   7. Índices complementarios.
--   8. (Opcional) Limpieza final.
-- Si algo falla, revertir manualmente (no incluye down script).

------------------------------------------------------------
-- 1. USUARIOS
------------------------------------------------------------
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

------------------------------------------------------------
-- 2. PROYECTO (fecha_* a DATE)
------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='proyecto' AND column_name='fecha_inicio' AND data_type <> 'date'
  ) THEN
    ALTER TABLE proyecto
      ALTER COLUMN fecha_inicio TYPE date USING NULLIF(fecha_inicio,'')::date;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='proyecto' AND column_name='fecha_entrega' AND data_type <> 'date'
  ) THEN
    ALTER TABLE proyecto
      ALTER COLUMN fecha_entrega TYPE date USING NULLIF(fecha_entrega,'')::date;
  END IF;
END$$;

------------------------------------------------------------
-- 3. VIVIENDAS (fecha_entrega, estados y created_at)
------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='viviendas' AND column_name='fecha_entrega' AND data_type <> 'date'
  ) THEN
    ALTER TABLE viviendas
      ALTER COLUMN fecha_entrega TYPE date USING NULLIF(fecha_entrega,'')::date;
  END IF;
END$$;

ALTER TABLE viviendas
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Reemplazar constraint de estado si no coincide con el set nuevo
DO $$
DECLARE c_name text; c_check text; BEGIN
  FOR c_name, c_check IN
    SELECT con.conname, pg_get_constraintdef(con.oid)
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname='viviendas' AND con.contype='c'
  LOOP
    IF c_check ILIKE '%estado%' AND c_check NOT ILIKE '%asignada%' THEN
      EXECUTE format('ALTER TABLE viviendas DROP CONSTRAINT %I', c_name);
    END IF;
  END LOOP;
END$$;

ALTER TABLE viviendas
  ADD CONSTRAINT chk_viviendas_estado CHECK (estado IN ('planificada','en_construccion','asignada','entregada')) NOT VALID;
-- Validar después para evitar lock prolongado (opcional):
-- ALTER TABLE viviendas VALIDATE CONSTRAINT chk_viviendas_estado;

------------------------------------------------------------
-- 4. INCIDENCIAS (extender estados, fecha_reporte a timestamptz)
------------------------------------------------------------
-- Cambiar tipo de fecha_reporte si hoy es TEXT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='incidencias' AND column_name='fecha_reporte' AND data_type <> 'timestamp with time zone'
  ) THEN
    ALTER TABLE incidencias
      ALTER COLUMN fecha_reporte TYPE timestamptz
      USING (
        CASE
          WHEN fecha_reporte ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN fecha_reporte::timestamptz
          ELSE to_timestamp(fecha_reporte,'YYYY-MM-DD HH24:MI:SS')
        END
      );
  END IF;
END$$;

-- Ampliar constraint de estados (añadir en_espera, descartada si faltan)
DO $$
DECLARE c_name text; c_check text; BEGIN
  FOR c_name, c_check IN
    SELECT con.conname, pg_get_constraintdef(con.oid)
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname='incidencias' AND con.contype='c'
  LOOP
    IF c_check ILIKE '%estado%' AND (
         c_check NOT ILIKE '%en_espera%' OR
         c_check NOT ILIKE '%descartada%'
       ) THEN
      EXECUTE format('ALTER TABLE incidencias DROP CONSTRAINT %I', c_name);
    END IF;
  END LOOP;
END$$;

ALTER TABLE incidencias
  ADD CONSTRAINT chk_incidencias_estado CHECK (estado IN ('abierta','en_proceso','en_espera','resuelta','cerrada','descartada')) NOT VALID;
-- ALTER TABLE incidencias VALIDATE CONSTRAINT chk_incidencias_estado;

------------------------------------------------------------
-- 5. POSVENTA (cambiar estado revisada → revisado_correcto / revisado_con_problemas)
------------------------------------------------------------
-- Primero actualizar constraint para permitir nuevos valores.
DO $$
DECLARE c_name text; c_check text; BEGIN
  FOR c_name, c_check IN
    SELECT con.conname, pg_get_constraintdef(con.oid)
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname='vivienda_postventa_form' AND con.contype='c'
  LOOP
    IF c_check ILIKE '%estado%' AND c_check NOT ILIKE '%revisado_correcto%' THEN
      EXECUTE format('ALTER TABLE vivienda_postventa_form DROP CONSTRAINT %I', c_name);
    END IF;
  END LOOP;
END$$;

ALTER TABLE vivienda_postventa_form
  ADD CONSTRAINT chk_postventa_estado CHECK (estado IN ('borrador','enviada','revisado_correcto','revisado_con_problemas')) NOT VALID;

-- Re-etiquetar formularios ya revisados
UPDATE vivienda_postventa_form f
SET estado = CASE
               WHEN EXISTS (
                 SELECT 1 FROM vivienda_postventa_item i
                 WHERE i.form_id=f.id AND i.ok = false
               ) THEN 'revisado_con_problemas'
               ELSE 'revisado_correcto'
             END,
    fecha_revisada = COALESCE(fecha_revisada, now())
WHERE estado = 'revisada';

-- Recalcular conteos (por si estaban desactualizados)
WITH counts AS (
  SELECT form_id,
         COUNT(*) FILTER (WHERE ok = false) AS no_ok,
         COUNT(*) FILTER (WHERE ok = false AND severidad = 'menor') AS obs
  FROM vivienda_postventa_item
  GROUP BY form_id
)
UPDATE vivienda_postventa_form f
SET items_no_ok_count = c.no_ok,
    observaciones_count = c.obs
FROM counts c
WHERE c.form_id = f.id;

------------------------------------------------------------
-- 6. MEDIA (migración a modelo unificado)
------------------------------------------------------------
-- Sólo si la tabla NO tiene columnas entity_type/entity_id asumimos formato legacy.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='media' AND column_name='entity_type'
  ) THEN
    RAISE NOTICE 'Migrando tabla media al modelo unificado...';
    CREATE TABLE IF NOT EXISTS media_unified (
      id          BIGSERIAL PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id   BIGINT NOT NULL,
      path        TEXT NOT NULL,
      mime        TEXT,
      bytes       INT,
      metadata    JSONB DEFAULT '{}'::jsonb,
      uploaded_by BIGINT REFERENCES usuarios(uid) ON DELETE SET NULL,
      created_at  TIMESTAMPTZ DEFAULT now()
    );
    -- Migrar incidencias
    INSERT INTO media_unified(entity_type, entity_id, path, mime, bytes, metadata, uploaded_by, created_at)
    SELECT 'incidencia', incidencia_id, path, mime, bytes, '{}'::jsonb, uploaded_by, created_at
    FROM media WHERE incidencia_id IS NOT NULL;
    -- Migrar recepción items (si existían)
    INSERT INTO media_unified(entity_type, entity_id, path, mime, bytes, metadata, uploaded_by, created_at)
    SELECT 'recepcion_item', recepcion_item_id, path, mime, bytes, '{}'::jsonb, uploaded_by, created_at
    FROM media WHERE recepcion_item_id IS NOT NULL;
    -- (Agregar aquí otros orígenes si existieran)
    ALTER TABLE media RENAME TO media_legacy;
    ALTER TABLE media_unified RENAME TO media;
    CREATE INDEX IF NOT EXISTS idx_media_entity ON media(entity_type, entity_id);
    RAISE NOTICE 'Migración de media completada.';
  END IF;
END$$;

------------------------------------------------------------
-- 7. ÍNDICES EXTRA (se crean sólo si faltan)
------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_viviendas_beneficiario ON viviendas(beneficiario_uid);
CREATE INDEX IF NOT EXISTS idx_viviendas_estado ON viviendas(estado);
CREATE INDEX IF NOT EXISTS idx_incidencias_vivienda ON incidencias(id_vivienda);
CREATE INDEX IF NOT EXISTS idx_incidencias_estado ON incidencias(estado);
CREATE INDEX IF NOT EXISTS idx_historial_incidencia_created ON incidencia_historial(incidencia_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_postventa_activa ON vivienda_postventa_form(id_vivienda) WHERE estado IN ('borrador','enviada');

------------------------------------------------------------
-- 8. VALIDACIÓN (opcional: descomentar cuando los datos ya cumplen)
------------------------------------------------------------
-- ALTER TABLE viviendas VALIDATE CONSTRAINT chk_viviendas_estado;
-- ALTER TABLE incidencias VALIDATE CONSTRAINT chk_incidencias_estado;
-- ALTER TABLE vivienda_postventa_form VALIDATE CONSTRAINT chk_postventa_estado;

------------------------------------------------------------
-- 9. RESUMEN (consultas rápidas post-migración)
------------------------------------------------------------
-- SELECT estado, COUNT(*) FROM viviendas GROUP BY 1;
-- SELECT estado, COUNT(*) FROM incidencias GROUP BY 1;
-- SELECT estado, COUNT(*) FROM vivienda_postventa_form GROUP BY 1;
-- SELECT entity_type, COUNT(*) FROM media GROUP BY 1;

-- FIN

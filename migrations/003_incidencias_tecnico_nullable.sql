-- 003_incidencias_tecnico_nullable.sql
-- Permite que las incidencias se creen sin técnico asignado inicialmente.
-- Quita el NOT NULL de id_usuario_tecnico sólo si aún es NOT NULL.

BEGIN;

DO $$
DECLARE
  col_is_notnull boolean;
BEGIN
  SELECT (is_nullable = 'NO') INTO col_is_notnull
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'incidencias'
    AND column_name = 'id_usuario_tecnico';

  IF col_is_notnull THEN
    EXECUTE 'ALTER TABLE public.incidencias ALTER COLUMN id_usuario_tecnico DROP NOT NULL';
  END IF;
END$$;

COMMIT;

-- Idempotente: si ya es nullable no hace nada.
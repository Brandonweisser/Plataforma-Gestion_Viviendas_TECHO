-- 026_posventa_revisar.sql
-- Añade columna de fecha de revisión al formulario posventa (si no existe)
ALTER TABLE vivienda_postventa_form
  ADD COLUMN IF NOT EXISTS fecha_revisada TIMESTAMPTZ;
-- 027_posventa_comentario_tecnico.sql
-- Añade columna comentario_tecnico al formulario posventa
ALTER TABLE vivienda_postventa_form
  ADD COLUMN IF NOT EXISTS comentario_tecnico TEXT;
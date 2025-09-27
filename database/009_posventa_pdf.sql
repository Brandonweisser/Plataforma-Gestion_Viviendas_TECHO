-- Migración para agregar campos de PDF a formularios de posventa
-- Ejecutar en el SQL Editor de Supabase

BEGIN;

-- Agregar columnas para PDFs
ALTER TABLE vivienda_postventa_form 
  ADD COLUMN IF NOT EXISTS pdf_path TEXT,
  ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMPTZ;

-- Crear bucket de storage si no existe (ejecutar manualmente en Supabase Dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('formularios-pdf', 'formularios-pdf', true)
-- ON CONFLICT (id) DO NOTHING;

-- Comentarios
COMMENT ON COLUMN vivienda_postventa_form.pdf_path IS 'Ruta del PDF generado en Supabase Storage';
COMMENT ON COLUMN vivienda_postventa_form.pdf_generated_at IS 'Fecha y hora de generación del PDF';

COMMIT;

-- Nota: También crear el bucket 'formularios-pdf' en Supabase Dashboard > Storage
-- Y configurarlo como público para permitir descargas
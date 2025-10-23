-- Migration: Add template_id to vivienda_postventa_form
ALTER TABLE vivienda_postventa_form
  ADD COLUMN IF NOT EXISTS template_id BIGINT REFERENCES postventa_template(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_postventa_form_template_id ON vivienda_postventa_form(template_id);

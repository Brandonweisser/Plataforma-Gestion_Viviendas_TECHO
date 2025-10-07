-- Agrega columnas de geocodificación y coordenadas a proyecto
ALTER TABLE IF EXISTS proyecto
ADD COLUMN IF NOT EXISTS latitud DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitud DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS ubicacion_normalizada TEXT,
ADD COLUMN IF NOT EXISTS ubicacion_referencia TEXT,
ADD COLUMN IF NOT EXISTS geocode_provider TEXT,
ADD COLUMN IF NOT EXISTS geocode_score NUMERIC,
ADD COLUMN IF NOT EXISTS geocode_at TIMESTAMPTZ;

-- Índice útil para consultas simples por coordenadas (sin PostGIS)
CREATE INDEX IF NOT EXISTS idx_proyecto_lat_long ON proyecto(latitud, longitud);

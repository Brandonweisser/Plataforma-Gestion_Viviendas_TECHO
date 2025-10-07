    -- Agrega columnas de geocodificación y coordenadas a viviendas
    ALTER TABLE IF EXISTS viviendas
    ADD COLUMN IF NOT EXISTS latitud DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitud DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS direccion_normalizada TEXT,
    ADD COLUMN IF NOT EXISTS geocode_provider TEXT,
    ADD COLUMN IF NOT EXISTS geocode_score NUMERIC,
    ADD COLUMN IF NOT EXISTS geocode_at TIMESTAMPTZ;

    -- Índice simple para consultas geográficas básicas (no PostGIS)
    CREATE INDEX IF NOT EXISTS idx_viviendas_lat_long ON viviendas(latitud, longitud);

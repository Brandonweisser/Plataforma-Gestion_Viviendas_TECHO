-- Tabla relacional proyecto_tecnico para asignar múltiples técnicos a un proyecto
-- Ejecutar después de que existan las tablas proyecto y usuarios
CREATE TABLE IF NOT EXISTS proyecto_tecnico (
  id_proyecto INTEGER NOT NULL REFERENCES proyecto(id_proyecto) ON DELETE CASCADE,
  tecnico_uid INTEGER NOT NULL REFERENCES usuarios(uid) ON DELETE CASCADE,
  asignado_en TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id_proyecto, tecnico_uid)
);

-- Índice para facilitar búsquedas por técnico
CREATE INDEX IF NOT EXISTS idx_proyecto_tecnico_tecnico ON proyecto_tecnico(tecnico_uid);

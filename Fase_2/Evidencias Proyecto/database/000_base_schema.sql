-- 000_base_schema.sql
-- Esquema maestro normalizado (FUENTE DE VERDAD) para la plataforma.
-- Incluir sólo tablas y constraints realmente usadas por el backend actual.
-- NOTA: Ejecutar este archivo en un entorno vacío o derivar migraciones incrementales
--       para adaptarlo a una base ya existente. Contiene CHECKs y comentarios.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. USUARIOS Y SEGURIDAD
-- =============================================
CREATE TABLE IF NOT EXISTS public.usuarios (
  uid              BIGINT PRIMARY KEY,
  nombre           TEXT    NOT NULL,
  email            TEXT    NOT NULL UNIQUE,
  rol              TEXT    NOT NULL CHECK (rol IN ('administrador','tecnico','beneficiario')),
  rut              TEXT    UNIQUE, -- RUT limpio (sin puntos ni guión, en minúsculas) opcional pero único si existe
  direccion        TEXT,
  password_hash    TEXT    NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE usuarios IS 'Usuarios del sistema con roles principales.';

-- =============================================
-- 2. PROYECTOS Y VIVIENDAS
-- =============================================
CREATE TABLE IF NOT EXISTS public.proyecto (
  id_proyecto      BIGINT PRIMARY KEY,
  nombre           TEXT NOT NULL,
  ubicacion        TEXT NOT NULL,
  fecha_inicio     DATE,
  fecha_entrega    DATE,
  viviendas_count  INT  NOT NULL DEFAULT 0 CHECK (viviendas_count >= 0),
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Estados de vivienda normalizados:
-- planificada -> en_construccion -> asignada -> entregada
-- (Se pueden agregar otros: cancelada, etc.)
CREATE TABLE IF NOT EXISTS public.viviendas (
  id_vivienda      BIGINT PRIMARY KEY,
  id_proyecto      BIGINT NOT NULL REFERENCES proyecto(id_proyecto) ON UPDATE CASCADE ON DELETE RESTRICT,
  direccion        TEXT   NOT NULL,
  estado           TEXT   NOT NULL CHECK (estado IN ('planificada','en_construccion','asignada','entregada')),
  fecha_entrega    DATE,
  beneficiario_uid BIGINT REFERENCES usuarios(uid) ON UPDATE CASCADE ON DELETE SET NULL,
  tipo_vivienda    TEXT, -- Ej: '1D','2D','3D'
  created_at       TIMESTAMPTZ DEFAULT now()
);
COMMENT ON COLUMN viviendas.estado IS 'Workflow: planificada -> en_construccion -> asignada -> entregada';

CREATE INDEX IF NOT EXISTS idx_viviendas_beneficiario ON viviendas(beneficiario_uid);
CREATE INDEX IF NOT EXISTS idx_viviendas_estado ON viviendas(estado);

-- =============================================
-- 3. FORMULARIO RECEPCION (opcional histórico inicial)
-- Se mantiene porque el backend tiene endpoints de recepción.
-- Si se decide deprecar, mover a un archivo legacy.
CREATE TABLE IF NOT EXISTS public.vivienda_recepcion (
  id               BIGSERIAL PRIMARY KEY,
  id_vivienda      BIGINT NOT NULL REFERENCES viviendas(id_vivienda) ON DELETE CASCADE,
  beneficiario_uid BIGINT NOT NULL REFERENCES usuarios(uid) ON DELETE RESTRICT,
  tecnico_uid      BIGINT REFERENCES usuarios(uid) ON DELETE SET NULL,
  estado           TEXT NOT NULL CHECK (estado IN ('borrador','enviada','revisada')),
  fecha_creada     TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_enviada    TIMESTAMPTZ,
  fecha_revisada   TIMESTAMPTZ,
  observaciones_count INT NOT NULL DEFAULT 0,
  comentario_tecnico  TEXT
);

CREATE TABLE IF NOT EXISTS public.vivienda_recepcion_item (
  id            BIGSERIAL PRIMARY KEY,
  recepcion_id  BIGINT NOT NULL REFERENCES vivienda_recepcion(id) ON DELETE CASCADE,
  categoria     TEXT NOT NULL,
  item          TEXT NOT NULL,
  ok            BOOLEAN NOT NULL,
  comentario    TEXT,
  fotos_json    JSONB DEFAULT '[]'::jsonb,
  orden         INT
);
CREATE INDEX IF NOT EXISTS idx_recepcion_item_recepcion ON vivienda_recepcion_item(recepcion_id);

-- =============================================
-- 4. INCIDENCIAS Y TRAZABILIDAD
-- =============================================
CREATE TABLE IF NOT EXISTS public.incidencias (
  id_incidencia        BIGSERIAL PRIMARY KEY,
  id_vivienda          BIGINT NOT NULL REFERENCES viviendas(id_vivienda) ON DELETE CASCADE,
  id_usuario_reporta   BIGINT NOT NULL REFERENCES usuarios(uid) ON DELETE RESTRICT,
  id_usuario_tecnico   BIGINT REFERENCES usuarios(uid) ON DELETE SET NULL,
  descripcion          TEXT NOT NULL,
  estado               TEXT NOT NULL CHECK (estado IN ('abierta','en_proceso','en_espera','resuelta','cerrada','descartada')),
  fecha_reporte        TIMESTAMPTZ NOT NULL DEFAULT now(),
  categoria            TEXT,
  prioridad            TEXT CHECK (prioridad IN ('baja','media','alta')),
  prioridad_origen     TEXT,
  prioridad_final      TEXT,
  fecha_asignada       TIMESTAMPTZ,
  fecha_en_proceso     TIMESTAMPTZ,
  fecha_resuelta       TIMESTAMPTZ,
  fecha_cerrada        TIMESTAMPTZ,
  version              INT NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_incidencias_vivienda ON incidencias(id_vivienda);
CREATE INDEX IF NOT EXISTS idx_incidencias_estado ON incidencias(estado);

CREATE TABLE IF NOT EXISTS public.incidencia_historial (
  id             BIGSERIAL PRIMARY KEY,
  incidencia_id  BIGINT NOT NULL REFERENCES incidencias(id_incidencia) ON DELETE CASCADE,
  actor_uid      BIGINT REFERENCES usuarios(uid) ON DELETE SET NULL,
  actor_rol      TEXT,
  tipo_evento    TEXT NOT NULL,
  estado_anterior TEXT,
  estado_nuevo    TEXT,
  datos_diff      JSONB,
  comentario      TEXT,
  metadata        JSONB,
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_historial_incidencia_created ON incidencia_historial(incidencia_id, created_at DESC);

-- =============================================
-- 5. MEDIA (Modelo unificado genérico)
-- =============================================
-- Se normaliza a un enfoque genérico entity_type/entity_id + path.
CREATE TABLE IF NOT EXISTS public.media (
  id           BIGSERIAL PRIMARY KEY,
  entity_type  TEXT NOT NULL,        -- Ej: 'incidencia', 'posventa_item', 'recepcion_item'
  entity_id    BIGINT NOT NULL,      -- ID de la entidad
  path         TEXT NOT NULL,        -- Ruta en Storage
  mime         TEXT,
  bytes        INT,
  metadata     JSONB DEFAULT '{}'::jsonb,
  uploaded_by  BIGINT REFERENCES usuarios(uid) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_media_entity ON media(entity_type, entity_id);

-- =============================================
-- 6. POSVENTA (Checklist posterior a entrega)
-- Nuevos estados finales: revisado_correcto / revisado_con_problemas (sustituyen 'revisada').
-- Activos sólo (borrador, enviada). Terminales: revisado_correcto, revisado_con_problemas.
CREATE TABLE IF NOT EXISTS public.vivienda_postventa_form (
  id                BIGSERIAL PRIMARY KEY,
  id_vivienda       BIGINT NOT NULL REFERENCES viviendas(id_vivienda) ON DELETE CASCADE,
  beneficiario_uid  BIGINT NOT NULL REFERENCES usuarios(uid) ON DELETE RESTRICT,
  estado            TEXT NOT NULL CHECK (estado IN ('borrador','enviada','revisado_correcto','revisado_con_problemas')),
  fecha_creada      TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_enviada     TIMESTAMPTZ,
  fecha_revisada    TIMESTAMPTZ,
  items_no_ok_count INT NOT NULL DEFAULT 0,
  observaciones_count INT NOT NULL DEFAULT 0,
  template_version  INT,
  pdf_path          TEXT,
  pdf_generated_at  TIMESTAMPTZ,
  comentario_tecnico TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_postventa_activa ON vivienda_postventa_form(id_vivienda) WHERE estado IN ('borrador','enviada');

CREATE TABLE IF NOT EXISTS public.vivienda_postventa_item (
  id               BIGSERIAL PRIMARY KEY,
  form_id          BIGINT NOT NULL REFERENCES vivienda_postventa_form(id) ON DELETE CASCADE,
  categoria        TEXT NOT NULL,
  item             TEXT NOT NULL,
  ok               BOOLEAN NOT NULL,
  severidad        TEXT CHECK (severidad IS NULL OR severidad IN ('menor','media','mayor')),
  comentario       TEXT,
  fotos_json       JSONB DEFAULT '[]'::jsonb,
  crear_incidencia BOOLEAN NOT NULL DEFAULT true,
  incidencia_id    BIGINT REFERENCES incidencias(id_incidencia) ON DELETE SET NULL,
  orden            INT
);
CREATE INDEX IF NOT EXISTS idx_posventa_item_form ON vivienda_postventa_item(form_id);

-- Templates
CREATE TABLE IF NOT EXISTS public.postventa_template (
  id           BIGSERIAL PRIMARY KEY,
  nombre       TEXT NOT NULL,
  tipo_vivienda TEXT, -- NULL = genérico
  version      INT NOT NULL DEFAULT 1,
  activo       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.postventa_template_item (
  id                BIGSERIAL PRIMARY KEY,
  template_id       BIGINT NOT NULL REFERENCES postventa_template(id) ON DELETE CASCADE,
  categoria         TEXT NOT NULL,
  item              TEXT NOT NULL,
  orden             INT,
  severidad_sugerida TEXT CHECK (severidad_sugerida IS NULL OR severidad_sugerida IN ('menor','media','mayor'))
);
CREATE INDEX IF NOT EXISTS idx_postventa_template_tipo ON postventa_template(tipo_vivienda, activo);
CREATE INDEX IF NOT EXISTS idx_postventa_template_item_template ON postventa_template_item(template_id);

-- =============================================
-- 7. RECUPERACIÓN DE CONTRASEÑA
-- =============================================
CREATE TABLE IF NOT EXISTS public.password_recovery_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  code        TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_recovery_email ON password_recovery_codes(email);
CREATE INDEX IF NOT EXISTS idx_recovery_code ON password_recovery_codes(code);
CREATE INDEX IF NOT EXISTS idx_recovery_expires ON password_recovery_codes(expires_at);

-- =============================================
-- 8. VISTA (placeholder) RESUMEN RECEPCION
-- (Defínase según necesidad: se deja como comentario)
-- CREATE OR REPLACE VIEW vista_recepcion_resumen AS
--   SELECT r.id, r.id_vivienda, r.estado, r.observaciones_count, r.fecha_creada
--   FROM vivienda_recepcion r;

-- =============================================
-- 9. COMENTARIOS / NOTAS
-- * Para migrar desde el esquema antiguo:
--   - Renombrar columnas incompatibles.
--   - Unificar tabla media (migrar datos antiguos a entity_type/entity_id).
--   - Actualizar estados de posventa: reemplazar 'revisada' por 'revisado_correcto' / 'revisado_con_problemas'.
-- * Índices adicionales pueden agregarse según patrones de consulta observados.

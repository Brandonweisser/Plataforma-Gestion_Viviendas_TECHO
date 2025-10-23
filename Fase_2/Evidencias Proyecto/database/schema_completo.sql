-- ========================================
-- ESQUEMA COMPLETO - PLATAFORMA TECHO
-- Sistema de Gestión de Viviendas Sociales
-- ========================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- TABLA DE USUARIOS
-- ========================================
CREATE TABLE IF NOT EXISTS usuarios (
    uid BIGINT PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    rol TEXT NOT NULL CHECK (rol IN ('administrador','tecnico','beneficiario')),
    rut TEXT UNIQUE,
    direccion TEXT,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================
-- PROYECTOS
-- ========================================
CREATE TABLE IF NOT EXISTS proyecto (
    id_proyecto BIGINT PRIMARY KEY,
    nombre TEXT NOT NULL,
    ubicacion TEXT NOT NULL,
    fecha_inicio DATE,
    fecha_entrega DATE,
    viviendas_count INT NOT NULL DEFAULT 0 CHECK (viviendas_count >= 0),
    -- Geocodificación y coordenadas
    latitud DOUBLE PRECISION,
    longitud DOUBLE PRECISION,
    ubicacion_normalizada TEXT,
    ubicacion_referencia TEXT,
    geocode_provider TEXT,
    geocode_score NUMERIC,
    geocode_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- ASIGNACIÓN DE TÉCNICOS A PROYECTOS
-- ========================================
-- Relación N:M entre proyectos y usuarios con rol técnico
CREATE TABLE IF NOT EXISTS proyecto_tecnico (
    id_proyecto BIGINT NOT NULL REFERENCES proyecto(id_proyecto) ON UPDATE CASCADE ON DELETE CASCADE,
    tecnico_uid BIGINT NOT NULL REFERENCES usuarios(uid) ON UPDATE CASCADE ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (id_proyecto, tecnico_uid)
);

-- ========================================
-- VIVIENDAS
-- ========================================
CREATE TABLE IF NOT EXISTS viviendas (
    id_vivienda BIGINT PRIMARY KEY,
    id_proyecto BIGINT NOT NULL REFERENCES proyecto(id_proyecto) ON UPDATE CASCADE ON DELETE RESTRICT,
    direccion TEXT NOT NULL,
    estado TEXT NOT NULL CHECK (
        estado IN (
            'planificada',
            'en_construccion',
            'construida',
            'lista_para_entregar',
            'asignada',
            'entregada_inicial',
            'entregada_definitiva',
            'entregada' -- legacy compat
        )
    ),
    fecha_entrega DATE,
    beneficiario_uid BIGINT REFERENCES usuarios(uid) ON UPDATE CASCADE ON DELETE SET NULL,
    tipo_vivienda TEXT,
    -- Geocodificación y coordenadas
    latitud DOUBLE PRECISION,
    longitud DOUBLE PRECISION,
    direccion_normalizada TEXT,
    geocode_provider TEXT,
    geocode_score NUMERIC,
    geocode_at TIMESTAMPTZ,
    -- Campos administrativos
    metros_cuadrados INT,
    numero_habitaciones INT,
    numero_banos INT,
    observaciones TEXT,
    -- Trazabilidad de recepción conforme (previa a entrega)
    recepcion_conforme BOOLEAN NOT NULL DEFAULT false,
    fecha_recepcion_conforme TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- INCIDENCIAS
-- ========================================
CREATE TABLE IF NOT EXISTS incidencias (
    id_incidencia BIGSERIAL PRIMARY KEY,
    id_vivienda BIGINT NOT NULL REFERENCES viviendas(id_vivienda) ON DELETE CASCADE,
    id_usuario_reporta BIGINT NOT NULL REFERENCES usuarios(uid) ON DELETE RESTRICT,
    id_usuario_tecnico BIGINT REFERENCES usuarios(uid) ON DELETE SET NULL,
    descripcion TEXT NOT NULL,
    estado TEXT NOT NULL CHECK (estado IN ('abierta','en_proceso','en_espera','resuelta','cerrada','descartada')),
    fecha_reporte TIMESTAMPTZ NOT NULL DEFAULT now(),
    categoria TEXT,
    prioridad TEXT CHECK (prioridad IN ('baja','media','alta')),
    prioridad_origen TEXT,
    prioridad_final TEXT,
    fecha_asignada TIMESTAMPTZ,
    fecha_en_proceso TIMESTAMPTZ,
    fecha_resuelta TIMESTAMPTZ,
    fecha_cerrada TIMESTAMPTZ,
    -- Campos de trazabilidad posventa
    fuente TEXT CHECK (fuente IN ('beneficiario','posventa')) DEFAULT 'beneficiario',
    fecha_limite_atencion TIMESTAMPTZ,
    fecha_limite_cierre TIMESTAMPTZ,
    conforme_beneficiario BOOLEAN,
    fecha_conformidad_beneficiario TIMESTAMPTZ,
    -- Garantías DS49
    garantia_tipo TEXT CHECK (garantia_tipo IN ('terminaciones','instalaciones','estructura')),
    garantia_vence_el DATE,
    garantia_vigente BOOLEAN,
    garantia_fuente TEXT CHECK (garantia_fuente IN ('beneficiario','auto','posventa')),
    version INT NOT NULL DEFAULT 1
);

-- ========================================
-- HISTORIAL DE INCIDENCIAS
-- ========================================
CREATE TABLE IF NOT EXISTS incidencia_historial (
    id BIGSERIAL PRIMARY KEY,
    incidencia_id BIGINT NOT NULL REFERENCES incidencias(id_incidencia) ON DELETE CASCADE,
    actor_uid BIGINT REFERENCES usuarios(uid) ON DELETE SET NULL,
    actor_rol TEXT,
    tipo_evento TEXT NOT NULL,
    estado_anterior TEXT,
    estado_nuevo TEXT,
    datos_diff JSONB,
    comentario TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- RECEPCIONES DE VIVIENDA
-- ========================================
CREATE TABLE IF NOT EXISTS vivienda_recepcion (
    id BIGSERIAL PRIMARY KEY,
    id_vivienda BIGINT NOT NULL REFERENCES viviendas(id_vivienda) ON DELETE CASCADE,
    beneficiario_uid BIGINT NOT NULL REFERENCES usuarios(uid) ON DELETE RESTRICT,
    tecnico_uid BIGINT REFERENCES usuarios(uid) ON DELETE SET NULL,
    estado TEXT NOT NULL CHECK (estado IN ('borrador','enviada','revisada')),
    fecha_creada TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_enviada TIMESTAMPTZ,
    fecha_revisada TIMESTAMPTZ,
    observaciones_count INT NOT NULL DEFAULT 0,
    comentario_tecnico TEXT
);

CREATE TABLE IF NOT EXISTS vivienda_recepcion_item (
    id BIGSERIAL PRIMARY KEY,
    recepcion_id BIGINT NOT NULL REFERENCES vivienda_recepcion(id) ON DELETE CASCADE,
    categoria TEXT NOT NULL,
    item TEXT NOT NULL,
    ok BOOLEAN NOT NULL,
    comentario TEXT,
    fotos_json JSONB DEFAULT '[]'::jsonb,
    orden INT
);

-- ========================================
-- FORMULARIOS DE POSTVENTA
-- ========================================
CREATE TABLE IF NOT EXISTS vivienda_postventa_form (
    id BIGSERIAL PRIMARY KEY,
    id_vivienda BIGINT NOT NULL REFERENCES viviendas(id_vivienda) ON DELETE CASCADE,
    beneficiario_uid BIGINT NOT NULL REFERENCES usuarios(uid) ON DELETE RESTRICT,
    template_id BIGINT REFERENCES postventa_template(id) ON DELETE SET NULL,
    estado TEXT NOT NULL CHECK (estado IN ('borrador','enviada','revisado_correcto','revisado_con_problemas')),
    fecha_creada TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_enviada TIMESTAMPTZ,
    fecha_revisada TIMESTAMPTZ,
    items_no_ok_count INT NOT NULL DEFAULT 0,
    observaciones_count INT NOT NULL DEFAULT 0,
    template_version INT,
    pdf_path TEXT,
    pdf_generated_at TIMESTAMPTZ,
    comentario_tecnico TEXT
);

CREATE TABLE IF NOT EXISTS vivienda_postventa_item (
    id BIGSERIAL PRIMARY KEY,
    form_id BIGINT NOT NULL REFERENCES vivienda_postventa_form(id) ON DELETE CASCADE,
    categoria TEXT NOT NULL,
    item TEXT NOT NULL,
    ok BOOLEAN NOT NULL,
    severidad TEXT CHECK (severidad IS NULL OR severidad IN ('menor','media','mayor')),
    comentario TEXT,
    fotos_json JSONB DEFAULT '[]'::jsonb,
    crear_incidencia BOOLEAN NOT NULL DEFAULT true,
    incidencia_id BIGINT REFERENCES incidencias(id_incidencia) ON DELETE SET NULL,
    orden INT
);

-- ========================================
-- TEMPLATES DE POSTVENTA
-- ========================================
CREATE TABLE IF NOT EXISTS postventa_template (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    tipo_vivienda TEXT,
    version INT NOT NULL DEFAULT 1,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habitaciones/áreas asociadas a un template de postventa
CREATE TABLE IF NOT EXISTS postventa_template_room (
    id BIGSERIAL PRIMARY KEY,
    template_id BIGINT NOT NULL REFERENCES postventa_template(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    orden INT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS postventa_template_item (
    id BIGSERIAL PRIMARY KEY,
    template_id BIGINT NOT NULL REFERENCES postventa_template(id) ON DELETE CASCADE,
    categoria TEXT NOT NULL,
    item TEXT NOT NULL,
    orden INT,
    severidad_sugerida TEXT CHECK (severidad_sugerida IS NULL OR severidad_sugerida IN ('menor','media','mayor')),
    room_id BIGINT REFERENCES postventa_template_room(id) ON DELETE SET NULL
);

-- ========================================
-- ARCHIVOS MULTIMEDIA
-- ========================================
CREATE TABLE IF NOT EXISTS media (
    id BIGSERIAL PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id BIGINT NOT NULL,
    path TEXT NOT NULL,
    mime TEXT,
    bytes INT,
    metadata JSONB DEFAULT '{}'::jsonb,
    uploaded_by BIGINT REFERENCES usuarios(uid) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- RECUPERACIÓN DE CONTRASEÑAS
-- ========================================
CREATE TABLE IF NOT EXISTS password_recovery_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================
-- INVITACIONES DE USUARIOS (ALTA POR EMAIL)
-- ========================================
CREATE TABLE IF NOT EXISTS user_invitations (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    nombre TEXT,
    rol TEXT NOT NULL CHECK (rol IN ('administrador','tecnico','beneficiario')),
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_by BIGINT REFERENCES usuarios(uid) ON UPDATE CASCADE ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ========================================

-- Usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

-- Viviendas
CREATE INDEX IF NOT EXISTS idx_viviendas_proyecto ON viviendas(id_proyecto);
CREATE INDEX IF NOT EXISTS idx_viviendas_beneficiario ON viviendas(beneficiario_uid);
CREATE INDEX IF NOT EXISTS idx_viviendas_estado ON viviendas(estado);
CREATE INDEX IF NOT EXISTS idx_viviendas_lat_long ON viviendas(latitud, longitud);
CREATE INDEX IF NOT EXISTS idx_viviendas_recepcion_conforme ON viviendas(recepcion_conforme);

-- Incidencias
CREATE INDEX IF NOT EXISTS idx_incidencias_vivienda ON incidencias(id_vivienda);
CREATE INDEX IF NOT EXISTS idx_incidencias_estado ON incidencias(estado);
CREATE INDEX IF NOT EXISTS idx_incidencias_tecnico ON incidencias(id_usuario_tecnico);
CREATE INDEX IF NOT EXISTS idx_incidencias_reporta ON incidencias(id_usuario_reporta);
CREATE INDEX IF NOT EXISTS idx_incidencias_fuente ON incidencias(fuente);
CREATE INDEX IF NOT EXISTS idx_incidencias_limites ON incidencias(fecha_limite_atencion, fecha_limite_cierre);
CREATE INDEX IF NOT EXISTS idx_incidencias_garantia ON incidencias(garantia_tipo, garantia_vigente);

-- Historial
CREATE INDEX IF NOT EXISTS idx_historial_incidencia ON incidencia_historial(incidencia_id);
CREATE INDEX IF NOT EXISTS idx_historial_fecha ON incidencia_historial(created_at DESC);

-- Recepciones
CREATE INDEX IF NOT EXISTS idx_recepcion_vivienda ON vivienda_recepcion(id_vivienda);
CREATE INDEX IF NOT EXISTS idx_recepcion_beneficiario ON vivienda_recepcion(beneficiario_uid);
CREATE INDEX IF NOT EXISTS idx_recepcion_item_recepcion ON vivienda_recepcion_item(recepcion_id);

-- Postventa
CREATE INDEX IF NOT EXISTS idx_postventa_vivienda ON vivienda_postventa_form(id_vivienda);
CREATE INDEX IF NOT EXISTS idx_postventa_beneficiario ON vivienda_postventa_form(beneficiario_uid);
CREATE INDEX IF NOT EXISTS idx_postventa_form_template_id ON vivienda_postventa_form(template_id);
CREATE INDEX IF NOT EXISTS idx_postventa_item_form ON vivienda_postventa_item(form_id);
CREATE INDEX IF NOT EXISTS idx_postventa_template_tipo ON postventa_template(tipo_vivienda, activo);
CREATE INDEX IF NOT EXISTS idx_postventa_template_item_template ON postventa_template_item(template_id);
CREATE INDEX IF NOT EXISTS idx_postventa_room_template ON postventa_template_room(template_id);
CREATE INDEX IF NOT EXISTS idx_postventa_item_room ON postventa_template_item(room_id);

-- Media
CREATE INDEX IF NOT EXISTS idx_media_entity ON media(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media(uploaded_by);

-- Recuperación contraseñas
-- Proyecto: índices de coordenadas
CREATE INDEX IF NOT EXISTS idx_proyecto_lat_long ON proyecto(latitud, longitud);
CREATE INDEX IF NOT EXISTS idx_recovery_email ON password_recovery_codes(email);
CREATE INDEX IF NOT EXISTS idx_recovery_code ON password_recovery_codes(code);
CREATE INDEX IF NOT EXISTS idx_recovery_expires ON password_recovery_codes(expires_at);

-- Invitaciones
CREATE INDEX IF NOT EXISTS idx_invite_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invite_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invite_expires ON user_invitations(expires_at);

-- ========================================
-- RESTRICCIONES ESPECIALES
-- ========================================

-- Solo un formulario de postventa activo por vivienda
CREATE UNIQUE INDEX IF NOT EXISTS uniq_postventa_activa 
ON vivienda_postventa_form(id_vivienda) 
WHERE estado IN ('borrador','enviada');

-- ========================================
-- DATOS INICIALES BÁSICOS
-- ========================================

-- Usuario administrador por defecto
INSERT INTO usuarios (uid, nombre, email, rol, password_hash) 
VALUES (1, 'Administrador', 'admin@techo.org', 'administrador', '$2b$10$example_hash')
ON CONFLICT (uid) DO NOTHING;

-- Template básico de postventa
INSERT INTO postventa_template (id, nombre, tipo_vivienda, version, activo)
VALUES (1, 'Template General', NULL, 1, true)
ON CONFLICT (id) DO NOTHING;

-- Items básicos del template
INSERT INTO postventa_template_item (template_id, categoria, item, orden, severidad_sugerida)
VALUES 
    (1, 'Estructura', 'Estado general de paredes', 1, 'mayor'),
    (1, 'Estructura', 'Estado del techo', 2, 'mayor'),
    (1, 'Estructura', 'Estado del piso', 3, 'media'),
    (1, 'Instalaciones', 'Funcionamiento eléctrico', 4, 'mayor'),
    (1, 'Instalaciones', 'Sistema de agua', 5, 'mayor'),
    (1, 'Instalaciones', 'Desagües', 6, 'media'),
    (1, 'Acabados', 'Pintura', 7, 'menor'),
    (1, 'Acabados', 'Puertas y ventanas', 8, 'media'),
    (1, 'Limpieza', 'Estado general de limpieza', 9, 'menor')
ON CONFLICT (id) DO NOTHING;
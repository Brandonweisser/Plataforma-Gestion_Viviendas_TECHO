-- ========================================
-- MIGRACIÓN: Tabla de Invitaciones + Rol tecnico_campo
-- Fecha: 2025-11-04
-- ========================================

-- 1. Crear tabla de invitaciones si no existe
CREATE TABLE IF NOT EXISTS user_invitations (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    nombre TEXT,
    rol TEXT NOT NULL CHECK (rol IN ('administrador','tecnico','tecnico_campo','beneficiario')),
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_by BIGINT REFERENCES usuarios(uid) ON UPDATE CASCADE ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_invite_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invite_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invite_expires ON user_invitations(expires_at);

-- 2. Actualizar constraint de rol en tabla usuarios para incluir tecnico_campo
-- Primero eliminar el constraint existente
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;

-- Agregar nuevo constraint con tecnico_campo
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check 
    CHECK (rol IN ('administrador','tecnico','tecnico_campo','beneficiario'));

-- 3. Comentarios para documentación
COMMENT ON TABLE user_invitations IS 'Tabla de invitaciones de usuarios pendientes de aceptar';
COMMENT ON COLUMN user_invitations.token IS 'Token único de 6 dígitos para aceptar la invitación';
COMMENT ON COLUMN user_invitations.expires_at IS 'Fecha de expiración de la invitación (48 horas por defecto)';
COMMENT ON COLUMN user_invitations.accepted_at IS 'Fecha en que se aceptó la invitación (NULL si pendiente)';

-- 4. Verificación
DO $$
BEGIN
    -- Verificar que la tabla existe
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_invitations') THEN
        RAISE NOTICE '✅ Tabla user_invitations creada correctamente';
    ELSE
        RAISE EXCEPTION '❌ Error: Tabla user_invitations no se creó';
    END IF;
    
    -- Verificar que el constraint se actualizó
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'usuarios_rol_check' 
        AND consrc LIKE '%tecnico_campo%'
    ) THEN
        RAISE NOTICE '✅ Constraint de rol actualizado con tecnico_campo';
    END IF;
END $$;

-- Mostrar resumen
SELECT 
    'user_invitations' as tabla,
    COUNT(*) as registros_actuales
FROM user_invitations
UNION ALL
SELECT 
    'usuarios' as tabla,
    COUNT(*) as registros_actuales
FROM usuarios;

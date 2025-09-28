-- Migración para sistema de recuperación de contraseña
-- Ejecutar en el SQL Editor de Supabase

-- Tabla para almacenar códigos de recuperación
CREATE TABLE IF NOT EXISTS public.password_recovery_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  expires_at timestamptz not null,
  used boolean default false,
  created_at timestamptz not null default now()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_recovery_codes_email ON public.password_recovery_codes (email);
CREATE INDEX IF NOT EXISTS idx_recovery_codes_code ON public.password_recovery_codes (code);
CREATE INDEX IF NOT EXISTS idx_recovery_codes_expires ON public.password_recovery_codes (expires_at);

-- Función para limpiar códigos expirados (opcional, se puede ejecutar periodicamente)
CREATE OR REPLACE FUNCTION clean_expired_recovery_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM password_recovery_codes 
  WHERE expires_at < NOW() OR used = true;
END;
$$ LANGUAGE plpgsql;

-- Agregar campo RUT único si no existe (por si acaso)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='usuarios' AND column_name='rut') THEN
    ALTER TABLE public.usuarios ADD COLUMN rut text;
  END IF;
END $$;

-- Agregar campo dirección si no existe (por si acaso)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='usuarios' AND column_name='direccion') THEN
    ALTER TABLE public.usuarios ADD COLUMN direccion text;
  END IF;
END $$;

-- Hacer RUT único para beneficiarios
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_rut_unique 
ON public.usuarios (rut) 
WHERE rut IS NOT NULL AND rut != '';

COMMENT ON TABLE password_recovery_codes IS 'Tabla para almacenar códigos temporales de recuperación de contraseña';
COMMENT ON COLUMN password_recovery_codes.code IS 'Código de 6 dígitos enviado por email';
COMMENT ON COLUMN password_recovery_codes.expires_at IS 'Timestamp de expiración (15 minutos desde creación)';
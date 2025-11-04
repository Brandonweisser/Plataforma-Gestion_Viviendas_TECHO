-- Configuración de zona horaria para Chile
-- Zona horaria: America/Santiago (UTC-3 en invierno, UTC-4 en verano con horario de verano)

-- Establecer zona horaria por defecto en la sesión
SET timezone = 'America/Santiago';

-- Verificar zona horaria actual
SHOW timezone;

-- Verificar hora actual en Chile
SELECT NOW() AT TIME ZONE 'America/Santiago' AS hora_chile;

-- Alternativa: Configurar a nivel de base de datos (requiere permisos de superusuario)
-- ALTER DATABASE nombre_base_datos SET timezone TO 'America/Santiago';

-- Para Supabase: La configuración de zona horaria debe hacerse a nivel de aplicación
-- ya que Supabase maneja la base de datos internamente

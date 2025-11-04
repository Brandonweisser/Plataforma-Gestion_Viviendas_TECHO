-- =====================================================
-- CONFIGURACIÓN DE ZONA HORARIA CHILE
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Configurar zona horaria de la base de datos
-- NOTA: Esto requiere permisos de superusuario
-- Si falla, continúa con los siguientes pasos
DO $$
BEGIN
  EXECUTE 'ALTER DATABASE ' || current_database() || ' SET timezone TO ''America/Santiago''';
  RAISE NOTICE 'Zona horaria configurada a America/Santiago';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'No se pudo configurar timezone de la BD (requiere superusuario), continuando con alternativa...';
END $$;

-- 2. Configurar zona horaria para la sesión actual
SET timezone = 'America/Santiago';

-- 3. Verificar configuración
DO $$
DECLARE
  current_tz text;
  current_time_utc timestamptz;
  current_time_chile timestamptz;
BEGIN
  SHOW timezone INTO current_tz;
  current_time_utc := NOW() AT TIME ZONE 'UTC';
  current_time_chile := NOW();
  
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Zona horaria actual: %', current_tz;
  RAISE NOTICE 'Hora UTC: %', current_time_utc;
  RAISE NOTICE 'Hora Chile: %', current_time_chile;
  RAISE NOTICE '====================================';
END $$;

-- 4. Crear función helper para obtener hora de Chile
CREATE OR REPLACE FUNCTION chile_now()
RETURNS timestamptz AS $$
BEGIN
  RETURN NOW() AT TIME ZONE 'America/Santiago';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION chile_now() IS 'Retorna la hora actual en zona horaria de Chile (America/Santiago)';

-- 5. Actualizar tablas existentes para usar timezone correcto (OPCIONAL)
-- Solo ejecutar si las fechas están incorrectas

-- Para audit_log: agregar columente de timezone si no existe
DO $$
BEGIN
  -- Verificar si necesitamos ajustar created_at
  IF EXISTS (
    SELECT 1 FROM audit_log 
    WHERE created_at IS NOT NULL 
    LIMIT 1
  ) THEN
    RAISE NOTICE 'Tabla audit_log tiene datos. Las fechas se mostrarán en hora Chile automáticamente.';
  END IF;
END $$;

-- 6. Crear vista para ver fechas en hora Chile (útil para reportes)
CREATE OR REPLACE VIEW audit_log_chile AS
SELECT 
  id,
  actor_uid,
  actor_email,
  actor_rol,
  action,
  entity_type,
  entity_id,
  details,
  user_agent,
  ip,
  created_at AT TIME ZONE 'America/Santiago' AS created_at_chile,
  created_at
FROM audit_log;

COMMENT ON VIEW audit_log_chile IS 'Vista de audit_log con fechas convertidas a hora de Chile';

-- 7. Test: Comparar hora actual en diferentes zonas
SELECT 
  NOW() AT TIME ZONE 'UTC' AS hora_utc,
  NOW() AT TIME ZONE 'America/Santiago' AS hora_chile,
  NOW() AS hora_bd,
  EXTRACT(EPOCH FROM (NOW() AT TIME ZONE 'UTC' - NOW() AT TIME ZONE 'America/Santiago'))/3600 AS diferencia_horas;

-- 8. Test: Ver últimos registros de audit_log con hora Chile
SELECT 
  id,
  action,
  actor_email,
  created_at AS guardado_bd,
  created_at AT TIME ZONE 'America/Santiago' AS hora_chile,
  to_char(created_at AT TIME ZONE 'America/Santiago', 'DD/MM/YYYY HH24:MI:SS') AS formato_chile
FROM audit_log
ORDER BY created_at DESC
LIMIT 5;

-- 9. Crear función para insertar con timestamp Chile (si prefieres control manual)
CREATE OR REPLACE FUNCTION insert_audit_log_chile(
  p_actor_uid bigint,
  p_actor_email text,
  p_actor_rol text,
  p_action text,
  p_entity_type text DEFAULT NULL,
  p_entity_id bigint DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb,
  p_user_agent text DEFAULT NULL,
  p_ip text DEFAULT NULL
)
RETURNS bigint AS $$
DECLARE
  v_id bigint;
BEGIN
  INSERT INTO audit_log (
    actor_uid,
    actor_email,
    actor_rol,
    action,
    entity_type,
    entity_id,
    details,
    user_agent,
    ip,
    created_at
  ) VALUES (
    p_actor_uid,
    p_actor_email,
    p_actor_rol,
    p_action,
    p_entity_type,
    p_entity_id,
    p_details,
    p_user_agent,
    p_ip,
    NOW() -- Usará la zona horaria configurada
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION insert_audit_log_chile IS 'Inserta un log de auditoría usando hora de Chile';

-- =====================================================
-- FIN DE CONFIGURACIÓN
-- =====================================================

-- Mensaje final
DO $$
BEGIN
  RAISE NOTICE '✅ Configuración completada';
  RAISE NOTICE '📍 Zona horaria: America/Santiago (UTC-3)';
  RAISE NOTICE '🕐 Hora actual: %', NOW();
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos pasos:';
  RAISE NOTICE '1. Reiniciar conexiones del backend (restart npm)';
  RAISE NOTICE '2. Verificar que NOW() muestre hora de Chile';
  RAISE NOTICE '3. Crear una incidencia de prueba y verificar created_at';
END $$;

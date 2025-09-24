# Migraciones – Módulo Beneficiario

## Estrategia
- Archivos SQL versionados en esta carpeta: 001, 002, etc.
- Cada migración debe ser idempotente (usar `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`).
- No activar RLS hasta que las inserciones básicas funcionen.
- Tests manuales tras cada migración: `SELECT` simples e `EXPLAIN` en tablas nuevas.

## Convenciones
- Nombre: `001_beneficiario_schema.sql`, `002_seed_demo.sql`, etc.
- Commit separado por migración.
- Nunca editar una migración ya aplicada en remoto: crear una nueva corrección (fix).

## Orden planificado
0. (Este README)
1. 001_beneficiario_schema.sql
   - Nuevas tablas: `vivienda_recepcion`, `vivienda_recepcion_item`, `media`
   - Nuevas columnas en `incidencias`: `categoria`, `prioridad`
2. 002_seed_demo.sql (opcional para ambiente de pruebas)
3. 003_recepcion_endpoints_prep.sql (índices y vistas auxiliares)
4. 004_media_rls.sql (activar RLS + policies cuando backend listo)
5. 005_checks_estados.sql (CHECK + triggers transición de estados)
6. 006_indexes_tuning.sql (índices adicionales tras analizar uso real)

## Rollback
- Evitar rollbacks destructivos; usar migraciones compensatorias.
- Si es imprescindible, crear `xxx_down.sql` SOLO para entornos no productivos.

## Checklist antes de aplicar
- Respaldar datos sensibles.
- Verificar que no hay conexiones críticas escribiendo en tablas afectadas.
- Ejecutar en staging antes de producción.

## Cómo aplicar manualmente
Ejecutar el contenido del archivo en el SQL Editor de Supabase o vía `psql`.

## Próximos pasos
Crear `001_beneficiario_schema.sql` y ejecutarla.

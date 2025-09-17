# Evidencia Pruebas Backend (Auth + Roles + Migración Password)

Este documento resume las pruebas automatizadas actuales del backend y el refactor de contraseñas con migración a `password_hash`.

## Alcance Cubierto

| Área | Caso | Archivo | Estado |
|------|------|---------|--------|
| Registro | Usuario nuevo (token emitido) | `__tests__/auth.test.js` | OK |
| Registro | Email duplicado (409) | `__tests__/auth.test.js` | OK |
| Registro | Rechaza password débil (400) | `__tests__/auth.test.js` | OK |
| Login | Password correcta (bcrypt) | `__tests__/auth.test.js` | OK |
| Login | Password incorrecta (401) | `__tests__/auth.test.js` | OK |
| Login | Rate limiting tras 3 fallos (429/401) | `__tests__/auth.test.js` | OK |
| /api/me | Retorna datos usuario con token válido | `__tests__/auth.test.js` | OK |
| Roles | Admin accede a /api/admin/health | `__tests__/auth.test.js` | OK |
| Roles | Técnico bloqueado en /api/admin/health | `__tests__/auth.test.js` | OK |
| Roles | Técnico accede a /api/tecnico/health | `__tests__/auth.test.js` | OK |
| Roles | Beneficiario bloqueado en /api/tecnico/health | `__tests__/auth.test.js` | OK |
| Roles | Beneficiario accede a /api/beneficiario/health | `__tests__/auth.test.js` | OK |
| Roles | Técnico bloqueado en /api/beneficiario/health | `__tests__/auth.test.js` | OK |
| Migración | Plaintext -> hash y preserva hashes existentes | `__tests__/migration.test.js` | OK |

## Cambios Estructurales
1. Separación de la app en `app.js` para testear sin abrir puerto.
2. Inyección de mocks mediante `global.__supabaseMock` (SUT desacoplado de la base real).
3. Eliminación del fallback de comparación en texto plano (`password === stored`).
4. Introducción de campo unificado `password_hash` (código ajustado para registrar y validar sólo hash).
5. Script de migración incremental `scripts/migrar_passwords.js`.

## Script de Migración
Ubicación: `backend/scripts/migrar_passwords.js`

Flujo:
1. Selecciona lotes de usuarios con `password_hash IS NULL`.
2. Para cada fila:
   - Si `contraseña` empieza con `$2` → se reutiliza.
   - Si no → se genera hash con `bcrypt` (`BCRYPT_SALT_ROUNDS`).
3. Actualiza `password_hash`.
4. Repite hasta vaciar.

Ejecución:
```bash
node scripts/migrar_passwords.js
```
Variables opcionales:
- `BCRYPT_SALT_ROUNDS` (default 10)
- `MIGRATION_BATCH_SIZE` (default 200)

Post-migración recomendada:
```sql
-- (Opcional) Eliminar columna antigua tras verificación
ALTER TABLE usuarios DROP COLUMN "contraseña";
```

## Próximos Casos Pendientes (Sugeridos)
- Forzar error interno (mock lanza excepción) para verificar respuesta 500 consistente.
- Endpoint de logout con invalidación real (lista de revocación / token versioning en tabla usuarios).
- Flujo de refresh token (rotación segura + detección de reuse).
- Cookies httpOnly + protección CSRF (token doble submit o header personalizado) y pruebas asociadas.
- Bloqueo progresivo por usuario (no sólo IP) tras N fallos; prueba de liberación tras ventana de tiempo.
- Métricas de cobertura (istanbul) y umbrales mínimos.
- Prueba de expiración de JWT (manipulando clock / usando corto `expiresIn`).
- Auditoría de logs: validar que eventos clave se registran (mock logger) sin exponer datos sensibles.

## Cómo Correr los Tests
Desde `backend/`:
```bash
npm test -- --runInBand
```

## Conclusión
La base de autenticación y autorización está cubierta por pruebas unitarias y de integración ligeras (supertest). La migración a `password_hash` elimina riesgos de contraseñas planas y simplifica futuras mejoras de seguridad.

Se añadieron controles de seguridad adicionales (política de contraseñas y rate limiting de login) y cobertura para todos los endpoints de salud por rol. Próximos pasos recomendados: refresh tokens, invalidación de sesión (logout real), y endurecimiento adicional (CSRF, bloqueo progresivo, auditoría).

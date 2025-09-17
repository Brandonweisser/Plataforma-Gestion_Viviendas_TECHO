# Sistema de Roles y Acceso

Este documento describe el flujo de autenticación, normalización de roles y control de acceso en el frontend y backend.

## Roles Soportados
- administrador (alias aceptado: `admin`)
- tecnico (alias aceptado: `técnico` con tilde)
- beneficiario

## Normalización
La función `normalizeRole` en `frontend/src/utils/roles.js` mapea variantes de texto a un conjunto reducido:
```
admin|administrador -> administrador
tecnico|técnico -> tecnico
beneficiario -> beneficiario
```
Esto evita fallos de comparación causados por acentos o abreviaciones.

## Flujo de Autenticación
1. Usuario envía credenciales a `/api/login` (backend Express).
2. Backend valida email y contraseña (acepta temporalmente hash o texto plano por migración) y firma JWT con `role` (claim `role`) y `sub` = uid.
3. Frontend almacena `token` en `localStorage` y decodifica para obtener el rol inmediato (optimiza UX si la llamada a `/api/me` falla).
4. Frontend intenta obtener `/api/me` para datos completos; si falla, usa datos mínimos (email + rol decodificado).
5. Redirección automática a dashboard específico (`/admin`, `/tecnico`, `/beneficiario`) vía `dashboardPathFor`.

## Guardas de Ruta (Frontend)
- `ProtectedRoute`: Verifica `isAuthenticated` del `AuthContext`. Si no hay sesión, redirige a `/` (login).
- `RoleRoute`: Verifica que el rol normalizado esté dentro de la lista `allowed`. Si no coincide, redirige a `/unauthorized`.

Ejemplo en `App.jsx`:
```jsx
<Route element={<ProtectedRoute />}> 
  <Route element={<RoleRoute allowed={["administrador"]} />}> 
    <Route path="/admin" element={<AdminDashboard />} />
  </Route>
</Route>
```

## Decodificación de JWT
Se usa `decodeJwt` (implementación liviana base64, sin validar firma en frontend). El backend es la fuente de verdad; el frontend sólo infiere rol para redirección rápida.

## Backend (Resumen Actual)
- Endpoints principales: `/api/register`, `/api/login`, `/api/me`.
- Middleware `verifyToken` valida y decodifica JWT (se podría extender con `authorizeRole(['administrador'])`).
- Tabla `usuarios` (schema real) contiene columnas: `uid`, `email`, `contraseña`, `rol`, etc.
- Migración pendiente: renombrar `contraseña` -> `password_hash` y aplicar hashing a existentes.

## Reglas de Acceso (Actual)
| Recurso | Requiere Autenticación | Rol específico |
|---------|------------------------|----------------|
| /home (frontend) | Sí | No |
| /admin | Sí | administrador |
| /tecnico | Sí | tecnico |
| /beneficiario | Sí | beneficiario |
| /unauthorized | No | No |

## Estrategia de Pruebas
Tests en `frontend/src/__tests__/roles.test.jsx` cubren:
- Acceso permitido (admin -> /admin).
- Acceso denegado con redirección a `/unauthorized` (tecnico -> /admin).
- Acceso permitido beneficiario -> /beneficiario.
- Redirección a login si no autenticado.
- Normalización de rol (`admin` funciona como `administrador`).

## Próximas Mejoras Sugeridas
1. Middleware backend `authorizeRole` reutilizable para rutas privadas de API.
2. Refresh token / expiración y manejo de 401 (auto logout + toast informativo).
3. Reemplazar almacenamiento en `localStorage` por `httpOnly cookie` para mitigar XSS (requiere ajustes CORS y CSRF token).
4. Añadir claim `exp` y validarlo en frontend para logout proactivo.
5. Páginas 404 y 403 diferenciadas.
6. Auditoría de acciones (logs con rol + uid en backend).

## Seguridad
- Nunca confiar definitivamente en el rol del frontend; siempre revalidar en backend.
- Evitar exponer `service_role` key de Supabase al frontend (solo backend la usa).
- Plan de migración: una vez hasheadas contraseñas, remover lógica de fallback a texto plano.

## Diagrama (Simplificado)
```
[Formulario Login]
   | credenciales
   v
[POST /api/login] --valida--> [DB usuarios]
   | JWT(role)
   v
[Front almacena token]
   | decode role
   v
[GET /api/me] (datos enriquecidos)
   | user JSON
   v
[AuthContext setUser]
   | role
   v
[Redirect dashboardPathFor(role)]
```

## Referencias de Código
- `frontend/src/utils/roles.js`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/components/ProtectedRoute.jsx`
- `frontend/src/App.jsx`
- `frontend/src/pages/Login.jsx` / `registrar.jsx`

---
Última actualización: (auto) basada en implementación de guardas y tests de roles.

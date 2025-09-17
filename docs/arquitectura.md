# Arquitectura General

Este documento describe a alto nivel los componentes principales del sistema y referencias a documentación específica.

## Frontend
- React + React Router
- Context API para autenticación (`AuthContext`)
- Rutas protegidas y por rol (ver `../frontend/src/components/ProtectedRoute.jsx`)

## Backend
- Node.js + Express
- Supabase Postgres como base de datos (acceso vía SDK `@supabase/supabase-js` en el backend)
- JWT para autenticación stateless

## Roles y Control de Acceso
Documentación detallada en `ROLES.md`.

## Próximas ampliaciones
- Middleware `authorizeRole` en backend
- Refresh tokens / expiración
- Migración de contraseñas a hash definitivo

---
Para detalles del flujo de autenticación y normalización de roles, consulte `ROLES.md`.

# Control de Acceso y Roles del Sistema

## Descripción General

El sistema implementa un control de acceso basado en roles (RBAC) que define tres niveles de permisos diferenciados para garantizar la seguridad y funcionalidad apropiada según el tipo de usuario.

## Roles Definidos

### Administrador
**Código:** `administrador`
**Descripción:** Acceso completo al sistema con capacidades de gestión global.

**Permisos incluidos:**
- Gestión completa de usuarios (crear, editar, eliminar)
- Administración de proyectos y viviendas
- Asignación de roles y permisos
- Acceso a reportes y estadísticas globales
- Configuración del sistema
- Supervisión de todas las actividades

**Rutas de acceso:**
- Dashboard: `/admin`
- Todas las funcionalidades del sistema

### Técnico
**Código:** `tecnico`
**Descripción:** Personal técnico especializado en la gestión operativa de incidencias y evaluaciones.

**Permisos incluidos:**
- Gestión de incidencias asignadas
- Revisión y aprobación de formularios
- Actualización de estados de viviendas
- Generación de reportes técnicos
- Comunicación con beneficiarios

**Rutas de acceso:**
- Dashboard: `/tecnico`
- Módulos de incidencias y formularios

**Restricciones:**
- No puede gestionar usuarios
- No puede eliminar proyectos
- Acceso limitado a estadísticas globales

### Beneficiario
**Código:** `beneficiario`  
**Descripción:** Usuarios finales que reciben y habitan las viviendas sociales.

**Permisos incluidos:**
- Reporte de nuevas incidencias
- Completar formularios de recepción y postventa
- Seguimiento del estado de sus solicitudes
- Visualización de información personal

**Rutas de acceso:**
- Dashboard: `/beneficiario`
- Módulos de reportes y formularios personales

**Restricciones:**
- Solo acceso a información propia
- No puede gestionar otros usuarios
- No puede cambiar estados de incidencias
- Acceso limitado a reportes personales

## Implementación Técnica

### Autenticación
- Sistema basado en JSON Web Tokens (JWT)
- Tokens firmados con clave secreta del servidor
- Validación en cada request del backend
- Almacenamiento seguro en localStorage del cliente

### Autorización Frontend
- Componente `ProtectedRoute` para verificar autenticación
- Componente `RoleRoute` para validar permisos específicos
- Redirección automática según rol después del login
- Ocultación de elementos UI según permisos

### Autorización Backend
- Middleware de verificación de tokens JWT
- Validación de roles en endpoints protegidos
- Filtrado de datos según permisos del usuario
- Logs de acceso para auditoría

## Flujo de Autenticación

1. **Login del Usuario**
   - Usuario ingresa credenciales
   - Backend valida email y contraseña
   - Sistema genera JWT con información del rol
   - Token enviado al cliente para almacenamiento

2. **Verificación de Sesión**
   - Cliente incluye token en headers de requests
   - Backend decodifica y valida token
   - Verificación de permisos según endpoint solicitado
   - Respuesta autorizada o error 403/401

3. **Redirección por Rol**
   - Sistema determina dashboard apropiado
   - Redirección automática a ruta correspondiente
   - Carga de componentes específicos del rol

## Seguridad Implementada

### Validaciones
- Verificación de formato de email
- Validación de RUT chileno
- Contraseñas hasheadas con bcrypt
- Tokens con tiempo de expiración

### Protección de Rutas
- Middleware de autenticación en todas las rutas protegidas
- Validación de permisos específicos por endpoint
- Filtrado de datos sensibles según rol
- Prevención de escalación de privilegios

### Auditoría
- Registro de inicios de sesión
- Logs de acciones sensibles
- Trazabilidad de cambios importantes
- Monitoreo de accesos no autorizados

## Escalabilidad del Sistema

### Extensión de Roles
El sistema está diseñado para permitir la adición de nuevos roles:
- Estructura modular de permisos
- Configuración centralizada de accesos
- Middleware reutilizable para validaciones

### Permisos Granulares
Posibilidad de implementar permisos más específicos:
- Permisos por módulo
- Restricciones geográficas
- Limitaciones temporales
- Acceso condicional según contexto

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

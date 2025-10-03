# Documentación Técnica - Sistema de Gestión TECHO

## Arquitectura del Sistema

### Componentes Principales

#### Frontend (React)
- **Framework:** React 18 con Hooks
- **Routing:** React Router para navegación
- **Estilos:** Tailwind CSS
- **Estado:** Context API para autenticación
- **HTTP Client:** Axios para comunicación con API

#### Backend (Node.js)
- **Framework:** Express.js
- **Autenticación:** JWT (JSON Web Tokens)
- **Base de Datos:** PostgreSQL via Supabase
- **Archivos:** Multer para upload, Supabase Storage
- **PDFs:** html-pdf-node para generación de reportes

#### Base de Datos
- **Motor:** PostgreSQL 14+
- **Hosting:** Supabase
- **Patrón:** Normalizado con relaciones FK
- **Índices:** Optimizado para consultas frecuentes

## Estructura de Datos

### Entidades Principales

#### Usuarios
- Autenticación por email/contraseña
- Roles: administrador, tecnico, beneficiario
- RUT único opcional
- Timestamps de auditoría

#### Proyectos
- Gestión de cronogramas
- Conteo automático de viviendas
- Fechas de inicio y entrega

#### Viviendas
- Estados: planificada → en_construccion → asignada → entregada
- Asignación a beneficiarios
- Tipología (1D, 2D, 3D)

#### Incidencias
- Reportes de problemas
- Asignación a técnicos
- Estados de seguimiento
- Historial de cambios completo

#### Formularios de Postventa
- Templates por tipo de vivienda
- Estados: borrador → enviada → revisado_correcto/revisado_con_problemas
- Generación automática de PDFs

## Flujos de Trabajo

### Autenticación
1. Login con email/contraseña
2. Validación contra base de datos
3. Generación de JWT con rol
4. Middleware de autorización en rutas protegidas

### Gestión de Incidencias
1. Beneficiario reporta problema
2. Sistema asigna técnico disponible
3. Técnico gestiona y actualiza estado
4. Historial completo de cambios
5. Notificación de resolución

### Proceso de Postventa
1. Beneficiario completa formulario
2. Sistema genera items desde template
3. Técnico revisa y evalúa
4. Generación automática de incidencias si hay problemas
5. PDF final con resultados

## Seguridad

### Autenticación
- Contraseñas hasheadas con bcrypt
- Tokens JWT con expiración
- Validación de roles en cada endpoint

### Autorización
- Middleware de verificación de roles
- Endpoints protegidos por tipo de usuario
- Validación de ownership en recursos

### Base de Datos
- Row Level Security (RLS) en Supabase
- Prepared statements para prevenir SQL injection
- Validación de tipos de datos

## APIs Principales

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión

### Usuarios
- `GET /api/usuarios` - Listar usuarios (admin)
- `POST /api/usuarios` - Crear usuario (admin)
- `PUT /api/usuarios/:id` - Actualizar usuario

### Viviendas
- `GET /api/viviendas` - Listar viviendas (filtros por rol)
- `POST /api/viviendas` - Crear vivienda (admin)
- `PUT /api/viviendas/:id/asignar` - Asignar beneficiario

### Incidencias
- `GET /api/incidencias` - Listar incidencias
- `POST /api/incidencias` - Crear incidencia
- `PUT /api/incidencias/:id` - Actualizar estado

### Postventa
- `GET /api/postventa/templates` - Templates disponibles
- `POST /api/postventa/forms` - Crear formulario
- `GET /api/postventa/forms/:id/pdf` - Generar PDF

## Configuración del Entorno

### Variables de Entorno Requeridas
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your-secret-key-here
PORT=3001
```

### Configuración de Supabase
1. Crear proyecto en supabase.com
2. Ejecutar `database/schema_completo.sql`
3. Configurar Storage policies para uploads
4. Obtener credenciales del proyecto

## Testing

### Backend Testing
- Framework: Jest
- Cobertura: Autenticación, CRUD operations
- Mocks: Supabase client
- Comando: `npm test`

### Frontend Testing
- Framework: Jest + React Testing Library
- Componentes críticos: Login, Dashboard
- Comando: `npm test`

## Deployment

### Requisitos de Producción
- Node.js 16+ LTS
- PostgreSQL 14+ (Supabase)
- Dominio con HTTPS
- Variables de entorno seguras

### Proceso de Deploy
1. Build del frontend: `npm run build`
2. Configurar servidor Node.js
3. Configurar proxy reverso (nginx)
4. Configurar SSL/TLS
5. Variables de entorno de producción

## Monitoreo y Logs

### Logging Backend
- Console.log para desarrollo
- Structured logging para producción
- Error tracking con timestamps

### Métricas Recomendadas
- Tiempo de respuesta de APIs
- Uso de memoria y CPU
- Errores por endpoint
- Usuarios activos por rol

## Mantenimiento

### Actualizaciones de Seguridad
- Dependencias de Node.js: mensual
- Supabase: automático
- Revisión de vulnerabilidades: semanal

### Backup de Datos
- Supabase: backup automático diario
- Archivos de Storage: replicación automática
- Scripts de restauración disponibles

### Limpieza de Datos
- Archivos temporales: automático
- Logs antiguos: rotación semanal
- Tokens expirados: limpieza diaria
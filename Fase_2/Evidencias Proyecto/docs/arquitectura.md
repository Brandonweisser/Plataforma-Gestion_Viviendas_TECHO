# Arquitectura del Sistema

## Visión General

El sistema está diseñado como una aplicación web de tres capas con arquitectura modular y escalable.

## Componentes Principales

### Frontend (Cliente Web)
- **Tecnología:** React 18 con React Router
- **Estado:** Context API para autenticación global
- **Estilos:** Tailwind CSS para diseño responsivo
- **Comunicación:** Axios para llamadas HTTP a la API

**Estructura de Carpetas:**
```
src/
├── components/     # Componentes reutilizables
├── pages/         # Páginas por rol de usuario
├── services/      # Servicios de API
├── context/       # Contextos de React
└── utils/         # Funciones auxiliares
```

### Backend (Servidor API)
- **Tecnología:** Node.js con Express.js
- **Autenticación:** JWT (JSON Web Tokens)
- **Base de Datos:** Cliente Supabase para PostgreSQL
- **Archivos:** Multer para manejo de uploads

**Estructura de Carpetas:**
```
backend/
├── app.js          # Configuración principal
├── server.js       # Punto de entrada
├── services/       # Lógica de negocio
├── scripts/        # Scripts de utilidad
└── __tests__/      # Pruebas automatizadas
```

### Base de Datos (PostgreSQL via Supabase)
- **Motor:** PostgreSQL 15+
- **Hosting:** Supabase (Database as a Service)
- **Storage:** Supabase Storage para archivos
- **Seguridad:** Row Level Security habilitada

## Patrones de Diseño Implementados

### Autenticación Stateless
- JWT almacenado en localStorage del cliente
- Validación en cada request del backend
- Roles verificados en middleware de autorización

### Control de Acceso Basado en Roles (RBAC)
- **Administrador:** Acceso completo al sistema
- **Técnico:** Gestión de incidencias y formularios
- **Beneficiario:** Reportes y consultas limitadas

### Arquitectura de Servicios
- Separación clara entre controladores y lógica de negocio
- Servicios independientes para cada módulo
- Manejo centralizado de errores

## Flujo de Datos

1. **Cliente → API:** Requests HTTP con JWT en headers
2. **API → Base de Datos:** Consultas via cliente Supabase
3. **Base de Datos → API:** Respuestas JSON estructuradas
4. **API → Cliente:** Respuestas HTTP con datos procesados

## Seguridad

### Autenticación
- Contraseñas hasheadas con bcrypt
- Tokens JWT con expiración configurable
- Validación de formato de email y RUT

### Autorización
- Middleware de verificación de roles
- Acceso restringido por endpoints
- Validación de permisos en frontend

### Base de Datos
- Conexión encriptada TLS/SSL
- Variables de entorno para credenciales
- Validación de tipos y constraints

## Escalabilidad

### Horizontal
- API stateless preparada para múltiples instancias
- Base de datos centralizada con pooling de conexiones
- Storage distribuido via Supabase

### Vertical
- Índices optimizados en base de datos
- Lazy loading en frontend
- Compresión de respuestas HTTP

## Monitoreo y Logging

### Backend
- Logs estructurados en console
- Manejo de errores con stack traces
- Métricas de performance básicas

### Base de Datos
- Logs de consultas lentas via Supabase
- Métricas de uso y performance
- Backup automatizado diario

## Dependencias Principales

### Frontend
- react: ^18.2.0
- react-router-dom: ^6.8.0
- axios: ^1.3.0
- tailwindcss: ^3.2.0

### Backend
- express: ^4.18.0
- @supabase/supabase-js: ^2.7.0
- jsonwebtoken: ^9.0.0
- bcrypt: ^5.1.0
- multer: ^1.4.0

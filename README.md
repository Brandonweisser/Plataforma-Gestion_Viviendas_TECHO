# Sistema de Gestión de Viviendas - TECHO

Plataforma web para la gestión integral de proyectos habitacionales sociales. Sistema desarrollado por nuestro equipo para optimizar la coordinación entre beneficiarios, técnicos y administradores en todas las etapas del proceso de vivienda.

## Descripción del Proyecto

Este sistema permite gestionar el ciclo completo de las viviendas sociales, desde la planificación del proyecto hasta el seguimiento posterior a la entrega. Incluye módulos especializados para la gestión de incidencias, formularios de recepción y evaluaciones de postventa, facilitando la trazabilidad y el control de calidad en todos los procesos.

## Funcionalidades Principales

### Control de Usuarios y Accesos
- Autenticación segura con roles diferenciados
- Perfiles personalizados para cada tipo de usuario
- Dashboard adaptado según nivel de acceso

### Administración de Proyectos
- Registro y seguimiento de proyectos habitacionales
- Gestión de cronogramas y entregas
- Control de inventario de viviendas por estado

### Proceso de Recepción
- Formularios digitales de verificación por categorías
- Registro fotográfico integrado
- Flujo de aprobación y observaciones

### Sistema de Incidencias
- Reporte directo por parte de beneficiarios
- Asignación y seguimiento técnico
- Historial completo de gestiones y resoluciones
- Clasificación por prioridad y categoría

### Evaluación de Postventa
- Formularios de satisfacción periódicos
- Generación automática de reportes PDF
- Indicadores de calidad y seguimiento
- Dashboard de métricas y estadísticas

### Gestión Documental
- Almacenamiento seguro en la nube
- Generación automática de reportes
- Trazabilidad completa de documentación
- Métricas de desempeño y calidad

## Stack Tecnológico

### Frontend
- **React 18** - Biblioteca de interfaz de usuario
- **React Router** - Navegación entre páginas
- **Tailwind CSS** - Framework de estilos utility-first
- **Axios** - Cliente HTTP para comunicación con API

### Backend
- **Node.js** - Entorno de ejecución JavaScript
- **Express.js** - Framework para API REST
- **JSON Web Tokens (JWT)** - Sistema de autenticación
- **Multer** - Procesamiento de archivos multimedia
- **html-pdf-node** - Generación de documentos PDF

### Base de Datos
- **PostgreSQL** - Base de datos relacional (via Supabase)
- **Supabase** - Plataforma de base de datos como servicio
- **Supabase Storage** - Almacenamiento de archivos en la nube

### Herramientas de Desarrollo
- **ESLint** - Análisis de código JavaScript
- **Jest** - Framework de testing
- **dotenv** - Gestión de variables de entorno

## 🏗️ Arquitectura del Sistema

### Backend Refactorizado (Estructura Modular)
El backend ha sido **completamente refactorizado** siguiendo patrones de arquitectura profesional para mejorar mantenibilidad, escalabilidad y colaboración en equipo:

```
backend/
├── controllers/          # Lógica de negocio separada por funcionalidad
│   ├── authController.js      # Autenticación y autorización
│   ├── adminController.js     # Gestión administrativa
│   ├── beneficiarioController.js # Funciones para beneficiarios
│   └── tecnicoController.js   # Gestión técnica de incidencias
├── middleware/           # Middleware reutilizable
│   └── auth.js               # Verificación JWT y manejo de roles
├── models/              # Acceso a datos y lógica de base de datos
│   ├── User.js               # Gestión de usuarios y autenticación
│   ├── Project.js            # Gestión de proyectos habitacionales
│   ├── Housing.js            # Gestión de viviendas y asignaciones
│   ├── Incidence.js          # Gestión de incidencias y reportes
│   └── PasswordRecovery.js   # Sistema de recuperación de contraseñas
├── routes/              # Definición modular de rutas API
│   ├── auth.js               # /api/* (registro, login, recuperación)
│   ├── admin.js              # /api/admin/* (gestión administrativa)
│   ├── beneficiario.js       # /api/beneficiario/* (funciones beneficiario)
│   └── tecnico.js            # /api/tecnico/* (gestión técnica)
├── services/            # Servicios externos existentes
│   ├── EmailService.js       # Envío de correos electrónicos
│   └── PosventaPDFService.js # Generación de documentos PDF
└── utils/               # Utilidades y validaciones centralizadas
    └── validation.js         # Validaciones reutilizables (RUT, email, etc.)
```

**Beneficios de la nueva arquitectura:**
- ✅ **Mantenibilidad**: Código organizado en módulos específicos y especializados
- ✅ **Escalabilidad**: Fácil agregar nuevas funcionalidades sin afectar módulos existentes
- ✅ **Testing**: Cada módulo se puede probar independientemente
- ✅ **Colaboración**: Diferentes desarrolladores pueden trabajar en módulos separados
- ✅ **Reutilización**: Middleware y utilidades compartidas entre módulos
- ✅ **Mantenimiento**: Separación clara de responsabilidades (SRP)

### API Endpoints Organizados

#### Autenticación (`/api/`)
- `POST /api/register` - Registro de nuevos beneficiarios
- `POST /api/login` - Inicio de sesión con rate limiting
- `GET /api/me` - Información del usuario autenticado
- `POST /api/forgot-password` - Solicitar código de recuperación
- `POST /api/reset-password` - Restablecer contraseña con código

#### Administración (`/api/admin/`)
- `GET /api/admin/dashboard/stats` - Estadísticas del sistema
- `GET|POST|PUT|DELETE /api/admin/usuarios` - CRUD de usuarios
- `GET|POST|PUT|DELETE /api/admin/proyectos` - CRUD de proyectos
- `GET|POST|PUT|DELETE /api/admin/viviendas` - CRUD de viviendas
- `POST /api/admin/proyectos/:id/tecnicos` - Asignar técnicos a proyectos
- `POST /api/admin/viviendas/:id/asignar` - Asignar beneficiarios

#### Beneficiarios (`/api/beneficiario/`)
- `GET /api/beneficiario/vivienda` - Información de vivienda asignada
- `GET /api/beneficiario/recepcion` - Estado de recepción de vivienda
- `GET|POST /api/beneficiario/incidencias` - Gestión de incidencias
- `GET /api/beneficiario/incidencias/:id` - Detalle de incidencia

#### Técnicos (`/api/tecnico/`)
- `GET /api/tecnico/incidencias` - Lista de incidencias asignadas
- `GET /api/tecnico/incidencias/:id` - Detalle de incidencia específica
- `PUT /api/tecnico/incidencias/:id/estado` - Actualizar estado de incidencia
- `POST /api/tecnico/incidencias/:id/asignar` - Auto-asignarse incidencia (admins)
- `GET /api/tecnico/stats` - Estadísticas del técnico

## Estructura del Proyecto

```
Plataforma-Gestion_Viviendas_TECHO/
├── frontend/                 # Aplicación React
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   ├── pages/           # Páginas por rol de usuario
│   │   ├── services/        # Servicios de API
│   │   ├── context/         # Contextos de React
│   │   └── utils/           # Funciones auxiliares
│   └── public/              # Archivos estáticos
├── backend/                 # Servidor Node.js (REFACTORIZADO)
│   ├── controllers/         # Lógica de negocio por funcionalidad
│   ├── middleware/          # Middleware de autenticación y autorización
│   ├── models/             # Modelos de datos y acceso a BD
│   ├── routes/             # Definición modular de rutas API
│   ├── services/           # Servicios externos (Email, PDF)
│   ├── utils/              # Utilidades y validaciones
│   ├── __tests__/          # Pruebas automatizadas
│   └── scripts/            # Scripts de utilidad
├── database/               # Esquemas de base de datos unificados
│   ├── schema_completo.sql # Esquema unificado de la base de datos
│   └── datos_prueba.sql    # Datos de prueba para desarrollo
└── docs/                   # Documentación técnica
```

## Instalación y Configuración

### Requisitos del Sistema
- Node.js 16.0 o superior
- npm 8.0 o superior
- Cuenta en Supabase (para base de datos)

### Configuración Inicial

1. **Navegar al proyecto**
```bash
cd "c:\Plataforma-Gestion_Viviendas_TECHO\Fase_2\Evidencias Proyecto"
```

2. **Configurar el backend**
```bash
cd backend
npm install
```

3. **Variables de entorno del backend**
Crear archivo `.env` en la carpeta backend:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
JWT_SECRET=your_jwt_secret_key
PORT=3001
```

4. **Configurar el frontend**
```bash
cd ../frontend
npm install
```

5. **Configurar la base de datos**
En el panel de Supabase SQL Editor, ejecutar:
```sql
-- Ejecutar el archivo principal del esquema
database/schema_completo.sql
```

### Ejecución del Sistema

1. **Iniciar el backend**
```bash
cd backend
npm start
```

2. **Iniciar el frontend** (en otra terminal)
```bash
cd frontend
npm start
```

3. **Acceso al sistema**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Uso del Sistema

### Cuentas de Acceso por Defecto

#### Administrador
- **Email:** admin@techo.org
- **Contraseña:** admin123
- **Funciones:** Gestión completa del sistema

#### Técnico
- **Email:** tecnico@techo.org  
- **Contraseña:** tecnico123
- **Funciones:** Gestión técnica y seguimiento

#### Beneficiario
- **Email:** beneficiario@techo.org
- **Contraseña:** beneficiario123
- **Funciones:** Reportes y consultas

### Roles y Permisos

#### Administrador
- Gestión completa de usuarios y proyectos
- Visualización de métricas globales
- Configuración del sistema
- Acceso a todas las funcionalidades

#### Técnico
- Gestión de incidencias asignadas
- Revisión de formularios de recepción
- Evaluación de formularios de postventa
- Generación de reportes técnicos

#### Beneficiario
- Recepción de vivienda asignada
- Reporte de incidencias
- Seguimiento del estado de solicitudes
- Completar evaluaciones de postventa

### Flujo de Trabajo Típico

1. **Planificación:** Administrador crea proyectos y registra viviendas
2. **Asignación:** Viviendas se asignan a beneficiarios elegibles  
3. **Recepción:** Beneficiarios completan formulario de recepción
4. **Seguimiento:** Gestión continua de incidencias y mantenimiento
5. **Evaluación:** Formularios periódicos de postventa y satisfacción

## API Principal

### Endpoints de Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `POST /api/auth/recover` - Recuperar contraseña

### Endpoints de Gestión
- `GET /api/viviendas` - Listar viviendas (filtros por rol)
- `POST /api/incidencias` - Crear incidencia
- `GET /api/postventa/forms` - Formularios de postventa
- `POST /api/media/upload` - Subir archivos

## Testing

### Ejecutar Pruebas
```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test

# Cobertura
npm run test:coverage
```

## Documentación Adicional

- **[Instalación](INSTALACION.md)** - Guía de instalación paso a paso
- **[Configuración](CONFIGURACION.md)** - Variables de entorno y configuración  
- **[Manual de Usuario](docs/manual_usuario.md)** - Guía de uso por rol
- **[Documentación Técnica](docs/documentacion_tecnica.md)** - Arquitectura y APIs
- **[Roles y Permisos](docs/ROLES.md)** - Control de acceso del sistema

## Licencia

Este proyecto está licenciado bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Soporte

Para soporte técnico y consultas:
- **Email:** soporte@techo.org
- **Documentación:** Revisar carpeta `docs/`  
- **Issues:** Reportar problemas en el repositorio
- Notificaciones en tiempo real
- API pública para integraciones

### Versiones
- **v1.0.0** - Lanzamiento inicial con funcionalidades básicas
- **v1.1.0** - Sistema de postventa y PDFs
- **v1.2.0** - Mejoras de UX y optimizaciones
- **v2.0.0** - Arquitectura modular implementada

## Equipo de Desarrollo

Este sistema fue desarrollado aplicando principios de ingeniería de software y arquitectura modular para garantizar escalabilidad y mantenibilidad a largo plazo.

### Contribuciones Técnicas
- **Arquitectura Modular**: Implementación de patrones MVC con separación clara de responsabilidades
- **API RESTful**: Diseño de endpoints organizados por funcionalidad
- **Autenticación Segura**: Sistema JWT con manejo de roles y middleware
- **Frontend Reactivo**: Interfaces adaptadas por tipo de usuario
- **Base de Datos**: Diseño normalizado con integridad referencial

El proyecto sigue estándares de la industria para desarrollo web moderno con React y Node.js.

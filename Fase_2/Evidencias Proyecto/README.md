# Sistema de Gestión de Viviendas - TECHO

Plataforma web para la gestión integral de proyectos habitacionales sociales, desarrollada para optimizar la coordinación entre beneficiarios, técnicos y administradores en todas las etapas del proceso de vivienda.

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
├── backend/                 # Servidor Node.js
│   ├── services/            # Lógica de negocio
│   ├── __tests__/           # Pruebas automatizadas
│   └── scripts/             # Scripts de utilidad
├── database/                # Esquemas de base de datos
└── docs/                    # Documentación técnica
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
- **v2.0.0** - Aplicación móvil y nuevas funcionalidades (planificado)
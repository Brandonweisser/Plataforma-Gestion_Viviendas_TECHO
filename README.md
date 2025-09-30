# TECHO - Plataforma de Gestión de Viviendas

Una plataforma web integral para la gestión de viviendas sociales, diseñada para facilitar la administración, seguimiento y mantenimiento de proyectos habitacionales de la organización TECHO.

## Descripción

La Plataforma de Gestión de Viviendas TECHO es un sistema completo que permite gestionar el ciclo de vida completo de las viviendas sociales, desde la asignación inicial hasta el seguimiento post-entrega. El sistema facilita la comunicación entre beneficiarios, técnicos y administradores, proporcionando herramientas especializadas para cada rol.

## Características Principales

### Gestión de Usuarios
- Sistema de autenticación con roles diferenciados (Administrador, Técnico, Beneficiario)
- Dashboard personalizado para cada tipo de usuario
- Gestión de perfiles y datos personales

### Módulo de Viviendas
- Registro y gestión de viviendas
- Asignación de viviendas a beneficiarios
- Seguimiento del estado de cada vivienda
- Información detallada de proyectos y ubicaciones

### Sistema de Recepciones
- Proceso de recepción de viviendas por beneficiarios
- Lista de verificación personalizable por categorías
- Registro fotográfico y observaciones
- Workflow de aprobación por técnicos

### Gestión de Incidencias
- Reporte de problemas por beneficiarios
- Sistema de seguimiento y resolución
- Asignación automática y manual a técnicos
- Historial completo de acciones y comentarios
- Gestión de prioridades y estados

### Formularios de Postventa
- Evaluaciones periódicas de satisfacción
- Generación automática de reportes en PDF
- Seguimiento de calidad post-entrega
- Dashboard de métricas y estadísticas

### Reportes y Documentación
- Generación automática de PDFs
- Almacenamiento en la nube
- Reportes de estado por vivienda
- Métricas de desempeño

## Tecnologías Utilizadas

### Frontend
- **React 18** - Framework de interfaz de usuario
- **React Router** - Navegación y routing
- **Tailwind CSS** - Framework de estilos
- **Axios** - Cliente HTTP para API calls

### Backend
- **Node.js** - Entorno de ejecución
- **Express.js** - Framework web
- **JSON Web Tokens (JWT)** - Autenticación
- **Multer** - Manejo de archivos
- **html-pdf-node** - Generación de PDFs

### Base de Datos
- **Supabase** - Base de datos PostgreSQL como servicio
- **Supabase Storage** - Almacenamiento de archivos

### Herramientas de Desarrollo
- **ESLint** - Linting de código
- **Jest** - Testing framework
- **dotenv** - Gestión de variables de entorno

## Estructura del Proyecto

```
TECHO-Plataforma-Gestion_Viviendas/
├── frontend/                 # Aplicación React
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   ├── pages/           # Páginas de la aplicación
│   │   │   ├── admin/       # Páginas de administrador
│   │   │   ├── tecnico/     # Páginas de técnico
│   │   │   └── beneficiario/# Páginas de beneficiario
│   │   ├── services/        # Servicios de API
│   │   ├── context/         # Contextos de React
│   │   └── utils/           # Utilidades
│   └── public/              # Archivos estáticos
├── backend/                 # Servidor Node.js
│   ├── services/            # Servicios de negocio
│   ├── middleware/          # Middleware de Express
│   └── __tests__/           # Tests del backend
├── database/                # Scripts de base de datos
└── docs/                    # Documentación
```

## Instalación y Configuración

### Prerrequisitos
- Node.js (versión 16 o superior)
- npm o yarn
- Cuenta de Supabase

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/techo-plataforma-viviendas.git
cd techo-plataforma-viviendas
```

2. **Configurar el backend**
```bash
cd backend
npm install
```

3. **Configurar variables de entorno**
Crear archivo `.env` en la carpeta backend:
```env
SUPABASE_URL=tu_supabase_url
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
SUPABASE_ANON_KEY=tu_anon_key
JWT_SECRET=tu_jwt_secret
PORT=3001
```

4. **Configurar el frontend**
```bash
cd ../frontend
npm install
```

5. **Configurar la base de datos**
Ejecutar los scripts SQL en el siguiente orden:
```bash
# En Supabase SQL Editor
database/001_initial_schema.sql
database/002_usuarios.sql
database/003_viviendas.sql
database/004_recepciones.sql
database/005_incidencias.sql
database/006_posventa.sql
database/007_storage_policies.sql
database/008_triggers.sql
database/009_posventa_pdf.sql
```

### Ejecución

1. **Iniciar el servidor backend**
```bash
cd backend
npm start
```

2. **Iniciar la aplicación frontend**
```bash
cd frontend
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## Uso

### Roles de Usuario

#### Administrador
- Gestión completa de usuarios y viviendas
- Visualización de métricas y reportes
- Configuración del sistema
- Acceso a todas las funcionalidades

#### Técnico
- Gestión de incidencias asignadas
- Revisión de recepciones de vivienda
- Evaluación de formularios de postventa
- Generación de reportes técnicos

#### Beneficiario
- Recepción de vivienda asignada
- Reporte de incidencias
- Seguimiento del estado de la vivienda
- Completar evaluaciones de postventa

### Flujo de Trabajo Típico

1. **Asignación de Vivienda**: El administrador asigna una vivienda al beneficiario
2. **Recepción**: El beneficiario completa la recepción de la vivienda
3. **Seguimiento**: Reporte y seguimiento de incidencias
4. **Postventa**: Evaluaciones periódicas de satisfacción

## API

### Endpoints Principales

#### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/logout` - Cerrar sesión

#### Viviendas
- `GET /api/viviendas` - Listar viviendas
- `POST /api/viviendas` - Crear vivienda
- `PUT /api/viviendas/:id` - Actualizar vivienda

#### Incidencias
- `GET /api/incidencias` - Listar incidencias
- `POST /api/incidencias` - Crear incidencia
- `PUT /api/incidencias/:id` - Actualizar incidencia

#### Recepciones
- `GET /api/recepciones` - Listar recepciones
- `POST /api/recepciones` - Crear recepción
- `PUT /api/recepciones/:id` - Actualizar recepción

## Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Contribución

1. Fork el repositorio
2. Crear una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit los cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear un Pull Request

### Estándares de Código
- Usar ESLint para mantener consistencia
- Escribir tests para nuevas funcionalidades
- Documentar cambios en la API
- Seguir convenciones de naming establecidas

## Deployment

### Variables de Entorno de Producción
```env
NODE_ENV=production
SUPABASE_URL=production_url
SUPABASE_SERVICE_ROLE_KEY=production_key
JWT_SECRET=production_secret
```

### Build de Producción
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm run start:prod
```

## Licencia

Este proyecto está licenciado bajo la MIT License - ver el archivo [LICENSE](LICENSE) para detalles.

## Soporte

Para soporte técnico o reportar bugs:
- Crear un issue en GitHub
- Contactar al equipo de desarrollo en desarrollo@techo.org

## Créditos

Desarrollado por el equipo de tecnología de TECHO para facilitar la gestión de viviendas sociales y mejorar la calidad de vida de las familias beneficiarias.

## Roadmap

### Próximas Funcionalidades
- Aplicación móvil nativa
- Integración con sistemas externos
- Módulo de inventario
- Dashboard de analíticas avanzado
- Notificaciones en tiempo real
- API pública para integraciones

### Versiones
- **v1.0.0** - Lanzamiento inicial con funcionalidades básicas
- **v1.1.0** - Sistema de postventa y PDFs
- **v1.2.0** - Mejoras de UX y optimizaciones
- **v2.0.0** - Aplicación móvil y nuevas funcionalidades (planificado)
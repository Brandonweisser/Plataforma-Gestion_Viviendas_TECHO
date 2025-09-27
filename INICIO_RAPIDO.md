# 🏠 Plataforma de Gestión de Viviendas TECHO

Sistema completo para la gestión de viviendas sociales, incidencias, recepción de viviendas y formularios de posventa.

## 🚀 Inicio Rápido

### 1. Configuración de la Base de Datos

**Paso 1: Crear proyecto en Supabase**
1. Ve a [supabase.com](https://supabase.com) y crea un cuenta/proyecto
2. Copia tu Project URL y service_role key

**Paso 2: Configurar variables de entorno**
```bash
# En la carpeta backend, edita el archivo .env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu_service_role_key_aqui
JWT_SECRET=tu_jwt_secret_super_seguro
```

**Paso 3: Ejecutar migraciones (si es necesario)**
- El esquema ya debería estar creado en tu Supabase
- Si falta alguna tabla, ejecuta los scripts de `database/` en el SQL Editor de Supabase

### 2. Poblar con Datos de Prueba

**Opción A: Via SQL (Recomendado)**
```sql
-- Ejecutar database/datos_prueba.sql en el SQL Editor de Supabase
-- Esto creará usuarios, proyectos, viviendas e incidencias de ejemplo
```

**Opción B: Via Script de Node.js**
```bash
cd backend
node crearUsuariosPrueba.js
```

### 3. Iniciar el Backend

```bash
cd backend
node server.js
```
Debería mostrar: `Server running on port 3001`

### 4. Probar el Backend

```bash
cd backend
node testBackend.js
```

### 5. Iniciar el Frontend

```bash
cd frontend
npm install  # solo la primera vez
npm start
```
Se abre en: http://localhost:3000

## 👥 Usuarios de Prueba

| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@techo.org | techo123 | Administrador |
| tecnico1@techo.org | techo123 | Técnico |
| carlos.gonzalez@email.com | techo123 | Beneficiario |
| patricia.lopez@email.com | techo123 | Beneficiario |

## 🏗️ Arquitectura del Sistema

### Backend (Puerto 3001)
- **Node.js + Express**: API REST
- **Supabase**: Base de datos PostgreSQL
- **JWT**: Autenticación stateless
- **bcrypt**: Hash de contraseñas
- **Multer**: Subida de archivos

### Frontend (Puerto 3000)
- **React 18**: Interfaz de usuario
- **React Router**: Navegación y rutas protegidas
- **Context API**: Manejo de estado de autenticación
- **Tailwind CSS**: Estilos

### Base de Datos
- **PostgreSQL** via Supabase
- **9 tablas principales**: usuarios, proyectos, viviendas, incidencias, etc.
- **Sistema de roles**: Administrador, Técnico, Beneficiario
- **Trazabilidad completa** de cambios en incidencias

## 📊 Funcionalidades por Rol

### 🔧 Administrador
- ✅ Vista completa del sistema
- ✅ Gestión de usuarios y proyectos
- ✅ Reportes y estadísticas globales
- ✅ Acceso a todas las incidencias

### 👷 Técnico
- ✅ Asignación y resolución de incidencias
- ✅ Revisión de formularios de recepción/posventa
- ✅ Actualización de estados de incidencias
- ✅ Generación de incidencias desde formularios

### 🏠 Beneficiario
- ✅ Reporte de nuevas incidencias
- ✅ Formularios de recepción de vivienda
- ✅ Formularios de posventa
- ✅ Seguimiento de estado de reportes
- ✅ Subida de fotos para evidencias

## 🔄 Flujos de Trabajo

### 1. Recepción de Vivienda
1. Beneficiario recibe vivienda → Completa formulario de recepción
2. Sistema genera checklist automático por tipo de vivienda
3. Beneficiario marca ítems OK/No OK y sube fotos
4. Técnico revisa formulario y genera incidencias para ítems No OK

### 2. Gestión de Incidencias
1. Incidencia creada (manual o desde formularios)
2. Sistema asigna prioridad automática basada en descripción
3. Técnico es asignado y cambia estado a "en_proceso"
4. Al resolver, técnico marca como "resuelta"
5. Historial completo queda registrado

### 3. Formulario de Posventa
1. Después de un tiempo, beneficiario completa posventa
2. Usa templates predefinidos según tipo de vivienda
3. Sistema permite crear incidencias automáticamente
4. Técnico revisa y procesa formulario

## 📁 Estructura del Proyecto

```
├── backend/                 # API Node.js
│   ├── app.js              # Configuración Express y rutas
│   ├── server.js           # Servidor principal
│   ├── supabaseClient.js   # Cliente de Supabase
│   ├── crearUsuariosPrueba.js  # Script de usuarios
│   ├── testBackend.js      # Script de pruebas
│   └── __tests__/          # Tests automatizados
├── frontend/               # Aplicación React
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/          # Páginas por rol
│   │   ├── context/        # Context API
│   │   └── utils/          # Utilidades
│   └── public/
├── database/               # Scripts SQL
│   ├── schema_backend.sql  # Esquema principal
│   ├── datos_prueba.sql    # Datos de ejemplo
│   └── 00X_*.sql          # Migraciones
└── docs/                   # Documentación
    ├── arquitectura.md
    ├── ROLES.md
    └── manual_usuario.md
```

## 🧪 Testing

### Backend
```bash
cd backend
npm test
```

### Frontend
```bash
cd frontend  
npm test
```

## 🚀 Despliegue

Ver instrucciones en `deploy/instrucciones.md` para:
- Docker Compose
- Render.com
- Vercel + Supabase

## 🔧 API Endpoints

### Autenticación
- `POST /api/register` - Registro de usuario
- `POST /api/login` - Login
- `GET /api/me` - Datos del usuario actual
- `POST /api/logout` - Logout

### Por Rol
- `GET /api/admin/*` - Endpoints de administrador
- `GET /api/tecnico/*` - Endpoints de técnico  
- `GET /api/beneficiario/*` - Endpoints de beneficiario

### Health Checks
- `GET /api/health` - Estado general
- `GET /api/{role}/health` - Estado por rol

## 🐛 Troubleshooting

### Error: supabaseUrl is required
```bash
# Verificar que .env existe y tiene valores correctos
cat backend/.env
```

### Error: JWT_SECRET no configurado
```bash
# Generar nuevo JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend no conecta al backend
```bash
# Verificar que backend corre en puerto 3001
curl http://localhost:3001/api/health
```

## 📞 Soporte

- **Documentación**: Ver carpeta `docs/`
- **Issues**: GitHub Issues
- **Arquitectura**: `docs/arquitectura.md`
- **Roles**: `docs/ROLES.md`

---
**TECHO** - Construyendo dignidad a través de la vivienda 🏠
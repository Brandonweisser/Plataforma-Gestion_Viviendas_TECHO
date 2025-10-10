# Guía de Instalación - Sistema TECHO

## Requisitos Previos

- Node.js 16.0 o superior
- npm 8.0 o superior  
- Cuenta activa en Supabase

## Arquitectura del Sistema

### Backend Desarrollado
Nuestro backend implementa una **arquitectura modular profesional** diseñada para:

```
backend/
├── controllers/     # Lógica de negocio separada
├── middleware/      # Autenticación y autorización
├── models/         # Acceso a datos
├── routes/         # Definición de endpoints
├── services/       # Servicios externos
└── utils/          # Utilidades reutilizables
```

**Beneficios:**
- ✅ Mantenibilidad mejorada
- ✅ Escalabilidad aumentada  
- ✅ Testing simplificado
- ✅ Colaboración en equipo facilitada

## Instalación Paso a Paso

### 1. Preparación del Proyecto

```bash
# Navegar al proyecto
cd "c:\Plataforma-Gestion_Viviendas_TECHO\Fase_2\Evidencias Proyecto"
```

### 2. Configuración del Backend

```bash
# Instalar dependencias
cd backend
npm install

# Crear archivo de configuración
echo "SUPABASE_URL=tu_supabase_url
SUPABASE_SERVICE_ROLE_KEY=tu_service_key
SUPABASE_ANON_KEY=tu_anon_key
JWT_SECRET=tu_jwt_secret
PORT=3001" > .env
```

### 3. Configuración del Frontend

```bash
# Instalar dependencias
cd ../frontend
npm install
```

### 4. Configuración de Base de Datos

1. Acceder al panel de Supabase
2. Ir a SQL Editor
3. Ejecutar SOLO el archivo `database/schema_completo.sql` (incluye todo el esquema y los índices)

### 5. Ejecución del Sistema

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend  
npm start
```

### 6. Acceso al Sistema

- **URL:** http://localhost:3000
- **Admin:** admin@techo.org / admin123
- **Técnico:** tecnico@techo.org / tecnico123
- **Beneficiario:** beneficiario@techo.org / beneficiario123

## Verificación de Instalación

1. Acceder a http://localhost:3000
2. Iniciar sesión con usuario admin
3. Verificar que aparezcan los módulos principales
4. Probar la creación de un proyecto de prueba

## Resolución de Problemas

### Error de conexión a Supabase
- Verificar las variables de entorno en el archivo `.env`
- Confirmar que las credenciales de Supabase sean correctas

### Error de puerto en uso
- Cambiar el puerto en el archivo `.env` (ejemplo: PORT=3002)
- Verificar que no haya otros servicios usando el puerto 3001

### Problemas con la base de datos
- Ejecutar nuevamente el archivo `database/schema_completo.sql`
- Verificar que la cuenta de Supabase tenga permisos administrativos

## Soporte

Para problemas técnicos, revisar:
- Logs del backend en la terminal
- Consola del navegador para errores de frontend
- Panel de Supabase para errores de base de datos
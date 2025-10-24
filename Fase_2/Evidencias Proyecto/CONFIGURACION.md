# Configuración del Sistema TECHO

## Arquitectura del Backend

### Sistema Desarrollado
Nuestro backend implementa una **arquitectura modular profesional** diseñada por el equipo que separa responsabilidades:

- **Controllers**: Lógica de negocio específica por funcionalidad
- **Models**: Acceso a datos y operaciones de base de datos  
- **Routes**: Definición clara de endpoints API
- **Middleware**: Autenticación, autorización y validaciones
- **Utils**: Funciones reutilizables y validaciones

Esta estructura mejora significativamente la mantenibilidad y escalabilidad del sistema.

## Variables de Entorno Requeridas

### Backend (.env)
```env
# Configuración de Supabase
SUPABASE_URL=https://[tu-proyecto].supabase.co
# Clave recomendada: usar la Service Role Key en SUPABASE_KEY (así la usa el backend actualmente).
SUPABASE_KEY=[tu-service-role-key]
SUPABASE_ANON_KEY=[tu-anon-key]

# Configuración JWT
JWT_SECRET=[tu-clave-secreta-jwt]

# Configuración del Servidor
PORT=3001
NODE_ENV=development

# Configuración de Recuperación de Contraseñas
RECOVERY_ALLOWED_ROLES=beneficiario
BCRYPT_SALT_ROUNDS=10

# Storage de Planos (opcional)
# Nombre del bucket de Supabase Storage para guardar planos de templates de postventa.
# Si no se define, el sistema usará 'planos' por defecto.
PLANOS_BUCKET=planos

# Conversión DWG -> PDF (opcional)
# Habilita conversión automática de archivos DWG a PDF vía CloudConvert en el panel de Admin.
# Si no se define, el botón de "Convertir a PDF" no estará disponible.
CLOUDCONVERT_API_KEY=
## (Opcional) Forzar engine de conversión CAD
# CLOUDCONVERT_CAD_ENGINE=cad
# Alternativas posibles: "cad" o "autocad" (esta última requiere planes específicos).
# Si no se define, el backend intentará sin engine y hará fallback automático si CloudConvert rechaza el engine.
```

### Frontend
El frontend se configura automáticamente para conectar con el backend en `http://localhost:3001`.

## Configuración de Supabase

### 1. Crear Proyecto
1. Acceder a https://supabase.com
2. Crear nuevo proyecto
3. Configurar nombre y contraseña de base de datos

### 2. Obtener Credenciales
1. Ir a Settings > API
2. Copiar Project URL
3. Copiar anon/public key
4. Copiar service_role key (mantener segura)

### 3. Ejecutar Schema
1. Ir a SQL Editor en Supabase
2. Ejecutar el archivo `database/schema_completo.sql`
3. Ejecutar el archivo `database/datos_iniciales.sql`

### 4. Configurar Storage
1. Ir a Storage en Supabase
2. Crear bucket público llamado "media"
3. Crear bucket para planos llamado "planos" (o el nombre definido en PLANOS_BUCKET)
4. Configurar políticas de acceso según necesidades

Sugerencia de configuración para el bucket de planos:
- Para simplicidad, se puede dejar el bucket como público y el backend generará URLs públicas.
- Si prefieres URLs firmadas, puedes mantener el bucket privado y el backend intentará generar Signed URLs al listar archivos. En ese caso, asegúrate de que `SUPABASE_SERVICE_ROLE_KEY` esté configurado y accesible en el backend.

Notas:
- El sistema guarda los planos asociados a Templates de Postventa bajo `entity_type = 'postventa_template'` en la tabla `media`.
- Al subir un plano desde el panel de Admin → Templates de Posventa, el archivo se guarda en el bucket de `PLANOS_BUCKET` y se registra su metadata en la tabla `media`.

### Conversión DWG → PDF (opcional)
Si configuras `CLOUDCONVERT_API_KEY`, verás un botón "Convertir a PDF" junto a los archivos .DWG en Admin → Templates de Posventa:
- El backend genera un enlace temporal del DWG y solicita la conversión a CloudConvert.
- Al finalizar, descarga el PDF generado y lo guarda en el mismo bucket de `PLANOS_BUCKET`, registrándolo en `media`.

Notas importantes:
- CloudConvert es un servicio externo con límites/planes. Evalúa costos y límites antes de producción.
- Si deseas una solución 100% on-prem, la conversión DWG→PDF requiere licencias o SDKs específicos (p. ej. Autodesk Forge/Design Automation, ODA Drawings SDK). No se incluye por defecto.

## Configuración de Desarrollo

### Requisitos del Sistema
- Node.js 16.0+
- npm 8.0+
- Navegador moderno (Chrome, Firefox, Safari, Edge)

### Configuración del Entorno
```bash
# Clonar repositorio
git clone [url-repositorio]
cd Plataforma-Gestion_Viviendas_TECHO

# Configurar backend
cd backend
npm install
cp .env.example .env
# Editar .env con valores reales

# Configurar frontend
cd ../frontend
npm install
```

### Scripts Disponibles

#### Backend
```bash
npm start          # Iniciar servidor en modo desarrollo
npm test           # Ejecutar pruebas
npm run test:watch # Ejecutar pruebas en modo watch
```

#### Frontend
```bash
npm start          # Iniciar aplicación en modo desarrollo
npm run build      # Construir para producción
npm test           # Ejecutar pruebas
```

## Configuración de Producción

### Variables de Entorno
```env
NODE_ENV=production
PORT=3001
JWT_SECRET=[clave-segura-aleatoria]
SUPABASE_URL=[url-produccion]
SUPABASE_SERVICE_ROLE_KEY=[key-produccion]
SUPABASE_ANON_KEY=[anon-key-produccion]
```

### Construcción
```bash
# Backend - preparar para despliegue
cd backend
npm ci --only=production

# Frontend - construir para producción
cd frontend
npm run build
```

### Consideraciones de Seguridad
- Usar HTTPS en producción
- Configurar CORS apropiadamente
- Establecer límites de rate limiting
- Configurar logs de seguridad
- Backup regular de base de datos

## Configuración de Base de Datos

### Índices Recomendados
Los índices están incluidos en `schema_completo.sql`, pero para optimización adicional:

```sql
-- Índices adicionales para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_incidencias_fecha_reporte ON incidencias(fecha_reporte DESC);
CREATE INDEX IF NOT EXISTS idx_viviendas_proyecto_estado ON viviendas(id_proyecto, estado);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);
```

### Mantenimiento
- Backup diario automático via Supabase
- Limpieza de tokens expirados semanalmente
- Compresión de logs mensualmente
- Análisis de performance trimestralmente

## Monitoreo y Logs

### Logs del Backend
```bash
# Ver logs en tiempo real
npm start

# Logs de errores
tail -f logs/error.log

# Logs de acceso
tail -f logs/access.log
```

### Métricas Recomendadas
- Tiempo de respuesta de API
- Número de usuarios activos
- Errores por minuto
- Uso de almacenamiento
- Queries lentas de base de datos

## Troubleshooting

### Problemas Comunes

#### Error de conexión a Supabase
```bash
# Verificar conectividad
curl -I https://[tu-proyecto].supabase.co

# Verificar variables de entorno
node -e "console.log(process.env.SUPABASE_URL)"
```

#### Problemas de autenticación
```bash
# Verificar JWT secret
node -e "console.log(process.env.JWT_SECRET?.length)"

# Limpiar tokens en desarrollo
localStorage.clear() # En consola del navegador
```

#### Problemas de rendimiento
```sql
-- Verificar queries lentas en Supabase
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```
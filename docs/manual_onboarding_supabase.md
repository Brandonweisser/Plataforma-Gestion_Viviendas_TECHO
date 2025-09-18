# Onboarding rápido para nuevo colaborador (Supabase + Front/Back)

Este manual te guía para levantar el proyecto en local (Windows/PowerShell), crear tu rama de trabajo y conectar con Supabase sin contratiempos.

## 1) Prerrequisitos
- Node.js 18 o superior (LTS recomendado)
- Git
- Cuenta en Supabase (https://supabase.com)

Opcional (para pruebas): Postman/Insomnia.

## 2) Clonar repo y crear tu rama
```powershell
# Clona tu fork o el repo principal
git clone https://github.com/Brandonweisser/Plataforma-Gestion_Viviendas_TECHO.git
cd Plataforma-Gestion_Viviendas_TECHO

# Crea y cambia a tu rama de trabajo
git checkout -b feature/tu-nombre-onboarding
```

## 3) Instalar dependencias
Ejecuta en cada paquete por separado:
```powershell
# Backend
cd .\backend
npm install

# Frontend
cd ..\frontend
npm install
```

## 4) Crear proyecto en Supabase
1. Entra a https://app.supabase.com y crea un nuevo proyecto (elige la región más cercana).
2. Una vez creado, entra a Project Settings > API y copia:
   - Project URL (URL)
   - service_role key (Service Role secret)

Importante:
- En desarrollo, usa la clave service_role sólo en el servidor (backend). Esta clave omite RLS y debe mantenerse fuera del frontend.
- Para producción, nunca expongas service_role en el navegador.

## 5) Crear la tabla requerida
El backend espera una tabla `usuarios` con una PK numérica `uid` y roles en español.

Abre el SQL Editor de Supabase y pega el contenido de `database/schema_backend.sql` (este archivo está en el repo):
- Crea la tabla con:
  - uid INTEGER PRIMARY KEY
  - nombre TEXT, email TEXT UNIQUE
  - password_hash TEXT
  - columna opcional "contraseña" (legacy) para el script de migración
  - rol CHECK en ('administrador','tecnico','beneficiario')

Nota: Existe `database/schema.sql` pensado para un esquema alternativo (UUID + roles distintos). Para este backend usa `database/schema_backend.sql`.

## 6) Configurar variables de entorno del backend
En `backend/` existe `/.env.example`. Cópialo a `.env` y completa los valores:
```ini
SUPABASE_URL=<tu Project URL>
SUPABASE_KEY=<tu service_role key>
JWT_SECRET=<cadena-aleatoria-segura>
BCRYPT_SALT_ROUNDS=10
MIGRATION_BATCH_SIZE=200
PORT=3001
```

- `SUPABASE_URL` y `SUPABASE_KEY` son obligatorios para conectar a la BD.
- `JWT_SECRET` es obligatorio para emitir/verificar tokens.
- `BCRYPT_SALT_ROUNDS` 10 está bien para dev.

El backend carga `.env` desde su propia carpeta automáticamente.

## 7) Inicializar datos de prueba (opcional)
Puedes crear usuarios de prueba (admin/tecnico/beneficiario) ejecutando desde `backend/`:
```powershell
node .\crearUsuarios.js
```
Este script crea o actualiza usuarios con contraseñas hash.

## 8) Ejecutar el backend
Desde `backend/`:
```powershell
npm start
```
Levanta en `http://localhost:3001` por defecto. Endpoints útiles:
- GET `/api/health` → { ok: true }
- POST `/api/register`
- POST `/api/login`
- GET `/api/me` (con Authorization: Bearer <token>)

## 9) Ejecutar el frontend
Desde `frontend/`:
```powershell
npm start
```
El frontend asume el backend en `http://localhost:3001` por defecto.

Nota: El servicio API lee `VITE_API_URL` si existiera (propio de Vite). Como este proyecto usa Create React App, no necesitas configurar nada; si requieres cambiar la URL, abre `frontend/src/services/api.js` y ajusta la base.

## 10) Correr pruebas
- Backend (desde `backend/`):
```powershell
npm test -- --runInBand
```
- Frontend (desde `frontend/`):
```powershell
npm test
```

## 11) Políticas RLS en Supabase (importante)
- Si usas `service_role` en el backend, RLS no aplica para esas operaciones (recomendado en dev).
- Si usas la `anon key`, deberás desactivar RLS en la tabla `usuarios` o definir políticas que permitan los accesos necesarios. Para evitar fricción en dev, usa `service_role` en el backend.

## 12) Flujo de trabajo con Git
```powershell
# Trabaja y haz commits en tu rama
git add .
git commit -m "feat: tu-cambio"

# Sincroniza periódicamente con la rama remota principal
git fetch origin
# Rebase/merge según el flujo del equipo

# Sube tu rama y abre PR
git push -u origin feature/tu-nombre-onboarding
```

## 13) Problemas comunes y solución
- 500/401 al loguear: revisa que `JWT_SECRET` esté definido en `backend/.env`.
- 500 al acceder a BD: verifica `SUPABASE_URL`/`SUPABASE_KEY` y que la tabla `usuarios` exista con columnas correctas.
- 403 por RLS: usa `service_role` en el backend, o desactiva RLS de `usuarios` para pruebas.
- Rate limiting en login: tras 3 fallos por minuto se bloquea temporalmente; espera 60s o reinicia el servidor en dev.
- Contraseña débil: mínimo 8 caracteres, al menos una letra y un número.

¡Listo! Con esto deberías poder levantar el entorno y colaborar sin trabas.

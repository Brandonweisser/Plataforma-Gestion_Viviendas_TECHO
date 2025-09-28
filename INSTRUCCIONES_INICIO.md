# 🏠 Plataforma de Gestión de Viviendas TECHO - Guía de Inicio

## 📋 Requisitos Previos

- **Node.js** (versión 14 o superior)
- **npm** (incluido con Node.js)
- Conexión a internet para acceder a la base de datos Supabase

## 🚀 Pasos para Iniciar el Proyecto

### 1. **Preparar el Backend**

Abre una **primera terminal** y ejecuta:

```bash
# Navegar al directorio del backend
cd \backend

# Iniciar el servidor backend
node server.js
```

**✅ Resultado esperado:**
```
Server running on port 3001
```

### 2. **Preparar el Frontend**

Abre una **segunda terminal** y ejecuta:

```bash
# Navegar al directorio del frontend
cd \frontend

# Iniciar el servidor de desarrollo
npm start
```

**✅ Resultado esperado:**
- Se abrirá automáticamente el navegador en `http://localhost:3000`
- Verás la página de login de la aplicación

### 3. **Acceder a la Aplicación**

Una vez que ambos servidores estén ejecutándose:

- **URL de la aplicación:** `http://localhost:3000`
- **URL de la API:** `http://localhost:3001`

## 👥 Cuentas de Usuario Disponibles

### 🔵 **Administrador**
- **Email:** `admin@techo.org`
- **Contraseña:** `admin123`
- **Funciones:** Gestión completa del sistema, usuarios, viviendas e incidencias

### 🔵 **Administrador 2**
- **Email:** `ad.min@techo.org`
- **Contraseña:** `admin123`
- **Funciones:** Gestión completa del sistema, usuarios, viviendas e incidencias

### 🟠 **Técnico**
- **Email:** `tecnico@techo.org`
- **Contraseña:** `tecnico123`
- **Funciones:** Gestión técnica, asignación de tareas, seguimiento de reparaciones

### 🟢 **Beneficiario**
- **Email:** `beneficiario@techo.org`
- **Contraseña:** `beneficiario123`
- **Funciones:** Consulta personal, reporte de incidencias, seguimiento de solicitudes


```
Plataforma-Gestion_Viviendas_TECHO-2/
├── backend/                 # Servidor Node.js + Express
│   ├── server.js           # Archivo principal del servidor
│   ├── .env               # Variables de entorno (Supabase)
│   └── package.json       # Dependencias del backend
├── frontend/               # Aplicación React
│   ├── src/               # Código fuente
│   ├── public/            # Archivos estáticos
│   └── package.json       # Dependencias del frontend
└── database/              # Scripts de base de datos
```

## 🔧 Comandos Útiles

### Backend
```bash
# Instalar dependencias
npm install

# Iniciar servidor
node server.js

# Probar conexión a base de datos
node testConnection.js
```

### Frontend
```bash
# Instalar dependencias
npm install

# Iniciar en desarrollo
npm start

# Crear build de producción
npm run build
```

## 🌐 Puertos Utilizados

- **Frontend:** `http://localhost:3000`
- **Backend:** `http://localhost:3001`

## ⚠️ Notas Importantes

1. **Mantener ambos servidores ejecutándose:** El frontend (puerto 3000) y el backend (puerto 3001) deben estar corriendo simultáneamente.

2. **No cerrar las terminales:** Mantén abiertas las dos ventanas de terminal donde ejecutaste los servidores.

3. **Orden de inicio:** Aunque no es estrictamente necesario, es recomendable iniciar primero el backend y luego el frontend.

4. **Recarga automática:** El frontend se recarga automáticamente al hacer cambios en el código. El backend requiere reinicio manual.

## 🎯 Próximos Pasos

Una vez que tengas la aplicación ejecutándose:

1. Prueba las diferentes cuentas de usuario
2. Explora las funcionalidades de cada rol
3. Verifica que los colores de interfaz cambien según el rol
4. Prueba la funcionalidad de logout

---

**¡La aplicación está lista para usar!** 🎉

Si encuentras algún problema, revisa que ambos servidores estén ejecutándose y que las credenciales de la base de datos sean correctas.
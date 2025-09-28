# 🔐 Implementación: Registro con RUT y Recuperación de Contraseña

Este documento describe la implementación de dos nuevas funcionalidades:

1. **Registro con RUT único** - Solo beneficiarios pueden registrarse
2. **Recuperación de contraseña** - Sistema de códigos por email

## 📋 Cambios Implementados

### Backend
- ✅ Validación de RUT chileno con dígito verificador
- ✅ Campo RUT único en base de datos
- ✅ Registro restringido solo a beneficiarios
- ✅ Tabla `password_recovery_codes` para códigos temporales
- ✅ Endpoints `/api/forgot-password` y `/api/reset-password`
- ✅ Función de envío de emails (simulada en consola)

### Frontend
- ✅ Formulario de registro actualizado con campo RUT
- ✅ Validación de RUT en el cliente
- ✅ Página "Olvidé mi contraseña" (`/forgot-password`)
- ✅ Página "Restablecer contraseña" (`/reset-password`)
- ✅ Integración completa con backend

### Base de Datos
- ✅ Migración `010_password_recovery.sql` creada
- ✅ Índice único para RUT
- ✅ Tabla de códigos con expiración automática

## 🚀 Pasos para Implementar

### 1. Ejecutar Migración de Base de Datos
```sql
-- En el SQL Editor de Supabase, ejecutar:
-- database/010_password_recovery.sql
```

### 2. Probar Backend
```bash
cd backend
node test-new-features.js  # Opcional: probar funcionalidades
node server.js             # Iniciar servidor
```

### 3. Probar Frontend
```bash
cd frontend
npm start                  # Iniciar aplicación
```

## 📱 Flujos de Usuario

### Registro de Beneficiario
1. Usuario va a `/registro`
2. Completa: nombre, email, **RUT**, dirección (opcional), contraseñas
3. Sistema valida RUT único y formato válido
4. Se crea cuenta automáticamente como "beneficiario"
5. Redirección a dashboard de beneficiario

### Recuperación de Contraseña
1. Usuario hace clic en "¿Olvidaste tu contraseña?" en login
2. Ingresa su email en `/forgot-password`
3. Sistema envía código de 6 dígitos (válido por 15 minutos)
4. Usuario ingresa código en `/reset-password`
5. Define nueva contraseña y confirma
6. Sistema actualiza contraseña y redirige a login

## 🔧 Validaciones Implementadas

### RUT Chileno
```javascript
// Formato: 12345678-9 o 123456789
// Validación matemática del dígito verificador
// Único por usuario en base de datos
```

### Códigos de Recuperación
- ⏰ **Duración**: 15 minutos
- 🔢 **Formato**: 6 dígitos numéricos
- 🔒 **Uso único**: Se marcan como usados después del cambio
- 🧹 **Limpieza**: Función disponible para eliminar códigos expirados

## 📧 Sistema de Email

**Estado Actual**: Simulado en consola del servidor
```javascript
// TODO: Integrar con servicio real
// Opciones: SendGrid, AWS SES, Nodemailer + SMTP
```

**Para producción**, configurar un servicio real de email:
```javascript
// En backend/app.js, función sendRecoveryEmail()
// Reemplazar console.log con llamada a API de email
```

## 🔒 Seguridad

### Prevención de Fuerza Bruta
- ✅ Rate limiting en login (3 intentos/minuto)
- ✅ Códigos temporales (15 min expiración)
- ✅ Validación servidor + cliente

### Información Sensible
- ✅ Respuestas genéricas ("Si el correo existe...")
- ✅ Códigos de uso único
- ✅ Validación de expiración

## 🧪 Usuarios de Prueba

| Email | Contraseña | RUT | Rol |
|-------|------------|-----|-----|
| carlos.gonzalez@email.com | techo123 | 45678901-2 | beneficiario |
| patricia.lopez@email.com | techo123 | 56789012-3 | beneficiario |

## ⚠️ Restricciones

### Solo Beneficiarios
- Admins y técnicos se crean **internamente**
- Endpoint `/api/register` forzado a rol "beneficiario"
- Frontend adaptado para beneficiarios únicamente

### RUT Obligatorio
- Campo requerido en registro
- Validación matemática del dígito verificador
- Único por usuario (no se puede repetir)

## 📝 Logs de Desarrollo

Durante desarrollo, el sistema muestra en consola:
```
📧 Enviando código de recuperación:
Para: usuario@email.com
Código: 123456
Nombre: Usuario Ejemplo
El código expira en 15 minutos
```

## 🔄 Próximos Pasos Sugeridos

1. **Integración de Email Real**
   - SendGrid API
   - Templates profesionales
   - Tracking de entregas

2. **Mejoras UX**
   - Loading states mejorados
   - Validación en tiempo real de RUT
   - Timer de expiración visible

3. **Administración**
   - Panel admin para ver códigos pendientes
   - Estadísticas de recuperaciones
   - Limpieza automática de códigos

## 📊 Testing

Ejecutar tests existentes:
```bash
# Backend
cd backend
npm test

# Frontend  
cd frontend
npm test
```

Los tests actuales cubren las funcionalidades básicas. Se recomienda agregar tests específicos para RUT y recuperación de contraseña.
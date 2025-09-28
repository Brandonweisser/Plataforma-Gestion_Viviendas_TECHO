# 📧 Guía de Configuración de Email Real

Esta guía te muestra cómo configurar diferentes proveedores de email para enviar códigos de recuperación reales.

## 🚀 Configuración Rápida

Edita el archivo `backend/.env` y agrega la configuración de tu proveedor preferido:

### 📨 1. Gmail (Recomendado - Gratis)

```env
EMAIL_PROVIDER=gmail
EMAIL_USER=tu-email@gmail.com
EMAIL_APP_PASSWORD=abcd-efgh-ijkl-mnop
EMAIL_MODE=production
```

**Pasos para obtener App Password de Gmail:**
1. Ve a [Configuración de Google](https://myaccount.google.com/)
2. Seguridad → Verificación en 2 pasos (debe estar activada)
3. Contraseñas de aplicaciones → Generar nueva
4. Copia la contraseña de 16 caracteres
5. Úsala en `EMAIL_APP_PASSWORD`

### 🔵 2. Outlook/Hotmail (Gratis)

```env
EMAIL_PROVIDER=outlook
EMAIL_USER=tu-email@outlook.com
EMAIL_PASSWORD=tu-contraseña-normal
EMAIL_MODE=production
```

⚠️ Nota: Microsoft está deshabilitando la autenticación básica (usuario/contraseña SMTP) en algunas cuentas. Si recibes el error:

```
535 5.7.139 Authentication unsuccessful, basic authentication is disabled
```

significa que tu cuenta requiere OAuth2 moderno y este método no funcionará. En ese caso usa otro proveedor (por ejemplo Brevo, Resend, SendGrid, Mailgun) o pasa a modo desarrollo temporalmente.

### 📮 3. SendGrid (Profesional – puede rechazar cuentas nuevas)

```env
EMAIL_PROVIDER=sendgrid
EMAIL_USER=tu-email@tudominio.com
SENDGRID_API_KEY=SG.tu-api-key-aqui
EMAIL_MODE=production
```

**Pasos para SendGrid:**
1. Regístrate en [SendGrid](https://sendgrid.com)
2. Crea una API Key en Settings → API Keys
3. Verifica tu dominio de envío
4. Usa la API Key en la configuración

### ✉️ 4. Brevo (antes Sendinblue) – Alternativa estable

```env
EMAIL_PROVIDER=brevo
BREVO_SMTP_USER=tu-email-verificado@dominio.com  # o usar EMAIL_USER
BREVO_SMTP_KEY=tu_api_key_smtp
EMAIL_USER=tu-email-verificado@dominio.com
EMAIL_MODE=production
```

Pasos:
1. https://www.brevo.com → crear cuenta
2. Activar remitente (Transactional → Senders & IP → Senders)
3. Obtener SMTP Key (Transactional → SMTP & API → Create a key)
4. Pegar en `BREVO_SMTP_KEY`

### 🚀 5. Resend (muy simple, rápido para prototipos)

```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
EMAIL_USER=notificaciones@tudominio.com  # remitente que configuraste en Resend
EMAIL_MODE=production
```

Pasos:
1. https://resend.com → crear cuenta
2. Domains → añadir dominio o usar sandbox (sandbox requiere agregar destinatarios autorizados)
3. Generar API Key (Project settings → API Keys)

### ⚙️ 6. SMTP Personalizado

```env
EMAIL_PROVIDER=smtp
EMAIL_USER=tu-email@tudominio.com
EMAIL_PASSWORD=tu-contraseña
SMTP_HOST=smtp.tuservidor.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_MODE=production
```

## 🧪 Modo Desarrollo

Para testing sin envío real:

```env
EMAIL_MODE=development
# No configurar EMAIL_USER dejará el modo consola
```

## ✅ Verificación

Después de configurar, reinicia el servidor:

```bash
cd backend
node server.js
```

Deberías ver:
```
📧 Verificando configuración de email...
✅ Configuración de email verificada correctamente
```

## 📨 Templates de Email

El sistema envía emails con diseño profesional que incluye:
- ✅ Logo de TECHO
- ✅ Código destacado visualmente
- ✅ Información de expiración
- ✅ Instrucciones claras
- ✅ Versión HTML y texto plano

## 🔒 Seguridad

- **App Passwords**: Más seguro que contraseñas normales
- **Encriptación**: Conexiones SMTP seguras
- **Fallback**: Si falla el envío, muestra en consola
- **Rate Limiting**: Previene spam

## ❓ Troubleshooting

### Error "Authentication failed"
- Verifica credenciales
- Para Gmail, usa App Password, no contraseña normal
- Activa verificación en 2 pasos

### Error "Connection timeout"
- Verifica SMTP_HOST y SMTP_PORT
- Revisa firewall/antivirus
- Prueba con SMTP_SECURE=true para puerto 465

### Emails no llegan
- Revisa carpeta spam
- Verifica dominio no esté en blacklist
- Para producción, configura SPF/DKIM

## 🚀 Proveedores Recomendados

### Para Desarrollo/Testing:
1. **Gmail** - Fácil de configurar, gratis
2. **Outlook** - Sin configuración adicional

### Para Producción:
1. **SendGrid** - Profesional, estadísticas detalladas
2. **AWS SES** - Integración con AWS
3. **Mailgun** - API simple y potente

## 💡 Ejemplo de Uso

Una vez configurado, el flujo será:

1. Usuario solicita recuperar contraseña
2. Backend genera código de 6 dígitos
3. **Email real enviado** con template profesional
4. Usuario recibe email en su bandeja
5. Ingresa código y cambia contraseña

¡El sistema está completamente listo! Solo configura tu proveedor preferido. 🎉
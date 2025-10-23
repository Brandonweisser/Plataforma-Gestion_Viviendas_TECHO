import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Servicio de envío de emails
 * Soporta múltiples proveedores de em    console.log(`MODO DESARROLLO - Código de recuperación:`)
    console.log(`Para: ${email}`)
    console.log(`Código: ${codigo}`)
    console.log(`Nombre: ${nombre}`)
    console.log(`El código expira en 5 minutos`)
    console.log(`\nPara envío real, configura las variables de email en .env`)*/

// Configuración de transportadores
const createTransporter = () => {
  const emailProvider = process.env.EMAIL_PROVIDER || 'gmail'
  
  switch (emailProvider.toLowerCase()) {
    case 'gmail':
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD // App Password de Gmail
        }
      })
      
    case 'outlook':
      return nodemailer.createTransport({
        service: 'hotmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      })
      
    case 'smtp':
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      })
      
    case 'sendgrid':
      return nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      })
    case 'brevo': // Sendinblue/Brevo
      return nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.BREVO_SMTP_USER || process.env.EMAIL_USER, // normalmente el email de la cuenta
          pass: process.env.BREVO_SMTP_KEY // API Key SMTP
        }
      })
    case 'resend': // Uso vía SMTP (alternativa rápida, también tiene API HTTP)
      return nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 587,
        secure: false,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY
        }
      })
      
    default:
      throw new Error(`Proveedor de email no soportado: ${emailProvider}`)
  }
}

// Template de email para código de recuperación
const createRecoveryEmailTemplate = (nombre, codigo) => {
  return {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://cl.techo.org/wp-content/uploads/sites/9/2021/11/LOGO-TECHO-COLOR-768x768.png" 
                 alt="TECHO" style="width: 80px; height: 80px;">
            <h1 style="color: #1e40af; margin: 20px 0 10px 0;">TECHO Chile</h1>
            <h2 style="color: #4b5563; margin: 0; font-weight: normal;">Recuperación de Contraseña</h2>
          </div>
          
          <div style="margin-bottom: 30px;">
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              Hola <strong>${nombre}</strong>,
            </p>
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              Has solicitado restablecer tu contraseña en la Plataforma de Gestión de Viviendas de TECHO.
            </p>
            <p style="color: #374151; line-height: 1.6; margin-bottom: 30px;">
              Tu código de verificación es:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background-color: #dbeafe; border: 2px dashed #1e40af; border-radius: 8px; padding: 20px; margin: 0 auto;">
                <span style="font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 5px;">${codigo}</span>
              </div>
            </div>
            
            <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                ⚠️ <strong>Este código expira en 5 minutos</strong> por seguridad.
              </p>
            </div>
            
            <p style="color: #374151; line-height: 1.6; margin: 20px 0;">
              Ingresa este código en la página de recuperación para establecer tu nueva contraseña.
            </p>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
              Si no solicitaste este código, puedes ignorar este correo. Tu contraseña permanecerá sin cambios.
            </p>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 15px 0 0 0;">
              — Equipo TECHO Chile
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Este es un correo automático, por favor no responder.
          </p>
        </div>
      </div>
    `,
    text: `
Hola ${nombre},

Has solicitado restablecer tu contraseña en TECHO Chile.

Tu código de verificación es: ${codigo}

Este código expira en 5 minutos por seguridad.

Ingresa este código en la página de recuperación para establecer tu nueva contraseña.

Si no solicitaste este código, puedes ignorar este correo.

— Equipo TECHO Chile
    `
  }
}

/**
 * Enviar email de recuperación de contraseña
 */
export async function sendRecoveryEmail(email, codigo, nombre = '') {
  // Si no está configurado el email, usar modo desarrollo (consola)
  if (!process.env.EMAIL_USER || process.env.EMAIL_MODE === 'development') {
    console.log(`MODO DESARROLLO - Código de recuperación:`)
    console.log(`Para: ${email}`)
    console.log(`Código: ${codigo}`)
    console.log(`Nombre: ${nombre}`)
    console.log(`El código expira en 5 minutos`)
    console.log(`\nPara envío real, configura las variables de email en .env`)
    return true
  }

  try {
    const transporter = createTransporter()
    const emailTemplate = createRecoveryEmailTemplate(nombre, codigo)
    
    const mailOptions = {
      from: {
        name: 'TECHO Chile - Plataforma de Gestión',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: `Código de recuperación: ${codigo} - TECHO Chile`,
      html: emailTemplate.html,
      text: emailTemplate.text
    }

    console.log(`Enviando email de recuperación a: ${email}`)
    const result = await transporter.sendMail(mailOptions)
    console.log(`Email enviado exitosamente. ID: ${result.messageId}`)
    
    return true
  } catch (error) {
    console.error('Error enviando email:', error.message)
    
    // En caso de error, mostrar en consola como fallback
    console.log(`FALLBACK - Mostrando código en consola:`)
    console.log(`Para: ${email}`)
    console.log(`Código: ${codigo}`)
    console.log(`Nombre: ${nombre}`)
    
    // No hacer throw del error para no interrumpir el flujo de recuperación
    return false
  }
}

/**
 * Verificar configuración de email
 */
export async function verifyEmailConfig() {
  const mode = process.env.EMAIL_MODE || 'development'
  const provider = (process.env.EMAIL_PROVIDER || 'gmail').toLowerCase()

  if (mode === 'development') {
    console.log('EMAIL_MODE=development - no se realizará verificación SMTP. Los códigos se mostrarán en consola.')
    return false
  }

  if (!process.env.EMAIL_USER) {
    console.log('Falta EMAIL_USER. Define un remitente (ej: tu-email@gmail.com). Actualmente no se enviarán correos.')
    return false
  }

  // Validar variables mínimas según proveedor antes de intentar conectar
  const missing = []
  if (provider === 'gmail' && !process.env.EMAIL_APP_PASSWORD) missing.push('EMAIL_APP_PASSWORD (App Password de Gmail)')
  if (provider === 'outlook' && !process.env.EMAIL_PASSWORD) missing.push('EMAIL_PASSWORD (contraseña de Outlook)')
  if (provider === 'smtp') {
    if (!process.env.SMTP_HOST) missing.push('SMTP_HOST')
    if (!process.env.SMTP_PORT) missing.push('SMTP_PORT')
    if (!process.env.EMAIL_PASSWORD) missing.push('EMAIL_PASSWORD')
  }
  if (provider === 'sendgrid' && !process.env.SENDGRID_API_KEY) missing.push('SENDGRID_API_KEY')
  if (provider === 'brevo') {
    if (!process.env.BREVO_SMTP_KEY) missing.push('BREVO_SMTP_KEY (API Key SMTP de Brevo)')
    if (!process.env.BREVO_SMTP_USER && !process.env.EMAIL_USER) missing.push('BREVO_SMTP_USER o EMAIL_USER (remitente)')
  }
  if (provider === 'resend' && !process.env.RESEND_API_KEY) missing.push('RESEND_API_KEY')

  if (missing.length) {
    console.log('Faltan variables para el proveedor seleccionado (' + provider + '):')
    for (const v of missing) console.log('   - ' + v)
    console.log('Completa estas variables y reinicia el servidor.')
    return false
  }

  try {
    const transporter = createTransporter()
    await transporter.verify()
    console.log('Configuración de email verificada correctamente (proveedor: ' + provider + ')')
    return true
  } catch (error) {
    console.error('Error en configuración de email:', error.message)
    console.log('Revisa las variables de entorno de email en .env o cambia EMAIL_MODE=development para pruebas.')
    return false
  }
}

/**
 * Enviar email de invitación con enlace
 */
export async function sendInvitationEmail(email, { nombre = '', rol = 'usuario', acceptUrl }) {
  if (!process.env.EMAIL_USER || process.env.EMAIL_MODE === 'development') {
    console.log('MODO DESARROLLO - Invitación:')
    console.log(`Para: ${email}`)
    console.log(`Nombre: ${nombre}`)
    console.log(`Rol: ${rol}`)
    console.log(`URL de aceptación: ${acceptUrl}`)
    return true
  }

  try {
    const transporter = createTransporter()
    const mailOptions = {
      from: {
        name: 'TECHO Chile - Invitaciones',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Invitación a Plataforma TECHO',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #1e40af;">Invitación a la Plataforma de Gestión</h2>
            <p>Hola ${nombre || ''}, has sido invitado con rol <strong>${rol}</strong>.</p>
            <p>Para activar tu cuenta, haz clic en el siguiente enlace:</p>
            <p><a href="${acceptUrl}" style="display:inline-block;background:#1e40af;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Aceptar invitación</a></p>
            <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <p><a href="${acceptUrl}">${acceptUrl}</a></p>
          </div>
        </div>
      `,
      text: `Has sido invitado a TECHO con rol ${rol}. Acepta aquí: ${acceptUrl}`
    }
    await transporter.sendMail(mailOptions)
    return true
  } catch (err) {
    console.error('Error enviando invitación:', err.message)
    console.log('FALLBACK - Invitación en consola:', acceptUrl)
    return false
  }
}
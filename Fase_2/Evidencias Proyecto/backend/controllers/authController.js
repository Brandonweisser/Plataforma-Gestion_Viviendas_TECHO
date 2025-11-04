/**
 * Controlador de Autenticación
 * Plataforma de Gestión de Viviendas TECHO
 *
 * Maneja registro, login, logout y recuperación de contraseñas
 */

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {
  findUserByEmail,
  findUserByRut,
  getLastUser,
  insertUser,
  getUserById,
  updateUser,
} from "../models/User.js";
import {
  storeRecoveryCode,
  validateRecoveryCode,
  markRecoveryCodeAsUsed,
} from "../models/PasswordRecovery.js";
import { sendRecoveryEmail } from "../services/EmailService.js";
import {
  isStrongPassword,
  isValidRutFormat,
  normalizeRut,
} from "../utils/validation.js";
import nodemailer from "nodemailer";
import auditMiddleware from "../middleware/auditMiddleware.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);

// Roles permitidos para recuperación de contraseña (configurable vía env)
const ALLOWED_RECOVERY_ROLES = (
  process.env.RECOVERY_ALLOWED_ROLES || "beneficiario"
)
  .split(",")
  .map((r) => r.trim().toLowerCase())
  .filter(Boolean);

/**
 * Genera un código de recuperación de 6 dígitos
 * @returns {string} Código numérico de 6 dígitos
 */
function generateRecoveryCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Normaliza el rol para comparaciones consistentes
 * @param {string} role - Rol a normalizar
 * @returns {string} Rol normalizado
 */
function normalizeRole(role) {
  if (!role || typeof role !== "string") return "";
  return role.toLowerCase().trim();
}

/**
 * Valida formato de RUT chileno
 * @param {string} rut - RUT a validar
 * @returns {boolean} True si es válido
 */
function validateRut(rut) {
  return isValidRutFormat(rut);
}

/**
 * Registro de nuevos usuarios (solo beneficiarios)
 */
export async function registerUser(req, res) {
  try {
    const nombre = req.body.nombre || req.body.name;
    const { email, password, rut, direccion } = req.body;

    // Validar campos requeridos
    if (!nombre || !email || !password || !rut) {
      return res.status(400).json({
        success: false,
        message:
          "Faltan campos requeridos: nombre, email, contraseña y RUT son obligatorios",
      });
    }

    // Validar fortaleza de contraseña
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Contraseña débil: mínimo 8 caracteres, al menos una letra y un número.",
      });
    }

    // Validar formato de RUT
    if (!validateRut(rut)) {
      return res.status(400).json({
        success: false,
        message: "RUT inválido. Ingrese un RUT válido (ej: 12345678-9)",
      });
    }

    const emailLower = email.toLowerCase();
    const rutClean = normalizeRut(rut);

    // Verificar que el email no esté registrado
    const existingByEmail = await findUserByEmail(emailLower);
    if (existingByEmail) {
      return res.status(409).json({
        success: false,
        message: "El correo electrónico ya está registrado",
      });
    }

    // Verificar que el RUT no esté registrado
    const existingByRut = await findUserByRut(rutClean);
    if (existingByRut) {
      return res.status(409).json({
        success: false,
        message: "El RUT ya está registrado",
      });
    }

    // Encriptar contraseña
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Solo permitir registro como beneficiario
    const rolValido = "beneficiario";

    // Generar nuevo UID
    let newUid = 1;
    try {
      const last = await getLastUser();
      if (last && Number.isFinite(Number(last.uid))) {
        newUid = Number(last.uid) + 1;
      }
    } catch (_) {
      // Ignorar error y usar UID por defecto
    }

    // Crear usuario en la base de datos
    const insertado = await insertUser({
      uid: newUid,
      nombre,
      email: emailLower,
      rol: rolValido,
      password_hash,
      rut: rutClean,
      direccion: direccion || null,
    });

    // Verificar configuración JWT
    if (!JWT_SECRET) {
      return res.status(200).json({
        success: true,
        token: null,
        message: "Usuario creado. Falta configurar JWT_SECRET",
      });
    }

    // Generar token de autenticación
    const token = jwt.sign(
      {
        sub: insertado.uid,
        uid: insertado.uid,
        email: emailLower,
        rol: insertado.rol,
        rut: insertado.rut,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token,
      message: "Cuenta creada exitosamente",
    });
  } catch (error) {
    console.error("Error en registro:", error);
    return res.status(500).json({
      success: false,
      message: "Error en el servidor",
    });
  }
}

/**
 * Login de usuarios
 */
export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Faltan credenciales",
      });
    }

    const usuario = await findUserByEmail(email.toLowerCase());
    if (!usuario) {
      if (process.env.DEBUG_AUTH === "1") {
        console.log(
          `[LOGIN][DEBUG] Email no encontrado: ${email.toLowerCase()}`
        );
      }
      // Registrar intento fallido
      await auditMiddleware.logAudit({
        req,
        actor_uid: null,
        actor_email: email.toLowerCase(),
        actor_rol: null,
        action: 'auth.login.failed',
        entity_type: 'user',
        entity_id: null,
        details: { reason: 'email_not_found' }
      });
      return res.status(401).json({
        success: false,
        message: "Correo o contraseña incorrectos",
      });
    }

    const stored = usuario.password_hash || "";
    if (process.env.DEBUG_AUTH === "1") {
      console.log(
        `[LOGIN][DEBUG] Intento login email=${usuario.email} rol=${
          usuario.rol
        } hasHash=${stored.startsWith("$2")}`
      );
    }

    // Verificar contraseña
    const passwordMatch =
      stored && stored.startsWith("$2")
        ? await bcrypt.compare(password, stored)
        : false;

    if (!passwordMatch) {
      if (process.env.DEBUG_AUTH === "1") {
        console.log("[LOGIN][DEBUG] Password mismatch (o hash ausente)");
      }
      // Registrar intento fallido
      await auditMiddleware.logAudit({
        req,
        actor_uid: usuario.uid,
        actor_email: usuario.email,
        actor_rol: usuario.rol,
        action: 'auth.login.failed',
        entity_type: 'user',
        entity_id: usuario.uid,
        details: { reason: 'invalid_password' }
      });
      return res.status(401).json({
        success: false,
        message: "Correo o contraseña incorrectos",
      });
    }

    // Verificar configuración JWT
    if (!JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT_SECRET no configurado en el servidor",
      });
    }

    // Generar token
    const token = jwt.sign(
      {
        sub: usuario.uid,
        uid: usuario.uid,
        email: usuario.email,
        rol: usuario.rol,
        rut: usuario.rut,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Registrar login exitoso
    await auditMiddleware.logAudit({
      req,
      actor_uid: usuario.uid,
      actor_email: usuario.email,
      actor_rol: usuario.rol,
      action: 'auth.login.success',
      entity_type: 'user',
      entity_id: usuario.uid,
      details: { rol: usuario.rol }
    });

    return res.json({ success: true, token });
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({
      success: false,
      message: "Error en el servidor",
    });
  }
}

/**
 * Obtener información del usuario autenticado
 */
export async function getMe(req, res) {
  try {
    const userId = req.user?.uid || req.user?.sub;
    const data = await getUserById(userId);
    res.json({ success: true, data });
  } catch (error) {
    console.error("❌ Error en /api/me:", error);
    res.status(500).json({
      success: false,
      message: "No se pudo obtener el usuario",
    });
  }
}

/**
 * Logout (stateless)
 */
export async function logoutUser(req, res) {
  // En arquitectura stateless sólo indicamos al cliente que elimine el token
  return res.json({
    success: true,
    message: "Sesión cerrada",
  });
}

/**
 * Solicitar código de recuperación de contraseña
 */
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "El correo electrónico es requerido",
      });
    }

    const emailLower = email.toLowerCase();
    console.log(`[FORGOT] Solicitud de recuperación para: ${emailLower}`);

    const usuario = await findUserByEmail(emailLower);

    if (!usuario) {
      console.log(`[FORGOT] Usuario no encontrado. (No se genera código)`);
      // Por seguridad, no revelamos si el email existe o no
      return res.json({
        success: true,
        message: "Si el correo existe, recibirás un código de recuperación",
      });
    }

    // Validar rol permitido según configuración
    if (!ALLOWED_RECOVERY_ROLES.includes(usuario.rol)) {
      console.log(
        `[FORGOT] Usuario encontrado con rol='${
          usuario.rol
        }' no permitido. Roles permitidos: ${ALLOWED_RECOVERY_ROLES.join(", ")}`
      );
      return res.json({
        success: true,
        message: "Si el correo existe, recibirás un código de recuperación",
      });
    }

    // Generar y almacenar código de recuperación
    const code = generateRecoveryCode();
    await storeRecoveryCode(emailLower, code);
    await sendRecoveryEmail(emailLower, code, usuario.nombre);

    if (process.env.EMAIL_MODE === "development") {
      console.log(`[FORGOT] Código generado para ${emailLower}: ${code}`);
    }

    return res.json({
      success: true,
      message: "Si el correo existe, recibirás un código de recuperación",
    });
  } catch (error) {
    console.error("Error en forgot-password:", error);
    return res.status(500).json({
      success: false,
      message: "Error en el servidor",
    });
  }
}

/**
 * Restablecer contraseña con código de recuperación
 */
export async function resetPassword(req, res) {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, código y nueva contraseña son requeridos",
      });
    }

    // Validar fortaleza de nueva contraseña
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Contraseña débil: mínimo 8 caracteres, al menos una letra y un número.",
      });
    }

    const emailLower = email.toLowerCase();

    // Validar código de recuperación
    const recoveryData = await validateRecoveryCode(emailLower, code);
    if (!recoveryData) {
      return res.status(400).json({
        success: false,
        message: "Código inválido o expirado",
      });
    }

    // Buscar usuario
    const usuario = await findUserByEmail(emailLower);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Encriptar nueva contraseña
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Actualizar contraseña en la base de datos
    await updateUser(usuario.uid, { password_hash: newPasswordHash });

    // Marcar código como usado
    await markRecoveryCodeAsUsed(emailLower, code);

    console.log(
      `[RESET] Contraseña actualizada exitosamente para: ${emailLower}`
    );

    return res.json({
      success: true,
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error en reset-password:", error);
    return res.status(500).json({
      success: false,
      message: "Error en el servidor",
    });
  }
}

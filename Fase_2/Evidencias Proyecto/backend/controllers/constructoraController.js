import {
  getAllConstructoras,
  getConstructoraById,
  createConstructora,
  updateConstructora,
  deleteConstructora,
  assignConstructoraToUser,
  removeConstructoraFromUser,
} from "../models/Constructora.js";
import { getUserById } from "../models/User.js";
import { getUsersByConstructora } from "../models/Constructora.js";

/** Listar todas las constructoras */
export async function listConstructoras(req, res) {
  try {
    const data = await getAllConstructoras();
    res.json({ success: true, data });
  } catch (error) {
    console.error(
      "[ADMIN][CONSTRUCTORAS] Error listando:",
      error.message || error
    );
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Error listando constructoras",
      });
  }
}

export async function getConstructora(req, res) {
  try {
    const { id } = req.params;
    const data = await getConstructoraById(id);
    if (!data)
      return res
        .status(404)
        .json({ success: false, message: "Constructora no encontrada" });
    res.json({ success: true, data });
  } catch (error) {
    console.error(
      "[ADMIN][CONSTRUCTORA] Error obteniendo:",
      error.message || error
    );
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Error obteniendo constructora",
      });
  }
}

export async function createNewConstructora(req, res) {
  try {
    const raw = req.body || {};
    // Normalizar campos posibles: aceptar tanto `contacto_email` como `email_contacto`
    const payload = {
      nombre: raw.nombre,
      rut: raw.rut || null,
      contacto_email: raw.contacto_email || raw.email_contacto || null,
      telefono: raw.telefono || null,
      direccion: raw.direccion || null,
    };

    if (!payload.nombre || !String(payload.nombre).trim()) {
      return res
        .status(400)
        .json({ success: false, message: 'El campo "nombre" es obligatorio' });
    }

    const data = await createConstructora({
      nombre: String(payload.nombre).trim(),
      rut: payload.rut,
      contacto_email: payload.contacto_email,
      telefono: payload.telefono,
      direccion: payload.direccion,
    });
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error(
      "[ADMIN][CONSTRUCTORA] Error creando:",
      error.message || error
    );
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Error creando constructora",
      });
  }
}

export async function updateConstructoraById(req, res) {
  try {
    const { id } = req.params;
    const updatesRaw = req.body || {};
    if (updatesRaw.nombre !== undefined && !String(updatesRaw.nombre).trim()) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'El campo "nombre" no puede estar vacío',
        });
    }

    // Normalizar posibles variantes de campo
    const updates = {};
    if (updatesRaw.nombre !== undefined)
      updates.nombre = String(updatesRaw.nombre).trim();
    if (updatesRaw.rut !== undefined) updates.rut = updatesRaw.rut;
    // aceptar tanto `contacto_email` como `email_contacto`
    if (updatesRaw.contacto_email !== undefined)
      updates.contacto_email = updatesRaw.contacto_email;
    if (updatesRaw.email_contacto !== undefined)
      updates.contacto_email = updatesRaw.email_contacto;
    if (updatesRaw.telefono !== undefined)
      updates.telefono = updatesRaw.telefono;
    if (updatesRaw.direccion !== undefined)
      updates.direccion = updatesRaw.direccion;

    const data = await updateConstructora(id, updates);
    res.json({ success: true, data });
  } catch (error) {
    console.error(
      "[ADMIN][CONSTRUCTORA] Error actualizando:",
      error.message || error
    );
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Error actualizando constructora",
      });
  }
}

export async function deleteConstructoraById(req, res) {
  try {
    const { id } = req.params;
    // intentar eliminar (el modelo se encargará de limpiar asignaciones)
    await deleteConstructora(id);
    res.json({ success: true });
  } catch (error) {
    console.error(
      "[ADMIN][CONSTRUCTORA] Error eliminando:",
      error.message || error
    );
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Error eliminando constructora",
      });
  }
}

export async function listUsuariosByConstructora(req, res) {
  try {
    const { id } = req.params;
    const users = await getUsersByConstructora(id);
    res.json({ success: true, data: users });
  } catch (error) {
    console.error(
      "[ADMIN][CONSTRUCTORA] Error listando usuarios por constructora:",
      error.message || error
    );
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Error listando usuarios",
      });
  }
}

export async function assignConstructora(req, res) {
  try {
    const { uid } = req.params;
    const { constructora_id } = req.body;
    if (constructora_id === undefined || constructora_id === null)
      return res
        .status(400)
        .json({ success: false, message: "constructora_id requerido" });

    const constructoraId = parseInt(constructora_id, 10);
    if (Number.isNaN(constructoraId))
      return res
        .status(400)
        .json({
          success: false,
          message: "constructora_id debe ser un entero válido",
        });

    // Validar existencia de constructora
    const constructora = await getConstructoraById(constructoraId);
    if (!constructora)
      return res
        .status(404)
        .json({ success: false, message: "Constructora no encontrada" });

    // Validar usuario destino
    const user = await getUserById(parseInt(uid, 10));
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Usuario destino no encontrado" });
    if ((user.rol || "").toLowerCase() !== "tecnico") {
      return res
        .status(400)
        .json({
          success: false,
          message:
            'La constructora sólo puede asignarse a usuarios con rol "tecnico"',
        });
    }

    const data = await assignConstructoraToUser(
      parseInt(uid, 10),
      constructoraId
    );
    res.json({ success: true, data });
  } catch (error) {
    console.error(
      "[ADMIN][CONSTRUCTORA] Error asignando a usuario:",
      error.message || error
    );
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Error asignando constructora",
      });
  }
}

export async function removeConstructora(req, res) {
  try {
    const { uid } = req.params;
    const data = await removeConstructoraFromUser(parseInt(uid, 10));
    res.json({ success: true, data });
  } catch (error) {
    console.error(
      "[ADMIN][CONSTRUCTORA] Error removiendo de usuario:",
      error.message || error
    );
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Error removiendo constructora",
      });
  }
}

/**
 * Modelo de Proyecto para interacción con la base de datos
 * Plataforma de Gestión de Viviendas TECHO
 */

import { supabase } from "../supabaseClient.js";

/**
 * Obtiene todos los proyectos
 * @returns {Array} Lista de proyectos
 */
export async function getAllProjects() {
  const { data, error } = await supabase
    .from("proyecto")
    .select(
      "id_proyecto, nombre, ubicacion, ubicacion_normalizada, ubicacion_referencia, latitud, longitud, fecha_inicio, fecha_entrega, constructora_id"
    )
    .order("id_proyecto", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Obtiene un proyecto por ID
 * @param {number} id - ID del proyecto
 * @returns {Object} Datos del proyecto
 */
export async function getProjectById(id) {
  const { data, error } = await supabase
    .from("proyecto")
    .select("*")
    .eq("id_proyecto", id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Crea un nuevo proyecto
 * @param {Object} projectData - Datos del proyecto
 * @returns {Object} Proyecto creado
 */
export async function createProject(projectData) {
  // La tabla proyecto no tiene identidad automática; generamos id_proyecto
  let id_proyecto = projectData.id_proyecto;
  if (typeof id_proyecto !== "number") {
    const { data: last, error: errLast } = await supabase
      .from("proyecto")
      .select("id_proyecto")
      .order("id_proyecto", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (errLast) throw errLast;
    id_proyecto = last && last.id_proyecto ? Number(last.id_proyecto) + 1 : 1;
  }
  const toInsert = { ...projectData, id_proyecto };
  const { data, error } = await supabase
    .from("proyecto")
    .insert([toInsert])
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/**
 * Actualiza un proyecto
 * @param {number} id - ID del proyecto
 * @param {Object} updates - Datos a actualizar
 * @returns {Object} Proyecto actualizado
 */
export async function updateProject(id, updates) {
  const { data, error } = await supabase
    .from("proyecto")
    .update(updates)
    .eq("id_proyecto", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

/**
 * Elimina un proyecto
 * @param {number} id - ID del proyecto
 */
export async function deleteProject(id) {
  const { error } = await supabase
    .from("proyecto")
    .delete()
    .eq("id_proyecto", id);

  if (error) throw error;
}

/**
 * Obtiene técnicos asignados a un proyecto
 * @param {number} projectId - ID del proyecto
 * @returns {Array} Lista de técnicos asignados
 */
export async function getProjectTechnicians(projectId) {
  const { data, error } = await supabase
    .from("proyecto_tecnico")
    .select(
      `
      tecnico_uid,
      usuarios!inner(uid, nombre, email)
    `
    )
    .eq("id_proyecto", projectId);

  if (error) throw error;
  return data || [];
}

/**
 * Asigna un técnico a un proyecto
 * @param {number} projectId - ID del proyecto
 * @param {number} technicianId - ID del técnico
 */
export async function assignTechnicianToProject(projectId, technicianId) {
  const { error } = await supabase.from("proyecto_tecnico").insert([
    {
      id_proyecto: projectId,
      tecnico_uid: technicianId,
    },
  ]);

  if (error) throw error;
}

/**
 * Remueve un técnico de un proyecto
 * @param {number} projectId - ID del proyecto
 * @param {number} technicianId - ID del técnico
 */
export async function removeTechnicianFromProject(projectId, technicianId) {
  const { error } = await supabase
    .from("proyecto_tecnico")
    .delete()
    .eq("id_proyecto", projectId)
    .eq("tecnico_uid", technicianId);

  if (error) throw error;
}

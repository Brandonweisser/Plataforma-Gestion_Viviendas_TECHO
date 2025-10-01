import supabase from "../supabaseClient.js";

// GET todos
export async function getUsuarios(req, res) {
  const { data, error } = await supabase.from("usuarios").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

// GET uno
export async function getUsuarioById(req, res) {
  const { id } = req.params;
  const { data, error } = await supabase.from("usuarios").select("*").eq("uid", id).single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

// POST crear
export async function createUsuario(req, res) {
  const { nombre, email, rut, direccion, permisos, password_hash } = req.body;
  const { data, error } = await supabase.from("usuarios").insert([{ nombre, email, rut, direccion, permisos, password_hash }]);
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}

// PUT actualizar
export async function updateUsuario(req, res) {
  const { id } = req.params;
  const { nombre, email, direccion, permisos } = req.body;
  const { data, error } = await supabase.from("usuarios").update({ nombre, email, direccion, permisos }).eq("uid", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

// DELETE eliminar
export async function deleteUsuario(req, res) {
  const { id } = req.params;
  const { error } = await supabase.from("usuarios").delete().eq("uid", id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
}

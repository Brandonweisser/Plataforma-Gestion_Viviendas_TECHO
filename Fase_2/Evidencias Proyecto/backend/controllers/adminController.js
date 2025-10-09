/**
 * Controlador de Administración
 * Plataforma de Gestión de Viviendas TECHO
 * 
 * Maneja todas las operaciones administrativas del sistema
 */

import bcrypt from 'bcrypt'
import { supabase } from '../supabaseClient.js'
import { getAllUsers, updateUser, deleteUser, insertUser, getLastUser } from '../models/User.js'
import { 
  getAllProjects, 
  getProjectById, 
  createProject, 
  updateProject, 
  deleteProject,
  getProjectTechnicians,
  assignTechnicianToProject,
  removeTechnicianFromProject
} from '../models/Project.js'
import { 
  getAllHousings, 
  getHousingById, 
  createHousing, 
  updateHousing, 
  deleteHousing,
  assignBeneficiaryToHousing,
  getHousingStats
} from '../models/Housing.js'

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10)

/**
 * Health check para rutas administrativas
 */
export async function adminHealth(req, res) {
  res.json({ 
    success: true, 
    area: 'admin', 
    status: 'ok' 
  })
}

/**
 * Obtiene estadísticas para el dashboard administrativo
 */
export async function getDashboardStats(req, res) {
  try {
    // Contar usuarios por rol
    const usuarios = await getAllUsers()
    const totalUsuarios = usuarios.length
    const rolesCount = usuarios.reduce((acc, u) => { 
      acc[u.rol] = (acc[u.rol] || 0) + 1
      return acc
    }, {})

    // Obtener estadísticas de viviendas
    const housingStats = await getHousingStats()

    // Contar incidencias abiertas
    let incidenciasAbiertas = 0
    try {
      const { data: incData, error: errInc } = await supabase
        .from('incidencias')
        .select('estado')
      
      if (!errInc && incData) {
        incidenciasAbiertas = incData.filter(i => 
          ['abierta', 'open', 'pendiente'].includes((i.estado || '').toLowerCase())
        ).length
      }
    } catch (error) {
      console.warn('Error contando incidencias (continuando):', error.message)
    }

    res.json({
      success: true,
      data: {
        usuarios: { 
          total: totalUsuarios, 
          ...rolesCount 
        },
        viviendas: housingStats,
        incidencias: { 
          abiertas: incidenciasAbiertas 
        }
      }
    })
  } catch (error) {
    console.error('Error obteniendo estadísticas del dashboard:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error obteniendo estadísticas' 
    })
  }
}

// ==================== GESTIÓN DE USUARIOS ====================

/**
 * Obtiene lista de todos los usuarios
 */
export async function getUsers(req, res) {
  try {
    const users = await getAllUsers()
    res.json({ 
      success: true, 
      data: users.map(u => ({
        uid: u.uid,
        nombre: u.nombre,
        email: u.email,
        rol: u.rol,
        rut: u.rut,
        direccion: u.direccion,
        created_at: u.created_at
      }))
    })
  } catch (error) {
    console.error('Error listando usuarios:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error listando usuarios' 
    })
  }
}

/**
 * Crea un nuevo usuario
 */
export async function createUser(req, res) {
  try {
    const { nombre, email, rol, password, rut, direccion } = req.body || {}
    
    if (!nombre || !email || !rol || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'nombre, email, rol y password son obligatorios' 
      })
    }

    // Verificar que el email no exista
    const { data: exists, error: errExists } = await supabase
      .from('usuarios')
      .select('uid')
      .eq('email', email.toLowerCase())
      .maybeSingle()
      
    if (errExists) throw errExists
    if (exists) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email ya registrado' 
      })
    }

    // Generar nuevo UID
    const lastUser = await getLastUser()
    const newUid = lastUser ? Number(lastUser.uid) + 1 : 1
    
    // Encriptar contraseña
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS)
    
    // Crear usuario
    const userData = {
      uid: newUid,
      nombre,
      email: email.toLowerCase(),
      rol,
      password_hash,
      rut: rut || null,
      direccion: direccion || null
    }
    
    const inserted = await insertUser(userData)
    
    res.status(201).json({ 
      success: true, 
      data: {
        uid: inserted.uid,
        nombre: userData.nombre,
        email: userData.email,
        rol: userData.rol,
        rut: userData.rut,
        direccion: userData.direccion
      }
    })
  } catch (error) {
    console.error('Error creando usuario:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error creando usuario' 
    })
  }
}

/**
 * Actualiza un usuario existente
 */
export async function updateUserById(req, res) {
  try {
    const uid = Number(req.params.uid)
    const { nombre, rol, password, rut, direccion } = req.body || {}
    
    const updates = {}
    if (nombre) updates.nombre = nombre
    if (rol) updates.rol = rol
    if (rut) updates.rut = rut
    if (direccion) updates.direccion = direccion
    if (password) updates.password_hash = await bcrypt.hash(password, SALT_ROUNDS)
    
    if (!Object.keys(updates).length) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nada que actualizar' 
      })
    }
    
    const updatedUser = await updateUser(uid, updates)
    
    res.json({ 
      success: true, 
      data: {
        uid: updatedUser.uid,
        nombre: updatedUser.nombre,
        email: updatedUser.email,
        rol: updatedUser.rol,
        rut: updatedUser.rut,
        direccion: updatedUser.direccion
      }
    })
  } catch (error) {
    console.error('Error actualizando usuario:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error actualizando usuario' 
    })
  }
}

/**
 * Elimina un usuario
 */
export async function deleteUserById(req, res) {
  try {
    const uid = Number(req.params.uid)
    await deleteUser(uid)
    res.json({ success: true })
  } catch (error) {
    console.error('Error eliminando usuario:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error eliminando usuario' 
    })
  }
}

// ==================== GESTIÓN DE PROYECTOS ====================

/**
 * Obtiene lista de todos los proyectos
 */
export async function getProjects(req, res) {
  try {
    const projects = await getAllProjects()
    res.json({ success: true, data: projects })
  } catch (error) {
    console.error('Error listando proyectos:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error listando proyectos' 
    })
  }
}

/**
 * Crea un nuevo proyecto
 */
export async function createNewProject(req, res) {
  try {
  const { nombre, ubicacion, fecha_inicio, fecha_entrega, ubicacion_normalizada, ubicacion_referencia, latitud, longitud, geocode_provider, geocode_score, geocode_at } = req.body || {}
    
    if (!nombre || !ubicacion) {
      return res.status(400).json({ 
        success: false, 
        message: 'nombre y ubicacion son obligatorios' 
      })
    }
    
    const projectData = {
      nombre,
      ubicacion,
      fecha_inicio: fecha_inicio || null,
      fecha_entrega: fecha_entrega || null,
  ubicacion_normalizada: ubicacion_normalizada || null,
  ubicacion_referencia: ubicacion_referencia || null,
      latitud: typeof latitud === 'number' ? latitud : null,
      longitud: typeof longitud === 'number' ? longitud : null,
      geocode_provider: geocode_provider || null,
      geocode_score: typeof geocode_score === 'number' ? geocode_score : null,
      geocode_at: geocode_at ? new Date(geocode_at) : (latitud && longitud ? new Date() : null)
    }
    
    const created = await createProject(projectData)
    res.status(201).json({ success: true, data: created })
  } catch (error) {
    console.error('Error creando proyecto:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error creando proyecto' 
    })
  }
}

/**
 * Actualiza un proyecto existente
 */
export async function updateProjectById(req, res) {
  try {
    const id = Number(req.params.id)
    const updates = req.body || {}
    
    if (!Object.keys(updates).length) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nada que actualizar' 
      })
    }
    
  const updated = await updateProject(id, updates)
    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error actualizando proyecto:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error actualizando proyecto' 
    })
  }
}

/**
 * Elimina un proyecto
 */
export async function deleteProjectById(req, res) {
  try {
    const id = Number(req.params.id)
    await deleteProject(id)
    res.json({ success: true })
  } catch (error) {
    console.error('Error eliminando proyecto:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error eliminando proyecto' 
    })
  }
}

/**
 * Asigna un técnico a un proyecto
 */
export async function assignTechnician(req, res) {
  try {
    const projectId = Number(req.params.id)
    const { id_usuario_tecnico } = req.body || {}
    
    if (!id_usuario_tecnico) {
      return res.status(400).json({ 
        success: false, 
        message: 'id_usuario_tecnico es obligatorio' 
      })
    }
    
    await assignTechnicianToProject(projectId, id_usuario_tecnico)
    res.json({ success: true })
  } catch (error) {
    console.error('Error asignando técnico:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error asignando técnico' 
    })
  }
}

/**
 * Remueve un técnico de un proyecto
 */
export async function removeTechnician(req, res) {
  try {
    const projectId = Number(req.params.id)
    const technicianId = Number(req.params.tecnico_uid)
    
    await removeTechnicianFromProject(projectId, technicianId)
    res.json({ success: true })
  } catch (error) {
    console.error('Error removiendo técnico:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error removiendo técnico' 
    })
  }
}

// ==================== GESTIÓN DE VIVIENDAS ====================

/**
 * Obtiene lista de todas las viviendas
 */
export async function getHousings(req, res) {
  try {
    const housings = await getAllHousings()
    res.json({ success: true, data: housings })
  } catch (error) {
    console.error('Error listando viviendas:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error listando viviendas' 
    })
  }
}

/**
 * Crea una nueva vivienda
 */
export async function createNewHousing(req, res) {
  try {
    const { id_proyecto, estado, direccion, tipo_vivienda, fecha_entrega } = req.body || {}
    
    if (!id_proyecto || !direccion) {
      return res.status(400).json({ 
        success: false, 
        message: 'id_proyecto y direccion son obligatorios' 
      })
    }
    
    const housingData = {
      id_proyecto: Number(id_proyecto),
      direccion,
      tipo_vivienda: tipo_vivienda || null,
      fecha_entrega: fecha_entrega || null,
      estado: estado || 'planificada'
    }
    
    const created = await createHousing(housingData)
    res.status(201).json({ success: true, data: created })
  } catch (error) {
    console.error('Error creando vivienda:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error creando vivienda' 
    })
  }
}

/**
 * Actualiza una vivienda existente
 */
export async function updateHousingById(req, res) {
  try {
    const id = Number(req.params.id)
    const updates = req.body || {}
    
    if (!Object.keys(updates).length) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nada que actualizar' 
      })
    }
    
    const updated = await updateHousing(id, updates)
    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error actualizando vivienda:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error actualizando vivienda' 
    })
  }
}

/**
 * Elimina una vivienda
 */
export async function deleteHousingById(req, res) {
  try {
    const id = Number(req.params.id)
    await deleteHousing(id)
    res.json({ success: true })
  } catch (error) {
    console.error('Error eliminando vivienda:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error eliminando vivienda' 
    })
  }
}

/**
 * Asigna un beneficiario a una vivienda
 */
export async function assignBeneficiary(req, res) {
  try {
    const housingId = Number(req.params.id)
    const { id_usuario_beneficiario, beneficiario_uid } = req.body || {}
    const finalBeneficiary = beneficiario_uid || id_usuario_beneficiario

    if (!finalBeneficiary) {
      return res.status(400).json({ 
        success: false, 
        message: 'beneficiario_uid (o id_usuario_beneficiario) es obligatorio' 
      })
    }
    const updated = await assignBeneficiaryToHousing(housingId, finalBeneficiary)
    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error asignando beneficiario:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error asignando beneficiario' 
    })
  }
}

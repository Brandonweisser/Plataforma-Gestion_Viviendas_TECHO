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
  unassignBeneficiaryFromHousing,
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

/**
 * Obtiene actividad reciente para el dashboard administrativo
 * Devuelve una lista simple de eventos normalizados para UI
 */
export async function getDashboardActivity(req, res) {
  try {
    // Tomamos últimos registros de usuarios, viviendas e incidencias
    const events = []

    try {
      const { data: users, error: errUsers } = await supabase
        .from('usuarios')
        .select('uid, nombre, created_at')
        .order('created_at', { ascending: false })
        .limit(3)
      if (!errUsers && Array.isArray(users)) {
        users.forEach((u) => {
          events.push({
            id: `u-${u.uid}`,
            text: `Nuevo usuario registrado: ${u.nombre || u.uid}`,
            color: 'bg-green-500',
            time: u.created_at ? new Date(u.created_at).toLocaleString() : 'Reciente',
            dateTime: u.created_at || null,
          })
        })
      }
    } catch (e) {
      console.warn('No se pudo cargar actividad de usuarios:', e.message)
    }

    try {
      const { data: housings, error: errH } = await supabase
        .from('viviendas')
        .select('id_vivienda, direccion, fecha_entrega')
        .order('id_vivienda', { ascending: false })
        .limit(3)
      if (!errH && Array.isArray(housings)) {
        housings.forEach((h) => {
          events.push({
            id: `v-${h.id_vivienda}`,
            text: `Nueva vivienda registrada${h.direccion ? ' en ' + h.direccion : ''}`,
            color: 'bg-green-500',
            time: h.fecha_entrega || 'Reciente',
            dateTime: h.fecha_entrega || null,
          })
        })
      }
    } catch (e) {
      console.warn('No se pudo cargar actividad de viviendas:', e.message)
    }

    try {
      const { data: incs, error: errI } = await supabase
        .from('incidencias')
        .select('id_incidencia, id_vivienda, fecha_reporte')
        .order('fecha_reporte', { ascending: false })
        .limit(5)
      if (!errI && Array.isArray(incs)) {
        incs.forEach((i) => {
          events.push({
            id: `i-${i.id_incidencia}`,
            text: `Incidencia reportada en Vivienda #${i.id_vivienda}`,
            color: 'bg-orange-500',
            time: i.fecha_reporte ? new Date(i.fecha_reporte).toLocaleString() : 'Reciente',
            dateTime: i.fecha_reporte || null,
          })
        })
      }
    } catch (e) {
      console.warn('No se pudo cargar actividad de incidencias:', e.message)
    }

    // Orden aproximado por fecha si está disponible
    const normalized = events
      .map((e) => ({
        ...e,
        _ts: e.dateTime ? Date.parse(e.dateTime) : 0,
      }))
      .sort((a, b) => b._ts - a._ts)
      .slice(0, 10)
      .map(({ _ts, ...rest }) => rest)

    res.json({ success: true, data: normalized })
  } catch (error) {
    console.error('Error obteniendo actividad del dashboard:', error)
    res.status(500).json({ success: false, message: 'Error obteniendo actividad' })
  }
}

/**
 * Analytics avanzados para KPIs administrativos
 * Devuelve agregaciones de incidencias (categorías, estado, prioridad, proyectos, técnicos, backlog)
 */
export async function getDashboardAnalytics(req, res) {
  try {
    const days = Math.max(1, parseInt(req.query.days || '90', 10));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const sinceIso = since.toISOString();

    // Cargar incidencias del periodo con campos mínimos + relación a viviendas/proyecto
    const selectCols = `id_incidencia,id_vivienda,categoria,estado,prioridad,fecha_reporte,fecha_asignada,fecha_resuelta,fecha_cerrada,id_usuario_tecnico,fecha_limite_atencion,fecha_limite_cierre,fuente,viviendas(id_vivienda,id_proyecto,direccion,proyecto(nombre,id_proyecto))`;
    const { data: incs, error: errIncs } = await supabase
      .from('incidencias')
      .select(selectCols)
      .gte('fecha_reporte', sinceIso)
      .order('fecha_reporte', { ascending: false });
    if (errIncs) throw errIncs;

    // Cargar viviendas para contar por proyecto (ratio)
    const { data: vivs, error: errVivs } = await supabase
      .from('viviendas')
      .select('id_vivienda,id_proyecto');
    if (errVivs) throw errVivs;

    const viviendasPorProyecto = new Map();
    (vivs || []).forEach(v => {
      const pid = v.id_proyecto;
      if (!pid) return;
      viviendasPorProyecto.set(pid, (viviendasPorProyecto.get(pid) || 0) + 1);
    });

    const now = Date.now();
    const isOpen = (st) => ['abierta','en_proceso','en_espera','open','pendiente'].includes(String(st || '').toLowerCase());

    // Agregaciones
    const catCount = new Map();
    const statusCount = new Map();
    const prioCount = new Map();
    const projCount = new Map(); // key=proyectoId, {nombre,count}
    const tecLoad = new Map(); // key=tecnico_uid -> {open, closed30d, total, durResHoras[]}
    const vivCount = new Map(); // key=viviendaId -> {count,direccion}

    let abiertas = 0, cerradas = 0;

    (incs || []).forEach(i => {
      const cat = (i.categoria || 'Sin categoría').trim();
      catCount.set(cat, (catCount.get(cat) || 0) + 1);

      const st = (i.estado || 'desconocido').toLowerCase();
      statusCount.set(st, (statusCount.get(st) || 0) + 1);
      if (['cerrada','resuelta'].includes(st)) cerradas++; else if (isOpen(st)) abiertas++;

      const pr = (i.prioridad || 'sin').toLowerCase();
      prioCount.set(pr, (prioCount.get(pr) || 0) + 1);

      const vivienda = i.viviendas || {};
      const pid = vivienda?.id_proyecto || vivienda?.proyecto?.id_proyecto;
      const pnombre = vivienda?.proyecto?.nombre || '—';
      if (pid) {
        const prev = projCount.get(pid) || { id: pid, nombre: pnombre, count: 0 };
        prev.count += 1;
        projCount.set(pid, prev);
      }

      // Técnicos
      const tec = i.id_usuario_tecnico;
      if (tec) {
        const prev = tecLoad.get(tec) || { tecnico_uid: tec, open: 0, closed30d: 0, total: 0, durResHoras: [] };
        prev.total += 1;
        if (isOpen(st)) prev.open += 1;
        const fechaCierre = i.fecha_cerrada || i.fecha_resuelta;
        if (fechaCierre) {
          const f = new Date(fechaCierre).getTime();
          if (now - f <= 30 * 24 * 60 * 60 * 1000) prev.closed30d += 1;
          const fr = new Date(i.fecha_reporte).getTime();
          if (Number.isFinite(fr) && Number.isFinite(f)) {
            const horas = (f - fr) / (1000 * 60 * 60);
            if (horas >= 0) prev.durResHoras.push(horas);
          }
        }
        tecLoad.set(tec, prev);
      }

      // Viviendas
      if (i.id_vivienda) {
        const prevV = vivCount.get(i.id_vivienda) || { id_vivienda: i.id_vivienda, count: 0, direccion: vivienda?.direccion || null };
        prevV.count += 1;
        vivCount.set(i.id_vivienda, prevV);
      }
    });

    // Backlog por antigüedad (solo abiertas)
    const buckets = { '0-7d': 0, '8-14d': 0, '15-30d': 0, '31-60d': 0, '61-90d': 0, '90d+': 0 };
    let sumaAnios = 0, cntAnios = 0;
    (incs || []).forEach(i => {
      if (!isOpen(i.estado)) return;
      const fr = new Date(i.fecha_reporte).getTime();
      if (!Number.isFinite(fr)) return;
      const dias = Math.floor((now - fr) / (1000 * 60 * 60 * 24));
      sumaAnios += dias; cntAnios += 1;
      if (dias <= 7) buckets['0-7d']++; else if (dias <= 14) buckets['8-14d']++; else if (dias <= 30) buckets['15-30d']++; else if (dias <= 60) buckets['31-60d']++; else if (dias <= 90) buckets['61-90d']++; else buckets['90d+']++;
    });

    // SLA (si existen fechas límite)
    let dentroAtencion = 0, totalAtencion = 0, dentroCierre = 0, totalCierre = 0;
    (incs || []).forEach(i => {
      if (i.fecha_limite_atencion) {
        totalAtencion++;
        if (i.fecha_asignada) {
          if (new Date(i.fecha_asignada).getTime() <= new Date(i.fecha_limite_atencion).getTime()) dentroAtencion++;
        }
      }
      if (i.fecha_limite_cierre && (i.fecha_cerrada || i.fecha_resuelta)) {
        totalCierre++;
        const cierre = new Date(i.fecha_cerrada || i.fecha_resuelta).getTime();
        if (cierre <= new Date(i.fecha_limite_cierre).getTime()) dentroCierre++;
      }
    });

    function sortEntries(map, { asc = false } = {}) {
      const arr = Array.from(map.entries()).map(([k, v]) => ({ key: k, value: v }));
      arr.sort((a, b) => asc ? (a.value - b.value) : (b.value - a.value));
      return arr;
    }

    const categoriasTop = sortEntries(catCount, { asc: false }).slice(0, 5);
    const categoriasBottom = sortEntries(catCount, { asc: true }).filter(e => e.key && e.key !== 'Sin categoría').slice(0, 5);
    const estados = sortEntries(statusCount);
    const prioridades = sortEntries(prioCount);

    // Proyectos
    const proyectosTop = Array.from(projCount.values()).sort((a, b) => b.count - a.count).slice(0, 5).map(p => ({ id: p.id, nombre: p.nombre, count: p.count, viviendas: viviendasPorProyecto.get(p.id) || 0, ratioIncPorViv: (viviendasPorProyecto.get(p.id) || 0) > 0 ? p.count / (viviendasPorProyecto.get(p.id) || 1) : null }));

    // Técnicos
    const tecnicosCarga = Array.from(tecLoad.values()).map(t => ({ ...t, avgResHoras: t.durResHoras.length ? (t.durResHoras.reduce((a, b) => a + b, 0) / t.durResHoras.length) : null }));
    tecnicosCarga.sort((a, b) => b.open - a.open);
    const tecnicosTopCarga = tecnicosCarga.slice(0, 5);
    const tecnicosTopResoluciones = [...tecnicosCarga].sort((a, b) => b.closed30d - a.closed30d).slice(0, 5);

    // Enriquecer con nombres/emails desde 'usuarios'
    const allTecUidsRaw = Array.from(new Set([
      ...tecnicosTopCarga.map(t => t.tecnico_uid).filter(Boolean),
      ...tecnicosTopResoluciones.map(t => t.tecnico_uid).filter(Boolean)
    ]));
    const allTecUids = allTecUidsRaw
      .map(v => (typeof v === 'number' ? v : Number(v)))
      .filter(v => Number.isFinite(v));
    const tecInfoMap = new Map();
    if (allTecUids.length) {
      try {
        const { data: tecUsers, error: errTecUsers } = await supabase
          .from('usuarios')
          .select('uid,nombre,email')
          .in('uid', allTecUids);
        if (!errTecUsers && Array.isArray(tecUsers)) {
          tecUsers.forEach(u => {
            const key = typeof u.uid === 'number' ? u.uid : Number(u.uid);
            tecInfoMap.set(key, { nombre: u.nombre || null, email: u.email || null });
          });
        }
      } catch (e) {
        console.warn('No se pudo enriquecer nombres de técnicos (continuando):', e.message);
      }
    }
    const attachTecInfo = (arr) => arr.map(t => ({
      ...t,
      ...(tecInfoMap.get(typeof t.tecnico_uid === 'number' ? t.tecnico_uid : Number(t.tecnico_uid)) || {})
    }));
    let tecnicosTopCargaInfo = attachTecInfo(tecnicosTopCarga);
    let tecnicosTopResolucionesInfo = attachTecInfo(tecnicosTopResoluciones);

    // Fallback: si no hay actividad en 90 días, devolver técnicos del sistema (rol = 'tecnico') con contadores 0
    if ((!tecnicosTopCargaInfo.length) && (!tecnicosTopResolucionesInfo.length)) {
      try {
        const { data: tusers, error: errTusers } = await supabase
          .from('usuarios')
          .select('uid,nombre,email')
          .eq('rol', 'tecnico')
          .order('uid', { ascending: true })
          .limit(5);
        if (!errTusers && Array.isArray(tusers) && tusers.length) {
          const defaults = tusers.map(u => ({
            tecnico_uid: typeof u.uid === 'number' ? u.uid : Number(u.uid),
            nombre: u.nombre || null,
            email: u.email || null,
            open: 0, closed30d: 0, total: 0, avgResHoras: null
          }));
          tecnicosTopCargaInfo = defaults;
          tecnicosTopResolucionesInfo = defaults;
        }
      } catch (e) {
        console.warn('Fallback técnicos sin actividad no disponible:', e.message);
      }
    }

    // Viviendas
    const viviendasTop = Array.from(vivCount.values()).sort((a, b) => b.count - a.count).slice(0, 5);

    res.json({
      success: true,
      data: {
        timeframeDays: days,
        totals: {
          incidencias: (incs || []).length,
          abiertas,
          cerradas,
        },
        categorias: {
          top: categoriasTop,
          bottom: categoriasBottom,
        },
        estados,
        prioridades,
        proyectos: {
          topReportes: proyectosTop,
        },
        tecnicos: {
          topCarga: tecnicosTopCargaInfo,
          topResoluciones30d: tecnicosTopResolucionesInfo,
        },
        viviendas: {
          topReportes: viviendasTop,
        },
        backlog: {
          buckets,
          antiguedadPromedioDias: cntAnios ? (sumaAnios / cntAnios) : null,
        },
        sla: {
          atencionDentro: totalAtencion ? dentroAtencion / totalAtencion : null,
          cierreDentro: totalCierre ? dentroCierre / totalCierre : null,
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo analytics del dashboard:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo analytics' });
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
    // Normalizamos para el frontend: exponer 'id' además de 'id_proyecto'
    const normalized = (projects || []).map(p => ({
      id: p.id_proyecto,
      id_proyecto: p.id_proyecto,
      nombre: p.nombre,
      ubicacion: p.ubicacion,
      fecha_inicio: p.fecha_inicio,
      fecha_entrega: p.fecha_entrega,
      ubicacion_normalizada: p.ubicacion_normalizada,
      ubicacion_referencia: p.ubicacion_referencia,
      latitud: p.latitud,
      longitud: p.longitud,
      // el esquema no define estado/descripcion, damos valores por defecto para UI
      estado: 'activo'
    }))
    res.json({ success: true, data: normalized })
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
  const { nombre, ubicacion, fecha_inicio, fecha_entrega, ubicacion_normalizada, ubicacion_referencia, latitud, longitud, lat, lng, latitude, longitude, geocode_provider, geocode_score, geocode_at } = req.body || {}
    
    if (!nombre || !ubicacion) {
      return res.status(400).json({ 
        success: false, 
        message: 'nombre y ubicacion son obligatorios' 
      })
    }
    
    // Normalizar coordenadas (acepta lat/lng, latitude/longitude y strings con coma)
    const toNum = (v) => {
      if (v === null || typeof v === 'undefined') return null
      const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'))
      return Number.isFinite(n) ? n : null
    }
    const inRange = (la, lo) => la != null && lo != null && la >= -90 && la <= 90 && lo >= -180 && lo <= 180
    const latNum = toNum(latitud ?? latitude ?? lat)
    const lonNum = toNum(longitud ?? longitude ?? lng)

    const projectData = {
      nombre,
      ubicacion,
      fecha_inicio: fecha_inicio || null,
      fecha_entrega: fecha_entrega || null,
  ubicacion_normalizada: ubicacion_normalizada || null,
  ubicacion_referencia: ubicacion_referencia || null,
      latitud: inRange(latNum, lonNum) ? latNum : null,
      longitud: inRange(latNum, lonNum) ? lonNum : null,
      geocode_provider: geocode_provider || null,
      geocode_score: typeof geocode_score === 'number' ? geocode_score : null,
      geocode_at: geocode_at ? new Date(geocode_at) : (inRange(latNum, lonNum) ? new Date() : null)
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
    const updates = { ...(req.body || {}) }
    
    if (!Object.keys(updates).length) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nada que actualizar' 
      })
    }
    
    // Normalizar posibles alias de coordenadas y tipos string
    const toNum = (v) => {
      if (v === null || typeof v === 'undefined') return null
      const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'))
      return Number.isFinite(n) ? n : null
    }
    const inRange = (la, lo) => la != null && lo != null && la >= -90 && la <= 90 && lo >= -180 && lo <= 180
    const latNum = toNum(updates.latitud ?? updates.latitude ?? updates.lat)
    const lonNum = toNum(updates.longitud ?? updates.longitude ?? updates.lng)
    if (latNum != null || lonNum != null) {
      // Si alguno viene, ambos deben ser válidos y en rango; si no, los ponemos a null para no guardar basura
      if (inRange(latNum, lonNum)) {
        updates.latitud = latNum
        updates.longitud = lonNum
      } else {
        updates.latitud = null
        updates.longitud = null
      }
      delete updates.lat; delete updates.lng; delete updates.latitude; delete updates.longitude
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
    const { id_usuario_tecnico, tecnico_uid } = req.body || {}
    // Compat: aceptar ambos nombres, preferimos tecnico_uid
    const finalTechId = tecnico_uid || id_usuario_tecnico
    
    if (!finalTechId) {
      return res.status(400).json({ 
        success: false, 
        message: 'id_usuario_tecnico/tecnico_uid es obligatorio' 
      })
    }
    
    await assignTechnicianToProject(projectId, finalTechId)
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

/**
 * Lista los técnicos asignados a un proyecto
 */
export async function listProjectTechnicians(req, res) {
  try {
    const projectId = Number(req.params.id)
    const rows = await getProjectTechnicians(projectId)
    const tecnicos = (rows || []).map(r => ({
      uid: r.tecnico_uid || r.usuarios?.uid,
      nombre: r.usuarios?.nombre,
      email: r.usuarios?.email
    })).filter(t => t.uid)
    res.json({ success: true, data: tecnicos })
  } catch (error) {
    console.error('Error listando técnicos del proyecto:', error)
    res.status(500).json({ success: false, message: 'Error listando técnicos del proyecto' })
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
    const { 
      id_proyecto, 
      proyecto_id, 
      estado, 
      direccion, 
      tipo_vivienda, 
      fecha_entrega,
      metros_cuadrados,
      numero_habitaciones,
      numero_banos,
      observaciones
    } = req.body || {}
    
    const finalProjectId = proyecto_id || id_proyecto
    if (!finalProjectId || !direccion) {
      return res.status(400).json({ 
        success: false, 
        message: 'id_proyecto/proyecto_id y direccion son obligatorios' 
      })
    }

    // Normalización y validación de estado de vivienda
    // Nuevos estados: 'construida', 'lista_para_entregar', 'entregada_inicial', 'entregada_definitiva'
    // Mantenemos 'entregada' por compatibilidad (equivalente a 'entregada_inicial')
    const allowedEstados = ['planificada','en_construccion','construida','lista_para_entregar','asignada','entregada','entregada_inicial','entregada_definitiva']
    let estadoInput = (estado || '').toString().trim().toLowerCase()
    const estadoMap = {
      terminada: 'construida',
      construccion: 'en_construccion',
      construido: 'construida',
      lista: 'lista_para_entregar',
      listo: 'lista_para_entregar',
      entrega_inicial: 'entregada_inicial',
      entrega_definitiva: 'entregada_definitiva'
    }
    if (estadoInput && estadoMap[estadoInput]) estadoInput = estadoMap[estadoInput]
    if (estadoInput && !allowedEstados.includes(estadoInput)) {
      return res.status(400).json({ success:false, message:`Estado inválido '${estadoInput}'. Permitidos: ${allowedEstados.join(', ')}` })
    }
    
    const housingDataRaw = {
      id_proyecto: Number(finalProjectId),
      direccion,
      tipo_vivienda: tipo_vivienda || null,
      fecha_entrega: fecha_entrega || null,
      estado: estadoInput || 'planificada',
      // Campos adicionales utilizados por el panel
      metros_cuadrados: typeof metros_cuadrados === 'number' ? metros_cuadrados : (metros_cuadrados ? Number(metros_cuadrados) : null),
      numero_habitaciones: typeof numero_habitaciones === 'number' ? numero_habitaciones : (numero_habitaciones ? Number(numero_habitaciones) : null),
      numero_banos: typeof numero_banos === 'number' ? numero_banos : (numero_banos ? Number(numero_banos) : null),
      observaciones: observaciones || null
    }
    // Para evitar errores PGRST204 cuando la columna aún no existe en el esquema
    // (por ejemplo, antes de aplicar la migración), eliminamos las claves con valor null/undefined
    // de los campos opcionales nuevos.
    const optionalKeys = ['metros_cuadrados','numero_habitaciones','numero_banos','observaciones']
    const housingData = Object.fromEntries(
      Object.entries(housingDataRaw).filter(([k, v]) => {
        if (!optionalKeys.includes(k)) return true
        return v !== null && typeof v !== 'undefined'
      })
    )
    
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
    
    // Normalización de estado si viene en payload
    if (typeof updates.estado === 'string') {
      // Estados ampliados; mantenemos 'entregada' (legacy)
      const allowedEstados = ['planificada','en_construccion','construida','lista_para_entregar','asignada','entregada','entregada_inicial','entregada_definitiva']
      let est = updates.estado.toString().trim().toLowerCase()
      const estadoMap = {
        terminada: 'construida',
        construccion: 'en_construccion',
        construido: 'construida',
        lista: 'lista_para_entregar',
        listo: 'lista_para_entregar',
        entrega_inicial: 'entregada_inicial',
        entrega_definitiva: 'entregada_definitiva'
      }
      if (estadoMap[est]) est = estadoMap[est]
      if (!allowedEstados.includes(est)) {
        return res.status(400).json({ success:false, message:`Estado inválido '${updates.estado}'. Permitidos: ${allowedEstados.join(', ')}` })
      }
      updates.estado = est
    }

    const prev = await getHousingById(id)
  // Si se intenta marcar como entregada (inicial o legacy), validar recepción conforme
  const newEstado = (updates?.estado || '').toLowerCase()
  const toDelivered = newEstado === 'entregada' || newEstado === 'entregada_inicial'
    if (toDelivered) {
      // Debe existir una recepción revisada y conforme (sin ítems críticos)
      const { data: recep, error: errRecep } = await supabase
        .from('vivienda_recepcion')
        .select('id, estado')
        .eq('id_vivienda', id)
        .order('id', { ascending:false })
        .limit(1)
      if (errRecep) throw errRecep
      const rec = Array.isArray(recep) && recep.length ? recep[0] : null
      if (!rec || rec.estado !== 'revisada') {
        return res.status(400).json({ success:false, message:'No se puede entregar: recepción no revisada/conforme' })
      }
      // Opcional: verificar que no existan observaciones críticas.
      const { data: items, error: errItems } = await supabase
        .from('vivienda_recepcion_item')
        .select('id, categoria, item, ok')
        .eq('recepcion_id', rec.id)
      if (errItems) throw errItems
      const tieneCriticos = (items||[]).some(i => i.ok === false)
      if (tieneCriticos) {
        return res.status(400).json({ success:false, message:'No se puede entregar: existen observaciones pendientes en recepción' })
      }
      // Forzar flags de recepción conforme para trazabilidad
      updates.recepcion_conforme = true
      updates.fecha_recepcion_conforme = new Date().toISOString()
    }
    const updated = await updateHousing(id, updates)

    // Disparador: si pasa a 'entregada' (legacy) o 'entregada_inicial' y tiene beneficiario, crear automáticamente el form de posventa
    try {
      const prevEstado = (prev?.estado || '').toLowerCase()
      const updatedEstado = (updated?.estado || '').toLowerCase()
      const becameDelivered = !['entregada','entregada_inicial'].includes(prevEstado) && ['entregada','entregada_inicial'].includes(updatedEstado)
      if (becameDelivered && updated?.beneficiario_uid) {
        // Verificar si ya existe un form activo (borrador/enviada)
        const { data: existing, error: errExist } = await supabase
          .from('vivienda_postventa_form')
          .select('id, estado')
          .eq('id_vivienda', updated.id_vivienda)
          .eq('beneficiario_uid', updated.beneficiario_uid)
          .order('id', { ascending: false })
          .limit(1)
        if (errExist) throw errExist
        const hasActive = Array.isArray(existing) && existing.length && ['borrador','enviada'].includes(existing[0].estado)
        if (!hasActive) {
          // Seleccionar template activo por tipo de vivienda (o general)
          const { data: template, error: errTpl } = await supabase
            .from('postventa_template')
            .select('*')
            .eq('activo', true)
            .or(`tipo_vivienda.eq.${updated.tipo_vivienda || ''},tipo_vivienda.is.null`)
            .order('tipo_vivienda', { ascending: false })
            .order('version', { ascending: false })
            .order('id', { ascending: false })
            .limit(1)
          if (errTpl) throw errTpl
          if (template && template.length) {
            const tpl = template[0]
            const { data: inserted, error: errForm } = await supabase
              .from('vivienda_postventa_form')
              .insert([{ id_vivienda: updated.id_vivienda, beneficiario_uid: updated.beneficiario_uid, estado: 'borrador', template_version: tpl.version }])
              .select('*')
            if (errForm) throw errForm
            const form = inserted?.[0]
            // Copiar items del template
            const { data: tplItems, error: errTplItems } = await supabase
              .from('postventa_template_item')
              .select('*')
              .eq('template_id', tpl.id)
              .order('orden', { ascending: true, nullsFirst: false })
              .order('id', { ascending: true })
            if (errTplItems) throw errTplItems
            if (Array.isArray(tplItems) && tplItems.length && form?.id) {
              const payload = tplItems.map((it, idx) => ({ form_id: form.id, categoria: it.categoria, item: it.item, ok: true, severidad: null, comentario: null, crear_incidencia: false, orden: idx + 1 }))
              const { error: errIns } = await supabase.from('vivienda_postventa_item').insert(payload)
              if (errIns) throw errIns
            }
          }
        }
      }
    } catch (e) {
      console.warn('Aviso: no se pudo crear automáticamente el formulario de posventa:', e?.message || e)
    }

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

/**
 * Desasigna el beneficiario de una vivienda
 */
export async function unassignBeneficiary(req, res) {
  try {
    const housingId = Number(req.params.id)
    const updated = await unassignBeneficiaryFromHousing(housingId)
    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error desasignando beneficiario:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error desasignando beneficiario' 
    })
  }
}

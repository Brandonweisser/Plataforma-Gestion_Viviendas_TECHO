import React, { useEffect, useState, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/ui/DashboardLayout';
import { SectionPanel } from '../../components/ui/SectionPanel';
import { adminApi } from '../../services/api';
import { getMe } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

// Gestión de Usuarios (Administrador):
// - Listado de todos los usuarios (admin / técnico / beneficiario)
// - Crear, editar y eliminar (bloquear) usuarios
// - Indicador si beneficiario tiene vivienda asignada
// - Filtros por rol, búsqueda y estado de asignación (solo beneficiarios)
export default function GestionUsuarios() {
  const navigate = useNavigate();
  const { logout, login } = useContext(AuthContext); // user removido (no se usaba)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [viviendas, setViviendas] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [rolFiltro, setRolFiltro] = useState('todos');
  const [proyectoFiltro, setProyectoFiltro] = useState('todos');
  const [soloSinVivienda, setSoloSinVivienda] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('crear'); // crear | editar
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'beneficiario' });
  const [invite, setInvite] = useState({ email: '', nombre: '', rol: 'beneficiario' });

  // Sólo queremos cargar una vez al montar; loadData está estable (no depende de props externas relevantes)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true); setError(''); setSuccess('');
    try {
      const [uRes, vRes, pRes] = await Promise.allSettled([
        adminApi.listarUsuarios(),
        adminApi.listarViviendas(),
        adminApi.listarProyectos()
      ]);

      if (uRes.status === 'fulfilled') {
        setUsuarios(uRes.value.data || []);
      } else {
        const status = uRes.reason?.status;
        const msg = uRes.reason?.message || 'Error listando usuarios';
        // Manejo especial de 401/403
        if (status === 401 || status === 403) {
          // Intentar refrescar /api/me para validar sesión
            try {
              const me = await getMe();
              if (me?.data?.rol) {
                // Rehidratar contexto si faltaba
                login({ ...me.data, role: me.data.rol, token: localStorage.getItem('token') });
                // Reintentar una vez
                const retry = await adminApi.listarUsuarios();
                setUsuarios(retry.data || []);
              } else {
                setError('No autorizado (sesión inválida). Inicia sesión nuevamente.');
              }
            } catch (refreshErr) {
              setError('No autorizado. Vuelve a iniciar sesión.');
            }
        } else {
          setError(msg);
        }
      }

  if (vRes.status === 'fulfilled') setViviendas(vRes.value.data || []);
  if (pRes.status === 'fulfilled') setProyectos(pRes.value.data || []);
    } catch (e) {
      setError(e.message || 'Error cargando datos');
    } finally { setLoading(false); }
  }

  const viviendasPorBeneficiario = useMemo(() => {
    const map = new Map();
    viviendas.forEach(v => { if (v.beneficiario_uid) map.set(v.beneficiario_uid, v); });
    return map;
  }, [viviendas]);

  // Crear usuario se ha deshabilitado: los usuarios se crean por invitación.

  function openEdit(user) {
    setModalMode('editar');
    setSelectedUser(user);
    setForm({ nombre: user.nombre || '', email: user.email || '', password: '', rol: user.rol });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setSelectedUser(null);
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.nombre.trim() || !form.email.trim()) {
      setError('Nombre y email son obligatorios');
      return;
    }
    if (modalMode === 'crear' && !form.password.trim()) {
      setError('La contraseña es obligatoria al crear');
      return;
    }
    setLoading(true);
    try {
      const doCreate = async () => {
        if (modalMode === 'crear') {
          await adminApi.crearUsuario({ nombre: form.nombre.trim(), email: form.email.trim(), rol: form.rol, password: form.password });
          setSuccess('Usuario creado');
        } else if (selectedUser) {
          const payload = { nombre: form.nombre.trim(), rol: form.rol };
          if (form.password.trim()) payload.password = form.password.trim();
          await adminApi.actualizarUsuario(selectedUser.uid, payload);
          setSuccess('Usuario actualizado');
        }
      }

      try {
        await doCreate();
      } catch (err1) {
        // Si es 401/403, intentar rehidratar sesión y reintentar una vez
        if (err1?.status === 401 || err1?.status === 403) {
          try {
            const me = await getMe();
            if (me?.data?.rol) {
              login({ ...me.data, role: me.data.rol, token: localStorage.getItem('token') });
              await doCreate(); // retry
            } else {
              throw err1;
            }
          } catch (rehydrateErr) {
            throw err1;
          }
        } else {
          throw err1;
        }
      }
      closeModal();
      await loadData();
    } catch (e2) {
      setError(e2.message || 'Error guardando usuario');
    } finally { setLoading(false); }
  }

  async function handleDelete(user) {
    if (!window.confirm(`¿Eliminar usuario ${user.email}?`)) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      await adminApi.eliminarUsuario(user.uid);
      setSuccess('Usuario eliminado');
      await loadData();
    } catch (e) {
      setError(e.message || 'Error eliminando usuario');
    } finally { setLoading(false); }
  }

  const filtrados = usuarios.filter(u => {
    if (rolFiltro !== 'todos' && u.rol !== rolFiltro) return false;
    // Filtro por proyecto: aplica solo a beneficiarios y requiere vivienda asignada
    if (proyectoFiltro !== 'todos') {
      if (u.rol !== 'beneficiario') return false;
      const v = viviendasPorBeneficiario.get(u.uid);
      if (!v) return false;
      const pid = v.proyecto_id ?? v.id_proyecto;
      if (String(pid) !== String(proyectoFiltro)) return false;
    }
    if (soloSinVivienda && u.rol === 'beneficiario' && viviendasPorBeneficiario.has(u.uid)) return false;
    if (!buscar) return true;
    const q = buscar.toLowerCase();
    return (u.nombre || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (''+u.uid).includes(q);
  });

  const stats = {
    total: usuarios.length,
    administradores: usuarios.filter(u => u.rol === 'administrador').length,
    tecnicos: usuarios.filter(u => u.rol === 'tecnico').length,
    beneficiarios: usuarios.filter(u => u.rol === 'beneficiario').length,
    beneficiariosAsignados: usuarios.filter(u => u.rol === 'beneficiario' && viviendasPorBeneficiario.has(u.uid)).length
  };

  if (loading && usuarios.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300 text-sm">Cargando usuarios...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabecera: solo título + acciones globales (Volver, Recargar) y métricas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Gestión de Usuarios</h1>
              </div>
              <div className="flex gap-2 items-center">
                <button onClick={() => navigate(-1)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Volver</button>
                <button onClick={loadData} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Recargar</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="px-3 py-1 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 font-medium">Total: {stats.total}</span>
              <span className="px-3 py-1 rounded bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300">Admins: {stats.administradores}</span>
              <span className="px-3 py-1 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">Técnicos: {stats.tecnicos}</span>
              <span className="px-3 py-1 rounded bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300">Beneficiarios: {stats.beneficiarios}</span>
              <span className="px-3 py-1 rounded bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300">Beneficiarios con vivienda: {stats.beneficiariosAsignados}</span>
            </div>
        </div>

        {/* Invitar Usuario (bajo el título). Sin botón Volver interno */}
        <SectionPanel title="Invitar Usuario" description="Envía un enlace para que el usuario cree su contraseña" className="dark:bg-gray-900/40" showBack={false}>
          <form onSubmit={async (e)=>{
            e.preventDefault(); setError(''); setSuccess('');
            try {
              await adminApi.invitarUsuario(invite);
              setSuccess('Invitación enviada (si EMAIL_MODE=development verás la URL en la consola del servidor)');
              setInvite(prev=>({ email: '', nombre: '', rol: prev.rol }));
            } catch (er) {
              if (er.status === 501) setError('Invitaciones no configuradas en BD. Crea la tabla user_invitations (ver docs).');
              else setError(er.message || 'No se pudo enviar la invitación');
            }
          }} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input type="email" required placeholder="Email" value={invite.email} onChange={e=>setInvite(v=>({ ...v, email: e.target.value }))} className="px-3 py-2 border rounded" />
            <input type="text" placeholder="Nombre (opcional)" value={invite.nombre} onChange={e=>setInvite(v=>({ ...v, nombre: e.target.value }))} className="px-3 py-2 border rounded" />
            <select value={invite.rol} onChange={e=>setInvite(v=>({ ...v, rol: e.target.value }))} className="px-3 py-2 border rounded">
              <option value="beneficiario">Beneficiario</option>
              <option value="tecnico">Técnico</option>
              <option value="administrador">Administrador</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Enviar invitación</button>
          </form>
        </SectionPanel>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start justify-between gap-4 text-sm">
            <span>{error}</span>
            {(error.includes('No autorizado') || error.includes('sesión')) && (
              <div className="flex gap-2">
                <button
                  onClick={() => loadData()}
                  className="px-3 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700"
                >Reintentar</button>
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="px-3 py-1 rounded border border-red-400 text-red-600 text-xs hover:bg-red-100"
                >Login</button>
              </div>
            )}
          </div>
        )}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>}

        <SectionPanel title="Filtros" description="Refinar búsqueda" className="dark:bg-gray-900/40" showBack={false}>
          <div className="grid gap-4 md:grid-cols-6 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Buscar</label>
              <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Nombre, email o UID" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Rol</label>
              <select value={rolFiltro} onChange={e => setRolFiltro(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500">
                <option value="todos">Todos</option>
                <option value="administrador">Administrador</option>
                <option value="tecnico">Técnico</option>
                <option value="beneficiario">Beneficiario</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Proyecto</label>
              <select value={proyectoFiltro} onChange={e => setProyectoFiltro(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500">
                <option value="todos">Todos</option>
                {proyectos.map(p => (
                  <option key={p.id_proyecto ?? p.id} value={String(p.id_proyecto ?? p.id)}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input id="soloSinV" type="checkbox" checked={soloSinVivienda} onChange={e => setSoloSinVivienda(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded" />
              <label htmlFor="soloSinV" className="text-xs text-gray-600 dark:text-gray-300">Sólo beneficiarios sin vivienda</label>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{filtrados.length} resultados</div>
          </div>
        </SectionPanel>

  <SectionPanel title="Usuarios" description="Listado general" className="dark:bg-gray-900/40" showBack={false}>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300">
                  <th className="py-2 px-4 font-semibold">UID</th>
                  <th className="py-2 px-4 font-semibold">Nombre</th>
                  <th className="py-2 px-4 font-semibold">Email</th>
                  <th className="py-2 px-4 font-semibold">Rol</th>
                  <th className="py-2 px-4 font-semibold">Vivienda / Estado</th>
                  <th className="py-2 px-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500 dark:text-gray-400">Sin resultados</td>
                  </tr>
                )}
                {filtrados.map(u => {
                  const v = u.rol === 'beneficiario' ? viviendasPorBeneficiario.get(u.uid) : null;
                  return (
                    <tr key={u.uid} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                      <td className="py-2 px-4 font-mono text-xs text-gray-500 dark:text-gray-400">{u.uid}</td>
                      <td className="py-2 px-4 text-gray-800 dark:text-gray-100">{u.nombre}</td>
                      <td className="py-2 px-4 text-gray-600 dark:text-gray-300">{u.email}</td>
                      <td className="py-2 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.rol === 'administrador' ? 'bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300' : u.rol === 'tecnico' ? 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300' : 'bg-teal-100 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300'}`}>{u.rol}</span>
                      </td>
                      <td className="py-2 px-4 text-xs">
                        {u.rol === 'beneficiario' ? (
                          v ? (
                            <div className="flex flex-col">
                              <span className="text-gray-700 dark:text-gray-200 font-medium">{v.direccion}</span>
                              <span className="text-[11px] text-gray-500 dark:text-gray-400">Estado: {v.estado}</span>
                            </div>
                          ) : <span className="text-gray-400 italic">Sin vivienda</span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="py-2 px-4 space-x-2">
                        <button onClick={() => openEdit(u)} className="text-xs px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white">Editar</button>
                        <button onClick={() => handleDelete(u)} className="text-xs px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white">Eliminar</button>
                        {u.rol === 'beneficiario' && (
                          v ? (
                            <button onClick={() => navigate('/admin/viviendas')} className="text-xs px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white">Ver Vivienda</button>
                          ) : (
                            <button onClick={() => navigate('/admin/asignaciones')} className="text-xs px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white">Asignar</button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionPanel>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{modalMode === 'crear' ? 'Crear Usuario' : 'Editar Usuario'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Nombre</label>
                <input name="nombre" value={form.nombre} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleFormChange} disabled={modalMode==='editar'} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-sm disabled:opacity-60" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Rol</label>
                  <select name="rol" value={form.rol} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-sm">
                    <option value="administrador">Administrador</option>
                    <option value="tecnico">Técnico</option>
                    <option value="beneficiario">Beneficiario</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Contraseña {modalMode==='editar' && <span className="text-gray-400">(opcional)</span>}</label>
                  <input name="password" type="password" value={form.password} onChange={handleFormChange} placeholder={modalMode==='editar' ? 'Dejar en blanco para no cambiar' : ''} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-sm" />
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <button type="submit" disabled={loading} className="flex-1 min-w-[140px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50">{loading ? 'Guardando...' : modalMode==='crear' ? 'Crear' : 'Actualizar'}</button>
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-50 dark:hover:bg-gray-700">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

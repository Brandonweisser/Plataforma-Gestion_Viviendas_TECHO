import React, { useEffect, useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../../components/ui/DashboardLayout'
import { SectionPanel } from '../../components/ui/SectionPanel'
import { adminApi } from '../../services/api'
import { AuthContext } from '../../context/AuthContext'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function Constructoras() {
  const navigate = useNavigate()
  const { logout } = useContext(AuthContext)
  const [constructoras, setConstructoras] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState('crear') // crear | editar
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ nombre: '', rut: '', contacto_email: '', telefono: '', direccion: '' })
  const [usuarios, setUsuarios] = useState([])
  const [showUsersFor, setShowUsersFor] = useState(null)

  useEffect(()=>{ load() }, [])

  async function load() {
    setLoading(true); setError('')
    try {
      const res = await adminApi.listarConstructoras()
      setConstructoras(res.data || [])
    } catch (e) {
      setError(e.message || 'Error cargando constructoras')
    } finally { setLoading(false) }
  }

  function openCreate() {
    setFormMode('crear'); setSelected(null); setForm({ nombre: '', rut: '', contacto_email: '', telefono: '', direccion: '' }); setShowForm(true)
  }

  function openEdit(c) {
    setFormMode('editar'); setSelected(c); setForm({ nombre: c.nombre || '', rut: c.rut || '', contacto_email: c.contacto_email || '', telefono: c.telefono || '', direccion: c.direccion || '' }); setShowForm(true)
  }

  function closeForm() { setShowForm(false); setSelected(null) }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev=>({ ...prev, [name]: value }))
  }

  async function submitForm(e) {
    e.preventDefault(); setError('')
    if (!form.nombre || !form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setLoading(true)
    try {
      if (formMode === 'crear') {
        await adminApi.crearConstructora(form)
      } else if (selected) {
        await adminApi.actualizarConstructora(selected.id, form)
      }
      closeForm()
      await load()
    } catch (err) {
      setError(err.message || 'Error guardando')
    } finally { setLoading(false) }
  }

  async function handleDelete(c) {
    if (!window.confirm(`Eliminar constructora ${c.nombre}?`)) return
    setLoading(true); setError('')
    try {
      await adminApi.eliminarConstructora(c.id)
      await load()
    } catch (e) { setError(e.message || 'Error eliminando') } finally { setLoading(false) }
  }

  async function viewUsers(c) {
    setShowUsersFor(c.id); setUsuarios([]); setError('')
    try {
      const res = await adminApi.listarUsuariosPorConstructora(c.id)
      setUsuarios(res.data || [])
    } catch (e) { setError(e.message || 'Error listando usuarios') }
  }

  return (
    <DashboardLayout title="Constructoras" subtitle="Gestión de empresas constructoras" user={{}} onLogout={()=>{ logout(); window.location='/' }}>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Constructoras</h1>
            <p className="text-sm text-techo-gray-600 dark:text-techo-gray-300">Administra las empresas constructoras y asigna técnicos</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => navigate('/home')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Volver
            </button>
            <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Nueva Constructora</button>
            <button onClick={load} className="px-4 py-2 border border-gray-300 rounded-lg">Recargar</button>
          </div>
        </div>

        <SectionPanel title="Listado" description="Constructoras registradas">
          {loading && <p className="text-sm">Cargando...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && constructoras.length === 0 && <p className="text-sm text-techo-gray-500">Sin constructoras registradas.</p>}
          {!loading && constructoras.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-techo-gray-100 dark:border-techo-gray-700 shadow-soft">
              <table className="min-w-full text-sm">
                <thead className="bg-techo-gray-50 dark:bg-techo-gray-800/60 text-techo-gray-600 dark:text-techo-gray-300">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase">ID</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase">Nombre</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase">Contacto</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase">Teléfono</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase">Dirección</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-techo-gray-100 dark:divide-techo-gray-700">
                  {constructoras.map(c=> (
                    <tr key={c.id} className="bg-white/60 dark:bg-techo-gray-800/60 hover:bg-white dark:hover:bg-techo-gray-700">
                      <td className="px-3 py-2 font-mono text-xs">{c.id}</td>
                      <td className="px-3 py-2 text-xs">{c.nombre}</td>
                      <td className="px-3 py-2 text-xs">{c.contacto_email || '-'}</td>
                      <td className="px-3 py-2 text-xs">{c.telefono || '-'}</td>
                      <td className="px-3 py-2 text-xs">{c.direccion || '-'}</td>
                      <td className="px-3 py-2 flex gap-2">
                        <button onClick={()=>openEdit(c)} className="btn btn-secondary btn-xs">Editar</button>
                        <button onClick={()=>handleDelete(c)} className="btn btn-danger btn-xs">Eliminar</button>
                        <button onClick={()=>viewUsers(c)} className="btn btn-primary btn-xs">Ver usuarios</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionPanel>

        {showForm && (
          <SectionPanel title={formMode==='crear'? 'Nueva Constructora' : 'Editar Constructora'} description="Completa los datos">
            <form onSubmit={submitForm} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-techo-gray-600">Nombre *</label>
                <input name="nombre" value={form.nombre} onChange={handleChange} className="form-input" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-techo-gray-600">RUT</label>
                <input name="rut" value={form.rut} onChange={handleChange} className="form-input" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-techo-gray-600">Email contacto</label>
                <input name="contacto_email" value={form.contacto_email} onChange={handleChange} className="form-input" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-techo-gray-600">Teléfono</label>
                <input name="telefono" value={form.telefono} onChange={handleChange} className="form-input" />
              </div>
              <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                <label className="text-xs font-medium text-techo-gray-600">Dirección</label>
                <input name="direccion" value={form.direccion} onChange={handleChange} className="form-input" />
              </div>
              <div className="col-span-1 md:col-span-2 flex gap-2 justify-end">
                <button type="button" onClick={closeForm} className="px-4 py-2 border rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
              </div>
              {error && <div className="col-span-2 text-sm text-red-600">{error}</div>}
            </form>
          </SectionPanel>
        )}

        {showUsersFor && (
          <SectionPanel title={`Usuarios - Constructora ${showUsersFor}`} description="Usuarios asignados">
            {usuarios.length === 0 && <p className="text-sm text-techo-gray-500">Sin usuarios asignados.</p>}
            {usuarios.length > 0 && (
              <ul className="divide-y divide-techo-gray-100 dark:divide-techo-gray-700">
                {usuarios.map(u=> (
                  <li key={u.uid} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{u.nombre || u.email}</div>
                      <div className="text-xs text-techo-gray-500">UID: {u.uid} • Rol: {u.rol}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={async ()=>{ await adminApi.removerConstructoraUsuario(u.uid); viewUsers({id: showUsersFor}) }} className="btn btn-secondary btn-xs">Remover</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex justify-end">
              <button onClick={()=>{ setShowUsersFor(null); setUsuarios([]) }} className="px-3 py-1 border rounded">Cerrar</button>
            </div>
          </SectionPanel>
        )}

      </div>
    </DashboardLayout>
  )
}

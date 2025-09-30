import React, { useEffect, useState, useContext, useCallback } from 'react'
import { AuthContext } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../../components/ui/DashboardLayout'
import { SectionPanel } from '../../components/ui/SectionPanel'

export default function ViviendasTecnico() {
  const { user, logout } = useContext(AuthContext)
  // Token se guarda dentro del objeto user (según login) o en localStorage
  const token = localStorage.getItem('token') || user?.token
  const navigate = useNavigate()

  const [viviendas, setViviendas] = useState([])
  const [loading, setLoading] = useState(true)
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [proyectos, setProyectos] = useState([])
  const [proyectoFiltro, setProyectoFiltro] = useState('')
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      if (!token) throw new Error('Token ausente')
      const params = new URLSearchParams()
      if (estadoFiltro) params.append('estado', estadoFiltro)
      // Cargamos todas y luego filtramos por proyecto en cliente (backend ya devuelve project name)
      const r = await fetch(`/api/tecnico/viviendas?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
      const j = await r.json()
      if (j.message && j.message.toLowerCase().includes('token')) {
        throw new Error('TOKEN_INVALIDO')
      }
      if (!j.success) throw new Error(j.message || 'Error al cargar')
      const data = j.data || []
      setViviendas(data)
      const distinctProy = [...new Set(data.map(v => v.proyecto_nombre).filter(Boolean))].map(n => ({ nombre: n }))
      setProyectos(distinctProy)
    } catch (e) {
      if (e.message === 'TOKEN_INVALIDO') {
        setError('Token inválido o expirado. Inicia sesión nuevamente.')
        setTimeout(() => { logout(); navigate('/') }, 1800)
      } else {
        setError(e.message)
      }
    } finally { setLoading(false) }
  }, [token, estadoFiltro, logout, navigate])

  useEffect(() => { load() }, [load])

  function filtrarLista(vs) {
    return vs.filter(v => !proyectoFiltro || v.proyecto_nombre === proyectoFiltro)
  }

  async function entregar(id) {
    if (!window.confirm('¿Confirmar entrega de la vivienda?')) return
    try {
      const r = await fetch(`/api/tecnico/viviendas/${id}/entregar`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      const j = await r.json()
      if (!j.success) throw new Error(j.message || 'Error al entregar')
      load()
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <DashboardLayout
      title="Viviendas"
      subtitle="Listado y gestión de entrega"
      user={user || {}}
      onLogout={() => { logout(); navigate('/') }}
      accent="orange"
      footer={`© ${new Date().getFullYear()} TECHO`}
    >
      <div className="space-y-8">
        <SectionPanel title="Filtros" description="Ajusta la vista de viviendas">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-techo-gray-600 dark:text-techo-gray-300">Estado</label>
              <select value={estadoFiltro} onChange={e => setEstadoFiltro(e.target.value)} className="form-select">
                <option value="">Todos</option>
                <option value="planificada">Planificada</option>
                <option value="en_construccion">En construcción</option>
                <option value="entregada">Entregada</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-techo-gray-600 dark:text-techo-gray-300">Proyecto</label>
              <select value={proyectoFiltro} onChange={e => setProyectoFiltro(e.target.value)} className="form-select">
                <option value="">Todos</option>
                {proyectos.map(p => <option key={p.nombre} value={p.nombre}>{p.nombre}</option>)}
              </select>
            </div>
            <button onClick={load} className="btn btn-primary self-start md:self-auto">Refrescar</button>
          </div>
          {error && <p className="mt-3 text-sm text-red-600 font-medium">{error}</p>}
        </SectionPanel>

        <SectionPanel title="Listado" description="Resultados filtrados">
          {loading && <p className="text-sm">Cargando...</p>}
          {!loading && filtrarLista(viviendas).length === 0 && !error && (
            <p className="text-sm text-techo-gray-500">Sin viviendas para los filtros seleccionados.</p>
          )}
          {!loading && !error && filtrarLista(viviendas).length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-techo-gray-100 dark:border-techo-gray-700 shadow-soft">
              <table className="min-w-full text-sm">
                <thead className="bg-techo-gray-50 dark:bg-techo-gray-800/60 text-techo-gray-600 dark:text-techo-gray-300">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide">ID</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide">Proyecto</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide">Dirección</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide">Estado</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide">Beneficiario</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide">Asignación</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide">Entrega</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-techo-gray-100 dark:divide-techo-gray-700">
                  {filtrarLista(viviendas).map(v => {
                    const puedeEntregar = v.estado === 'asignada' && v.asignada
                    const badgeClass = v.estado === 'entregada'
                      ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                      : v.estado === 'asignada'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                        : v.estado === 'en_construccion'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                          : 'bg-gray-200 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300'
                    return (
                      <tr key={v.id_vivienda} className="bg-white/60 dark:bg-techo-gray-800/60 hover:bg-white dark:hover:bg-techo-gray-700 transition-colors">
                        <td className="px-3 py-2 font-mono text-xs">{v.id_vivienda}</td>
                        <td className="px-3 py-2 text-xs">{v.proyecto_nombre || '-'}</td>
                        <td className="px-3 py-2 text-xs">{v.direccion}</td>
                        <td className="px-3 py-2 text-xs">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${badgeClass}`}>{v.estado}</span>
                        </td>
                        <td className="px-3 py-2 text-xs">{v.beneficiario_uid || '-'}</td>
                        <td className="px-3 py-2 text-xs">{v.asignada ? 'Asignada' : 'No asignada'}</td>
                        <td className="px-3 py-2 text-xs">{v.fecha_entrega || '-'}</td>
                        <td className="px-3 py-2 flex gap-1">
                          {puedeEntregar && <button onClick={() => entregar(v.id_vivienda)} className="btn btn-primary btn-xs">Entregar</button>}
                          {v.estado === 'entregada' && <button onClick={() => navigate(`/tecnico/incidencias?vivienda=${v.id_vivienda}`)} className="btn btn-secondary btn-xs">Incidencias</button>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionPanel>
      </div>
    </DashboardLayout>
  )
}

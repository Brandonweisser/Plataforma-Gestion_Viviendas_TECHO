import React, { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '../../components/ui/DashboardLayout'
import { SectionPanel } from '../../components/ui/SectionPanel'
import { tecnicoApi } from '../../services/api'

function ymNow() {
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export default function TecnicoDashboard() {
  const [month, setMonth] = useState(ymNow())
  const [stats, setStats] = useState({ asignadas: 0, pendientes: 0, resueltas: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const monthLabel = useMemo(() => {
    const [y, m] = month.split('-').map(Number)
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleString('es-CL', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  }, [month])

  useEffect(() => {
    let mounted = true
    setLoading(true); setError('')
    tecnicoApi.dashboardStats(month)
      .then(res => { if (!mounted) return; setStats(res.data || { asignadas:0, pendientes:0, resueltas:0 }) })
      .catch(err => { if (!mounted) return; setError(err.message || 'Error cargando estadísticas') })
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [month])

  return (
    <DashboardLayout title="Panel Técnico" subtitle="Área de trabajo operativo" accent="orange">
      <div className="space-y-8">
        <SectionPanel title="Panel de Trabajo" description="Gestiona asignaciones y resuelve incidencias.">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-techo-gray-600">Mes</label>
              <input type="month" className="input" value={month} onChange={e => setMonth(e.target.value)} />
            </div>
            <div className="text-sm text-techo-gray-500">Estadísticas para {monthLabel}</div>
          </div>
          {loading && <div className="text-sm">Cargando...</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-techo-gray-100 shadow-soft bg-white p-4">
                <div className="text-xs uppercase font-semibold text-techo-gray-500">Asignadas</div>
                <div className="text-3xl font-bold mt-1">{stats.asignadas}</div>
                <div className="text-xs text-techo-gray-500">Viviendas asignadas este mes</div>
              </div>
              <div className="rounded-xl border border-techo-gray-100 shadow-soft bg-white p-4">
                <div className="text-xs uppercase font-semibold text-techo-gray-500">Pendientes</div>
                <div className="text-3xl font-bold mt-1">{stats.pendientes}</div>
                <div className="text-xs text-techo-gray-500">Incidencias por atender</div>
              </div>
              <div className="rounded-xl border border-techo-gray-100 shadow-soft bg-white p-4">
                <div className="text-xs uppercase font-semibold text-techo-gray-500">Resueltas</div>
                <div className="text-3xl font-bold mt-1">{stats.resueltas}</div>
                <div className="text-xs text-techo-gray-500">Incidencias resueltas este mes</div>
              </div>
            </div>
          )}
        </SectionPanel>

        <SectionPanel title="Herramientas de trabajo" description="Acciones y módulos frecuentes">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-techo-gray-100 shadow-soft bg-white p-4">
              <div className="text-sm font-semibold">Viviendas</div>
              <div className="text-xs text-techo-gray-500 mb-2">Listado y entrega de viviendas</div>
              <a href="/tecnico/viviendas" className="btn btn-primary">Acceder</a>
            </div>
            <div className="rounded-xl border border-techo-gray-100 shadow-soft bg-white p-4">
              <div className="text-sm font-semibold">Panel de mis asignaciones</div>
              <div className="text-xs text-techo-gray-500 mb-2">Gestionar viviendas e incidencias asignadas</div>
              <a href="/tecnico/incidencias?asignacion=asignadas" className="btn btn-primary">Acceder</a>
            </div>
            <div className="rounded-xl border border-techo-gray-100 shadow-soft bg-white p-4">
              <div className="text-sm font-semibold">Formularios de posventa</div>
              <div className="text-xs text-techo-gray-500 mb-2">Revisar formularios enviados por beneficiarios</div>
              <a href="/tecnico/posventa" className="btn btn-primary">Acceder</a>
            </div>
          </div>
        </SectionPanel>
      </div>
    </DashboardLayout>
  )
}

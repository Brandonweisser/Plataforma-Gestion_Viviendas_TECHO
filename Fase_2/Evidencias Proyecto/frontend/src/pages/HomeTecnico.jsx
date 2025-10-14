import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { StatCard } from "../components/ui/StatCard";
import { ActionCard } from "../components/ui/ActionCard";
import { SectionPanel } from "../components/ui/SectionPanel";
import { DashboardLayout } from "../components/ui/DashboardLayout";
import { tecnicoApi } from "../services/api";
import {
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  ChatBubbleBottomCenterTextIcon,
  WrenchScrewdriverIcon,
  CubeIcon,
  DocumentTextIcon,
  CheckBadgeIcon,
  BoltIcon,
  CalendarDaysIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

export default function HomeTecnico() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/"); };
  const iconSize = 'h-6 w-6';

  // Helper para YYYY-MM actual (UTC)
  function ymNow() {
    const d = new Date()
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    return `${y}-${m}`
  }

  const [month, setMonth] = useState(ymNow())
  const [stats, setStats] = useState({ asignadas: 0, pendientes: 0, resueltas: 0 })
  const [loadingStats, setLoadingStats] = useState(true)
  const [errorStats, setErrorStats] = useState('')
  const monthInputRef = useRef(null)

  const monthLabel = useMemo(() => {
    const [y, m] = (month || '').split('-').map(Number)
    if (!y || !m) return ''
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleString('es-CL', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  }, [month])

  useEffect(() => {
    let mounted = true
    setLoadingStats(true); setErrorStats('')
    tecnicoApi.dashboardStats(month)
      .then(res => { if (!mounted) return; setStats(res.data || { asignadas:0, pendientes:0, resueltas:0 }) })
      .catch(err => { if (!mounted) return; setErrorStats(err.message || 'Error cargando estadísticas') })
      .finally(() => mounted && setLoadingStats(false))
    return () => { mounted = false }
  }, [month])

  function shiftMonth(delta) {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(Date.UTC(y, m - 1, 1))
    d.setUTCMonth(d.getUTCMonth() + delta)
    const ny = d.getUTCFullYear()
    const nm = String(d.getUTCMonth() + 1).padStart(2, '0')
    setMonth(`${ny}-${nm}`)
  }

  console.log('🏠 HomeTecnico - Estado de autenticación:');
  console.log('  - user:', user);
  console.log('  - localStorage user:', localStorage.getItem('user'));
  console.log('  - localStorage token:', localStorage.getItem('token'));

  const tools = [
    { title: 'Viviendas', description: 'Listado y entrega de viviendas', badge: 'ver', action: () => navigate('/tecnico/viviendas'), icon: <ClipboardDocumentListIcon className={iconSize} />, accent: 'orange' },
    { title: 'Panel de Mis Asignaciones', description: 'Gestionar viviendas e incidencias asignadas', badge: `${stats.asignadas} asignadas`, action: () => navigate('/tecnico/incidencias?asignacion=asignadas'), icon: <ClipboardDocumentListIcon className={iconSize} />, accent: 'orange' },
    { title: 'Formularios de Posventa', description: 'Revisar formularios enviados por beneficiarios', badge: 'pendientes', action: () => navigate('/tecnico/posventa/formularios'), icon: <DocumentTextIcon className={iconSize} />, accent: 'blue' },
    { title: 'Incidencias Críticas', description: 'Atender reportes urgentes inmediatamente', badge: 'urgente', action: () => navigate('/tecnico/incidencias'), icon: <ExclamationTriangleIcon className={iconSize} />, accent: 'red', urgent: true },
    { title: 'Inspecciones Programadas', description: 'Inspecciones preventivas de la jornada', badge: 'hoy', action: () => console.log('Inspecciones'), icon: <CalendarDaysIcon className={iconSize} />, accent: 'green' },
    { title: 'Gestión de Inventario', description: 'Control de materiales y herramientas', badge: 'stock', action: () => console.log('Inventario'), icon: <CubeIcon className={iconSize} />, accent: 'purple' },
    { title: 'Centro de Comunicación', description: 'Chat con actores relevantes', badge: 'mensajes', action: () => console.log('Comunicación'), icon: <ChatBubbleBottomCenterTextIcon className={iconSize} />, accent: 'teal' }
  ];

  const urgentIncidents = [
    { id: 101, vivienda: 'Casa #45', problema: 'Filtración de agua en techo', prioridad: 'Alta', fecha: '2024-01-16', descripcion: 'Goteras importantes en habitación principal' },
    { id: 102, vivienda: 'Casa #23', problema: 'Problema eléctrico', prioridad: 'Media', fecha: '2024-01-15', descripcion: 'Cortes intermitentes de energía' },
    { id: 103, vivienda: 'Casa #67', problema: 'Puerta dañada', prioridad: 'Baja', fecha: '2024-01-14', descripcion: 'Puerta principal no cierra correctamente' }
  ];
  const priorityColor = (p) => ({
    'Alta': 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
    'Media': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300',
    'Baja': 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300'
  }[p] || 'bg-techo-gray-100 text-techo-gray-600 dark:bg-techo-gray-700 dark:text-techo-gray-300');

  const agenda = [
    { id: 1, hora: '09:00', titulo: 'Inspección Casa #23', detalle: 'Verificar reparación eléctrica', color: 'from-blue-500 via-cyan-400 to-techo-accent-400' },
    { id: 2, hora: '11:30', titulo: 'Reparación Casa #45', detalle: 'Filtración de agua', color: 'from-orange-500 via-amber-400 to-yellow-300' },
    { id: 3, hora: '14:00', titulo: 'Entrega materiales Casa #67', detalle: 'Puerta nueva', color: 'from-green-500 via-emerald-400 to-lime-300' }
  ];

  return (
    <DashboardLayout
      title="Panel Técnico"
      subtitle="Área de trabajo operativo"
      user={user || {}}
      onLogout={handleLogout}
      accent="orange"
      footer={`© ${new Date().getFullYear()} TECHO – Panel Técnico`}
    >
      <div className="space-y-10" role="region" aria-label="Contenido principal técnico">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-techo-gray-800 dark:text-white">Panel de Trabajo</h2>
          <p className="text-sm text-techo-gray-600 dark:text-techo-gray-300">Gestiona asignaciones y resuelve incidencias.</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-techo-gray-500">Estadísticas para {monthLabel}</div>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost btn-xs" title="Mes anterior" onClick={() => shiftMonth(-1)}>◀</button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-full border border-techo-gray-200 dark:border-techo-gray-700 bg-white dark:bg-techo-gray-800 text-xs font-medium text-techo-gray-700 dark:text-techo-gray-200 hover:border-techo-accent-400 hover:text-techo-accent-600 transition-colors"
              onClick={() => monthInputRef.current?.showPicker?.() || monthInputRef.current?.focus()}
            >
              <span className="inline-flex items-center gap-1">
                <span className="opacity-70">📅</span> {monthLabel}
              </span>
            </button>
            <input
              ref={monthInputRef}
              type="month"
              className="sr-only absolute opacity-0 pointer-events-none"
              value={month}
              onChange={e => setMonth(e.target.value)}
            />
            <button className="btn btn-ghost btn-xs" title="Mes siguiente" onClick={() => shiftMonth(1)}>▶</button>
          </div>
          {loadingStats && <div className="text-xs text-techo-gray-500">Cargando…</div>}
          {errorStats && <div className="text-xs text-red-600">{errorStats}</div>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <button className="text-left" onClick={() => navigate('/tecnico/incidencias?asignacion=asignadas')}>
            <StatCard icon={<ClipboardDocumentListIcon className={iconSize} />} label="Asignadas" value={String(stats.asignadas)} subtitle="Viviendas" accent='orange' />
          </button>
          <button className="text-left" onClick={() => navigate('/tecnico/incidencias?estado=abierta,en_proceso')}>
            <StatCard icon={<WrenchScrewdriverIcon className={iconSize} />} label="Pendientes" value={String(stats.pendientes)} subtitle="Incidencias" accent='red' />
          </button>
          <button className="text-left" onClick={() => navigate('/tecnico/incidencias?estado=resuelta,cerrada')}>
            <StatCard icon={<CheckBadgeIcon className={iconSize} />} label="Finalizadas" value={String(stats.finalizadas || stats.resueltas || 0)} subtitle="Este mes" accent='green' />
          </button>
          <StatCard icon={<BoltIcon className={iconSize} />} label="Calificación" value="4.8" subtitle="Promedio" accent='purple' />
        </div>
        <SectionPanel title="Herramientas de Trabajo" description="Acciones y módulos frecuentes" as="section">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tools.map((t,i) => (
              <ActionCard key={i} title={t.title} description={t.description} badge={t.badge} urgent={t.urgent} onClick={t.action} icon={t.icon} accent={t.accent} cta={t.urgent ? '¡Atender Urgente!' : undefined} />
            ))}
          </div>
        </SectionPanel>
  <SectionPanel title="Incidencias Urgentes" description="Prioriza resoluciones críticas" as="section" variant='highlight'>
          <ul className="space-y-3" aria-label="Listado de incidencias urgentes">
            {urgentIncidents.map(inc => (
              <li 
                key={inc.id} 
                className="card-surface p-4 flex flex-col sm:flex-row sm:items-start gap-4 border-l-4 border-orange-500 dark:border-orange-400 hover:bg-gray-50 dark:hover:bg-techo-gray-700 transition-colors cursor-pointer group" 
                onClick={() => {
                  console.log('🖱️ Clic en incidencia:', inc.id);
                  console.log('🔍 Estado antes de navegar:');
                  console.log('  - user en contexto:', user);
                  console.log('  - localStorage user:', localStorage.getItem('user'));
                  console.log('  - localStorage token:', localStorage.getItem('token'));
                  navigate(`/tecnico/incidencias/${inc.id}`);
                }}
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-techo-gray-800 dark:text-white mb-0.5 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{inc.vivienda}</h4>
                  <p className="text-xs text-techo-gray-600 dark:text-techo-gray-400 mb-1">{inc.problema}</p>
                  {inc.descripcion && (
                    <p className="text-[11px] text-techo-gray-500 dark:text-techo-gray-400 mb-1">{inc.descripcion}</p>
                  )}
                  <p className="text-[11px] text-techo-gray-500 dark:text-techo-gray-400">Reportado: {inc.fecha}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${priorityColor(inc.prioridad)}`}>{inc.prioridad}</span>
                  <button 
                    className="btn btn-primary text-xs px-3 py-1 group-hover:bg-orange-600 group-hover:border-orange-600 transition-colors" 
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('🖱️ Clic en botón Ver Detalle:', inc.id);
                      console.log('🔍 Estado antes de navegar:');
                      console.log('  - user en contexto:', user);
                      console.log('  - localStorage user:', localStorage.getItem('user'));
                      console.log('  - localStorage token:', localStorage.getItem('token'));
                      navigate(`/tecnico/incidencias/${inc.id}`);
                    }}
                  >
                    Ver Detalle
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-end">
            <button className="btn btn-secondary text-xs" onClick={() => navigate('/tecnico/incidencias')}>Ver todas las incidencias</button>
          </div>
        </SectionPanel>
        <SectionPanel title="Agenda de Hoy" description="Actividades programadas" as="section">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agenda.map(item => (
              <div key={item.id} className="relative overflow-hidden rounded-xl p-4 bg-white dark:bg-techo-gray-800 border border-techo-gray-100 dark:border-techo-gray-700 shadow-soft">
                <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${item.color}`} aria-hidden></div>
                <div className="relative">
                  <time className="text-xs font-medium text-techo-gray-600 dark:text-techo-gray-300">{item.hora}</time>
                  <h4 className="mt-1 text-sm font-semibold text-techo-gray-800 dark:text-white">{item.titulo}</h4>
                  <p className="text-xs text-techo-gray-600 dark:text-techo-gray-300">{item.detalle}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionPanel>
        <SectionPanel title="Acciones Rápidas" description="Atajos inmediatos" as="section" variant='highlight'>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button className="btn btn-secondary flex items-center justify-center gap-2 text-sm"><PhoneIcon className="h-4 w-4" /> Llamar Coordinador</button>
            <button className="btn btn-secondary flex items-center justify-center gap-2 text-sm"><DocumentTextIcon className="h-4 w-4" /> Reportar Progreso</button>
            <button className="btn bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2 text-sm"><ExclamationTriangleIcon className="h-4 w-4" /> Emergencia</button>
          </div>
        </SectionPanel>
      </div>
    </DashboardLayout>
  );
}
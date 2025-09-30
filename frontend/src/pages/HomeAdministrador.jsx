import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { StatCard } from "../components/ui/StatCard";
import { ActionCard } from "../components/ui/ActionCard";
import { SectionPanel } from "../components/ui/SectionPanel";
import { DashboardLayout } from "../components/ui/DashboardLayout";
import {
  UsersIcon,
  HomeModernIcon,
  WrenchScrewdriverIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { adminApi } from '../services/api';

export default function HomeAdministrador() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Debug logs (deshabilitables)
  const DEBUG = false;
  if (DEBUG) {
    console.log("🏛️ HomeAdministrador - Usuario actual:", user);
    console.log("🏛️ HomeAdministrador - Rol del usuario:", user?.rol || user?.role);
  }
  
  const handleLogout = () => { logout(); navigate("/"); };
  const handleNavigation = (path, description) => {
    if (DEBUG) {
      console.log(`🧭 Navegando a ${description}: ${path}`);
      console.log(`🧭 Usuario antes de navegar:`, user);
      console.log(`🧭 Rol antes de navegar:`, user?.rol || user?.role);
    }
    console.log('[HomeAdministrador] Navegación solicitada ->', path);
    navigate(path);
  };

  const iconSize = 'h-6 w-6';


  const [stats, setStats] = useState({
    usuarios: { total: 0, administrador: 0, tecnico: 0, beneficiario: 0 },
    viviendas: { total: 0 },
    incidencias: { abiertas: 0 },
    loading: true,
    error: null
  });

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        const res = await adminApi.obtenerEstadisticas();
        if (!cancelled && res?.data) {
          setStats(s => ({ ...s, ...res.data, loading: false, error: null }));
        }
      } catch (e) {
        if (!cancelled) setStats(s => ({ ...s, loading: false, error: e.message || 'Error cargando estadísticas' }));
      }
    }
    loadStats();
    const interval = setInterval(loadStats, 60_000); // refresco cada minuto
    return () => { cancelled = true; clearInterval(interval); };
  }, []);
  const adminSections = [
    { title: "Gestión de Proyectos", description: "Crear proyectos y asignar técnicos responsables", badge: "Nuevo", action: () => handleNavigation('/admin/proyectos', 'Gestión de Proyectos'), icon: <ClipboardDocumentListIcon className={iconSize} />, accent: 'blue' },
    { title: "Gestión de Viviendas", description: "Administrar viviendas y sus características", badge: `${stats.viviendas.total} registradas`, action: () => handleNavigation('/admin/viviendas', 'Gestión de Viviendas'), icon: <HomeModernIcon className={iconSize} />, accent: 'green' },
    { title: "Asignación de Viviendas", description: "Asignar viviendas a beneficiarios", badge: "Disponible", action: () => handleNavigation('/admin/asignaciones', 'Asignación de Viviendas'), icon: <UsersIcon className={iconSize} />, accent: 'purple' },
    { title: "Gestión de Usuarios", description: "Crear, editar y bloquear cuentas del sistema", badge: `${stats.usuarios.total} usuarios`, action: () => handleNavigation('/admin/usuarios', 'Gestión de Usuarios'), icon: <UsersIcon className={iconSize} />, accent: 'orange' },
  { title: "Supervisión de Incidencias", description: "Monitorear incidencias y asignaciones críticas", badge: `${stats.incidencias.abiertas} abiertas`, action: () => handleNavigation('/home/incidencias', 'Incidencias'), icon: <WrenchScrewdriverIcon className={iconSize} />, accent: 'cyan' },
  { title: "KPIs y Métricas", description: "Visualizaciones y análisis detallado", badge: "Gráficos", to: '/admin/kpis', action: () => handleNavigation('/admin/kpis', 'KPIs'), icon: <ChartBarIcon className={iconSize} />, accent: 'pink' }
  ];

  const recentActivity = [
    { id: 1, text: 'Nueva vivienda registrada por Juan Pérez', color: 'bg-green-500', time: 'Hace 2 horas' },
    { id: 2, text: 'Incidencia reportada en Vivienda #45', color: 'bg-orange-500', time: 'Hace 4 horas' },
    { id: 3, text: 'Técnico asignado a incidencia #123', color: 'bg-blue-500', time: 'Hace 6 horas' }
  ];

  return (
    <DashboardLayout
      title={`Panel Administrador - ${user?.rol || user?.role || 'Sin rol'}`}
      subtitle={`Sistema de Gestión de Viviendas - Usuario: ${user?.nombre || user?.email || 'Sin identificar'}`}
      user={user || {}}
      onLogout={handleLogout}
      accent="blue"
      footer={`© ${new Date().getFullYear()} TECHO – Panel Administrador`}
    >
      <div className="space-y-10" role="region" aria-label="Contenido principal administrador">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-techo-gray-800 dark:text-white">Panel de Control</h2>
          <p className="text-sm text-techo-gray-600 dark:text-techo-gray-300">Administra todos los aspectos del sistema.</p>
          
          {/* Bloque de test removido para versión final; activar DEBUG para reinsertar herramientas */}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 flex-1">
          <StatCard icon={<UsersIcon className={iconSize} />} label="Usuarios" value={stats.loading ? '—' : stats.usuarios.total} subtitle={stats.loading ? 'Cargando' : `${stats.usuarios.administrador || 0} Admin / ${stats.usuarios.tecnico || 0} Tec / ${stats.usuarios.beneficiario || 0} Ben`} accent='blue' />
          <StatCard icon={<HomeModernIcon className={iconSize} />} label="Viviendas" value={stats.loading ? '—' : stats.viviendas.total} subtitle={stats.loading ? 'Cargando' : 'Registradas'} accent='green' />
          <StatCard icon={<WrenchScrewdriverIcon className={iconSize} />} label="Incidencias" value={stats.loading ? '—' : stats.incidencias.abiertas} subtitle={stats.loading ? 'Cargando' : 'Abiertas'} accent='orange' />
          </div>
        </div>
        {stats.error && (
          <div className="text-xs text-red-500">{stats.error}</div>
        )}
        <SectionPanel title="Herramientas de Administración" description="Accesos rápidos a módulos críticos" as="section">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {adminSections.map((s, i) => (
              <ActionCard
                key={i}
                title={s.title}
                description={s.description}
                badge={s.badge}
                onClick={s.to ? undefined : s.action}
                to={s.to}
                icon={s.icon}
                accent={s.accent}
              />
            ))}
          </div>
        </SectionPanel>
        <SectionPanel title="Actividad Reciente" description="Últimos eventos del sistema" as="section">
          <ul className="divide-y divide-techo-gray-100 dark:divide-techo-gray-800" aria-label="Lista de actividad reciente">
            {recentActivity.map(item => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <span aria-hidden className={`h-2 w-2 rounded-full ${item.color}`}></span>
                <span className="flex-1 text-sm text-techo-gray-600 dark:text-techo-gray-300">{item.text}</span>
                <time className="text-[11px] text-techo-gray-400 dark:text-techo-gray-500" dateTime="2024-01-15">{item.time}</time>
              </li>
            ))}
          </ul>
        </SectionPanel>
  {/* Se eliminó el bloque inline de KPIs. Ahora solo se accede vía la tarjeta 'KPIs y Métricas'. */}
      </div>
    </DashboardLayout>
  );
}
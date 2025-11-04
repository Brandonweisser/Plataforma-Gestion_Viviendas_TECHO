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
  ChartBarIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import { adminApi } from "../services/api";

// Utilidad: tiempo relativo en español (e.g., "hace 1 hora")
function getRelativeTimeString(dateInput, locale = 'es') {
  if (!dateInput) return '';
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const now = Date.now();
  const d = new Date(dateInput).getTime();
  if (Number.isNaN(d)) return '';
  const diffSeconds = Math.round((d - now) / 1000); // negativo si fue en el pasado
  const divisions = [
    { amount: 60, name: 'second' },
    { amount: 60, name: 'minute' },
    { amount: 24, name: 'hour' },
    { amount: 7, name: 'day' },
    { amount: 4.34524, name: 'week' },
    { amount: 12, name: 'month' },
    { amount: Infinity, name: 'year' },
  ];
  let duration = diffSeconds;
  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      // map english unit to spanish display by rtf
      const unit = division.name;
      return rtf.format(Math.round(duration), unit);
    }
    duration /= division.amount;
  }
  return '';
}

function getAbsoluteDateTimeParts(dateInput, locale = 'es-CL') {
  if (!dateInput) return { date: '', time: '' };
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return { date: '', time: '' };
  const date = d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

export default function HomeAdministrador() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Debug logs (deshabilitables)
  const DEBUG = false;
  if (DEBUG) {
    console.log("🏛️ HomeAdministrador - Usuario actual:", user);
    console.log(
      "🏛️ HomeAdministrador - Rol del usuario:",
      user?.rol || user?.role
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };
  const handleNavigation = (path, description) => {
    if (DEBUG) {
      console.log(`🧭 Navegando a ${description}: ${path}`);
      console.log(`🧭 Usuario antes de navegar:`, user);
      console.log(`🧭 Rol antes de navegar:`, user?.rol || user?.role);
    }
    console.log("[HomeAdministrador] Navegación solicitada ->", path);
    navigate(path);
  };

  const iconSize = "h-6 w-6";

  const [stats, setStats] = useState({
    usuarios: { total: 0, administrador: 0, tecnico: 0, beneficiario: 0 },
    viviendas: { total: 0 },
    incidencias: { abiertas: 0 },
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        const res = await adminApi.obtenerEstadisticas();
        if (!cancelled && res?.data) {
          setStats((s) => ({ ...s, ...res.data, loading: false, error: null }));
        }
      } catch (e) {
        if (!cancelled)
          setStats((s) => ({
            ...s,
            loading: false,
            error: e.message || "Error cargando estadísticas",
          }));
      }
    }
    loadStats();
    const interval = setInterval(loadStats, 60_000); // refresco cada minuto
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);
  // Secciones de Gestión de Proyectos y Viviendas
  const projectManagementSections = [
    {
      title: "Gestión de Proyectos",
      description: "Crear proyectos y asignar técnicos responsables",
      badge: "Nuevo",
      action: () =>
        handleNavigation("/admin/proyectos", "Gestión de Proyectos"),
      icon: <ClipboardDocumentListIcon className={iconSize} />,
      accent: "blue",
    },
    {
      title: "Gestión de Viviendas",
      description: "Administrar viviendas y sus características",
      badge: `${stats.viviendas.total} registradas`,
      action: () =>
        handleNavigation("/admin/viviendas", "Gestión de Viviendas"),
      icon: <HomeModernIcon className={iconSize} />,
      accent: "green",
    },
    {
      title: "Asignación de Viviendas",
      description: "Asignar viviendas a beneficiarios",
      badge: "Disponible",
      action: () =>
        handleNavigation("/admin/asignaciones", "Asignación de Viviendas"),
      icon: <UsersIcon className={iconSize} />,
      accent: "purple",
    },
    {
      title: "Supervisión de Incidencias",
      description: "Monitorear incidencias y asignaciones críticas",
      badge: `${stats.incidencias.abiertas} abiertas`,
      action: () => handleNavigation("/home/incidencias", "Incidencias"),
      icon: <WrenchScrewdriverIcon className={iconSize} />,
      accent: "cyan",
    },
    {
      title: "KPIs y Métricas",
      description: "Visualizaciones y análisis detallado",
      badge: "Gráficos",
      to: "/admin/kpis",
      action: () => handleNavigation("/admin/kpis", "KPIs"),
      icon: <ChartBarIcon className={iconSize} />,
      accent: "pink",
    },
    {
      title: "Mapa de Viviendas",
      description: "Distribución geográfica (demo)",
      badge: "Beta",
      to: "/admin/mapa-viviendas",
      action: () => handleNavigation("/admin/mapa-viviendas", "Mapa Viviendas"),
      icon: <HomeModernIcon className={iconSize} />,
      accent: "indigo",
    },
    {
      title: "Templates de Postventa",
      description: "Crear y gestionar listas por tipo de vivienda",
      badge: "Nuevo",
      to: "/admin/templates-posventa",
      action: () =>
        handleNavigation("/admin/templates-posventa", "Templates Posventa"),
      icon: <ClipboardDocumentListIcon className={iconSize} />,
      accent: "teal",
    },
    {
      title: "Gestión de Constructoras",
      description: "Aquí podrás acceder a la gestión de las constructoras vinculadas al sistema",
      badge: "Beta",
      to: "/admin/constructoras",
      action: () =>
        handleNavigation("/admin/constructoras", "Constructoras"),
      icon: <ClipboardDocumentListIcon className={iconSize} />,
      accent: "teal",
    },
  ];

  // Secciones de Gestión de Usuarios y Seguridad
  const userSecuritySections = [
    {
      title: "Gestión de Usuarios",
      description: "Crear, editar y bloquear cuentas del sistema",
      badge: `${stats.usuarios.total} usuarios`,
      action: () => handleNavigation("/admin/usuarios", "Gestión de Usuarios"),
      icon: <UsersIcon className={iconSize} />,
      accent: "orange",
    },
    {
      title: "Seguridad y Auditoría",
      description: "Monitoreo de seguridad, logs de acceso y auditoría del sistema",
      badge: "Nuevo",
      to: "/admin/seguridad",
      action: () =>
        handleNavigation("/admin/seguridad", "Seguridad"),
      icon: <ShieldCheckIcon className={iconSize} />,
      accent: "red",
    },
  ];
  // Herramientas de técnico accesibles para admin
  const technicianTools = [
  {
    title: "Incidencias Técnicas",
    description: "Gestión y resolución de incidencias como técnico",
    badge: "Incidencias",
    to: "/tecnico/incidencias",
    icon: <ClipboardDocumentListIcon className={iconSize} />,
    accent: "orange",
  },
  {
    title: "Formularios de Posventa",
    description: "Listas y formularios de posventa",
    badge: "Formularios",
    to: "/tecnico/posventa/formularios",
    icon: <ChartBarIcon className={iconSize} />,
    accent: "teal",
  },
  {
    title: "Viviendas Técnico",
    description: "Ver y gestionar viviendas como técnico",
    badge: "Viviendas",
    to: "/tecnico/viviendas",
    icon: <HomeModernIcon className={iconSize} />,
    accent: "green",
  },
  ];
  // Lista por defecto (fallback) para actividad reciente
  const defaultRecentActivity = [
    {
      id: 1,
      text: "Nueva vivienda registrada por Juan Pérez",
      color: "bg-green-500",
      time: "Hace 2 horas",
      dateTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      text: "Incidencia reportada en Vivienda #45",
      color: "bg-orange-500",
      time: "Hace 4 horas",
      dateTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      text: "Técnico asignado a incidencia #123",
      color: "bg-blue-500",
      time: "Hace 6 horas",
      dateTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const [recentActivity, setRecentActivity] = useState(defaultRecentActivity);
  const [activityLoading, setActivityLoading] = useState(true);

  // Carga de actividad (reutilizable por botón Refrescar)
  useEffect(() => {
    let cancelled = false;
    async function loadActivity() {
      try {
        setActivityLoading(true);
        const res = await adminApi.obtenerActividad();
        const items = res?.data || res || [];
        if (!cancelled && Array.isArray(items)) {
          const normalized = items.map((it, idx) => ({
            id: it.id ?? idx + 1,
            text: it.text || it.title || it.descripcion || JSON.stringify(it),
            color: it.color || (idx % 3 === 0 ? 'bg-green-500' : idx % 3 === 1 ? 'bg-orange-500' : 'bg-blue-500'),
            time: it.time || it.fecha || it.dateTime || 'Reciente',
            dateTime: it.dateTime || it.fecha || it.timestamp || null,
          }));
          setRecentActivity(normalized);
        }
        if (!cancelled) setActivityLoading(false);
      } catch (e) {
        if (!cancelled) {
          // Mantener simple: solo marcamos loading=false; el UI puede mostrar fallback genérico
          setActivityLoading(false);
        }
      }
    }
    // Exponer para botón
    HomeAdministrador.loadActivity = loadActivity;
    loadActivity();
    return () => {
      cancelled = true;
      HomeAdministrador.loadActivity = undefined;
    };
  }, []);

  return (
    <DashboardLayout
      title={`Panel Administrador - ${user?.rol || user?.role || "Sin rol"}`}
      subtitle={`Sistema de Gestión de Viviendas - Usuario: ${
        user?.nombre || user?.email || "Sin identificar"
      }`}
      user={user || {}}
      onLogout={handleLogout}
      accent="blue"
      footer={`© ${new Date().getFullYear()} TECHO – Panel Administrador`}
    >
      <div
        className="space-y-10"
        role="region"
        aria-label="Contenido principal administrador"
      >
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-techo-gray-800 dark:text-white">
            Panel de Control
          </h2>
          <p className="text-sm text-techo-gray-600 dark:text-techo-gray-300">
            Administra todos los aspectos del sistema.
          </p>

          {/* Bloque de test removido para versión final; activar DEBUG para reinsertar herramientas */}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 flex-1">
            <StatCard
              icon={<UsersIcon className={iconSize} />}
              label="Usuarios"
              value={stats.loading ? "—" : stats.usuarios.total}
              subtitle={
                stats.loading
                  ? "Cargando"
                  : `${stats.usuarios.administrador || 0} Admin / ${
                      stats.usuarios.tecnico || 0
                    } Tec / ${stats.usuarios.beneficiario || 0} Ben`
              }
              accent="blue"
            />
            <StatCard
              icon={<HomeModernIcon className={iconSize} />}
              label="Viviendas"
              value={stats.loading ? "—" : stats.viviendas.total}
              subtitle={stats.loading ? "Cargando" : "Registradas"}
              accent="green"
            />
            <StatCard
              icon={<WrenchScrewdriverIcon className={iconSize} />}
              label="Incidencias"
              value={stats.loading ? "—" : stats.incidencias.abiertas}
              subtitle={stats.loading ? "Cargando" : "Abiertas"}
              accent="orange"
            />
          </div>
        </div>
        {stats.error && (
          <div className="text-xs text-red-500">{stats.error}</div>
        )}

        {/* Gestión de Proyectos y Viviendas */}
        <SectionPanel
          title="Gestión de Proyectos y Viviendas"
          description="Administración de proyectos, viviendas y operaciones"
          as="section"
          showBack={false}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projectManagementSections.map((s, i) => (
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

        {/* Gestión de Usuarios y Seguridad */}
        <SectionPanel
          title="Gestión de Usuarios y Seguridad"
          description="Administración de cuentas y monitoreo de seguridad"
          as="section"
          showBack={false}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {userSecuritySections.map((s, i) => (
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

        {/* Herramientas de Técnico */}
        <SectionPanel
          title="Herramientas de Técnico"
          description="Accesos rápidos a módulos técnicos (solo admin)"
          as="section"
          showBack={false}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {technicianTools.map((tool, i) => (
              <ActionCard
                key={i}
                title={tool.title}
                description={tool.description}
                badge={tool.badge}
                to={tool.to}
                icon={tool.icon}
                accent={tool.accent}
              />
            ))}
          </div>
        </SectionPanel>
        <SectionPanel
          title="Actividad Reciente"
          description="Últimos eventos del sistema"
          as="section"
          showBack={false}
          actions={
            <button
              onClick={() => HomeAdministrador.loadActivity && HomeAdministrador.loadActivity()}
              disabled={activityLoading}
              className={`px-2 py-1 text-sm border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 ${activityLoading ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              aria-label="Refrescar actividad"
            >
              <span className="inline-flex items-center gap-1">
                <ArrowPathIcon className={`h-4 w-4 ${activityLoading ? 'animate-spin' : ''}`} />
                {activityLoading ? 'Actualizando…' : 'Refrescar'}
              </span>
            </button>
          }
        >
          <div>
            <ul
              className="divide-y divide-techo-gray-100 dark:divide-techo-gray-800"
              aria-label="Lista de actividad reciente"
            >
              {recentActivity.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3">
                  <span
                    aria-hidden
                    className={`h-2 w-2 rounded-full ${item.color}`}
                  ></span>
                  <span className="flex-1 text-sm text-techo-gray-600 dark:text-techo-gray-300">
                    {item.text}
                  </span>
                  {activityLoading ? (
                    <span className="text-[11px] text-techo-gray-400 dark:text-techo-gray-500">Cargando...</span>
                  ) : (
                    <div className="ml-auto flex flex-col items-end min-w-[160px] text-right">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-techo-gray-100 text-techo-gray-700 dark:bg-gray-800 dark:text-gray-200">
                        {item.dateTime ? getRelativeTimeString(item.dateTime, 'es-CL') : (typeof item.time === 'string' ? item.time : '')}
                      </span>
                      {item.dateTime && (
                        <time
                          className="mt-0.5 text-[10px] text-techo-gray-400 dark:text-techo-gray-500"
                          dateTime={item.dateTime}
                          title={item.dateTime}
                        >
                          {(() => {
                            const { date, time } = getAbsoluteDateTimeParts(item.dateTime, 'es-CL');
                            return `${date} · ${time}`;
                          })()}
                        </time>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </SectionPanel>
        {/* Se eliminó el bloque inline de KPIs. Ahora solo se accede vía la tarjeta 'KPIs y Métricas'. */}
      </div>
    </DashboardLayout>
  );
}

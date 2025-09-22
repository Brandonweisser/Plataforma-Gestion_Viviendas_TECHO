import React, { useContext } from "react";
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
  ChartBarIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

export default function HomeAdministrador() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/"); };

  const iconSize = 'h-6 w-6';
  const adminSections = [
    { title: "Gestión de Usuarios", description: "Crear, editar y bloquear cuentas del sistema", badge: "23 activos", action: () => console.log('Usuarios'), icon: <UsersIcon className={iconSize} />, accent: 'blue' },
    { title: "Gestión de Viviendas", description: "Administrar viviendas, asignar beneficiarios y técnicos", badge: "89 casas", action: () => console.log('Viviendas'), icon: <HomeModernIcon className={iconSize} />, accent: 'green' },
    { title: "Reportes Ejecutivos", description: "KPIs y métricas en tiempo real del sistema", badge: "Tiempo real", action: () => console.log('Reportes'), icon: <ChartBarIcon className={iconSize} />, accent: 'purple' },
    { title: "Supervisión de Incidencias", description: "Monitorear incidencias y asignaciones críticas", badge: "23 abiertas", action: () => console.log('Incidencias'), icon: <WrenchScrewdriverIcon className={iconSize} />, accent: 'orange' },
    { title: "Configuración del Sistema", description: "Permisos, parámetros y ajustes globales", badge: "Admin only", action: () => console.log('Config'), icon: <Cog6ToothIcon className={iconSize} />, accent: 'indigo' },
    { title: "Centro de Asignaciones", description: "Asignar técnicos y gestionar cargas de trabajo", badge: "12 pendientes", action: () => console.log('Asignaciones'), icon: <ClipboardDocumentListIcon className={iconSize} />, accent: 'cyan' }
  ];

  const recentActivity = [
    { id: 1, text: 'Nueva vivienda registrada por Juan Pérez', color: 'bg-green-500', time: 'Hace 2 horas' },
    { id: 2, text: 'Incidencia reportada en Vivienda #45', color: 'bg-orange-500', time: 'Hace 4 horas' },
    { id: 3, text: 'Técnico asignado a incidencia #123', color: 'bg-blue-500', time: 'Hace 6 horas' }
  ];

  return (
    <DashboardLayout
      title="Panel Administrador"
      subtitle="Sistema de Gestión de Viviendas"
      user={user || {}}
      onLogout={handleLogout}
      accent="blue"
      footer={`© ${new Date().getFullYear()} TECHO – Panel Administrador`}
    >
      <div className="space-y-10" role="region" aria-label="Contenido principal administrador">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-techo-gray-800 dark:text-white">Panel de Control</h2>
          <p className="text-sm text-techo-gray-600 dark:text-techo-gray-300">Administra todos los aspectos del sistema.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard icon={<UsersIcon className={iconSize} />} label="Total Usuarios" value="125" subtitle="Activos" accent='blue' />
          <StatCard icon={<HomeModernIcon className={iconSize} />} label="Viviendas" value="89" subtitle="Registradas" accent='green' />
            <StatCard icon={<WrenchScrewdriverIcon className={iconSize} />} label="Incidencias" value="23" subtitle="Abiertas" accent='orange' />
          <StatCard icon={<ChartBarIcon className={iconSize} />} label="Satisfacción" value="95%" subtitle="Global" accent='purple' />
        </div>
        <SectionPanel title="Herramientas de Administración" description="Accesos rápidos a módulos críticos" as="section">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {adminSections.map((s, i) => (
              <ActionCard key={i} title={s.title} description={s.description} badge={s.badge} onClick={s.action} icon={s.icon} accent={s.accent} />
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
      </div>
    </DashboardLayout>
  );
}
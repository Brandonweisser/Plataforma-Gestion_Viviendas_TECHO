import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ActionCard } from "../components/ui/ActionCard";
import { StatCard } from "../components/ui/StatCard";
import { SectionPanel } from "../components/ui/SectionPanel";
import { DashboardLayout } from "../components/ui/DashboardLayout";
import { 
  HomeModernIcon,
  WrenchScrewdriverIcon,
  UserCircleIcon,
  HomeIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  PhoneIcon,
  BookOpenIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

export default function HomeBeneficiario() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const iconSize = 'h-6 w-6';
  const beneficiarioSections = [
    {
      title: "Estado de Mi Vivienda",
      description: "Ver información detallada, historial y condición actual de mi hogar",
      icon: <HomeIcon className={iconSize} />,
      color: "bg-green-500 hover:bg-green-600",
      badge: "Activa",
      urgent: false,
      action: () => console.log("Ver mi vivienda")
    },
    {
      title: "Reportar Problema Urgente",
      description: "Reportar emergencias o problemas que requieren atención inmediata",
      icon: <ExclamationTriangleIcon className={iconSize} />,
      color: "bg-red-5r00 hover:bg-red-600",
      badge: "24/7",
      urgent: true,
      action: () => console.log("Reportar problema")
    },
    {
      title: "Historial de Mis Reportes",
      description: "Ver todos mis reportes anteriores, seguimiento y resoluciones",
      icon: <ClipboardDocumentListIcon className={iconSize} />,
      color: "bg-blue-500 hover:bg-blue-600",
      badge: "3 activos",
      urgent: false,
      action: () => console.log("Ver mis reportes")
    },
    {
      title: "Contacto con Mi Técnico",
      description: "Comunicarme directamente con el técnico asignado a mi zona",
      icon: <PhoneIcon className={iconSize} />,
      color: "bg-purple-500 hover:bg-purple-600",
      badge: "Ana Gómez",
      urgent: false,
      action: () => console.log("Contactar técnico")
    },
    {
      title: "Guías de Mantenimiento",
      description: "Consejos y tutoriales para el cuidado básico de mi vivienda",
      icon: <BookOpenIcon className={iconSize} />,
      color: "bg-teal-500 hover:bg-teal-600",
      badge: "Nuevas",
      urgent: false,
      action: () => console.log("Ver guías")
    },
    {
      title: "Programar Inspección",
      description: "Solicitar una revisión programada de mi vivienda",
      icon: <CalendarDaysIcon className={iconSize} />,
      color: "bg-indigo-500 hover:bg-indigo-600",
      badge: "Próxima: Mar 20",
      urgent: false,
      action: () => console.log("Programar inspección")
    }
  ];

  const recentReports = [
    { id: 1, type: "Eléctrico", status: "En progreso", date: "2024-01-15", priority: "Media" },
    { id: 2, type: "Plomería", status: "Completado", date: "2024-01-10", priority: "Alta" },
    { id: 3, type: "Estructural", status: "Pendiente", date: "2024-01-08", priority: "Baja" }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "En progreso": return "bg-yellow-100 text-yellow-800";
      case "Completado": return "bg-green-100 text-green-800";
      case "Pendiente": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Alta": return "text-red-600";
      case "Media": return "text-yellow-600";
      case "Baja": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  return (
    <DashboardLayout
      title="Mi Hogar"
      subtitle="Portal Beneficiario"
      user={user || {}}
      onLogout={handleLogout}
      accent="blue"
      footer={`© ${new Date().getFullYear()} TECHO Chile · Plataforma Beneficiarios`}
    >
      <div aria-label="Panel principal beneficiario" className="w-full">
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-gradient-brand mb-2 dark:text-transparent">Bienvenido a tu hogar</h2>
            <p className="text-sm text-techo-gray-600 dark:text-techo-gray-300">Administra tu vivienda y reporta cualquier problema que necesite atención.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button className="btn-primary text-xs">Reportar problema</button>
            <button className="btn-outline text-xs">Ver guías</button>
          </div>
        </div>

        {/* Stats */}
        <section aria-label="Indicadores rápidos" className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatCard icon={<HomeModernIcon className="h-6 w-6" />} label="Vivienda" value="#127" subtitle="Estado: Bueno" />
          <StatCard icon={<WrenchScrewdriverIcon className="h-6 w-6" />} label="Reportes activos" value="2" subtitle="En seguimiento" />
          <StatCard icon={<UserCircleIcon className="h-6 w-6" />} label="Técnico" value="Ana Gómez" subtitle="Asignado" />
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Acciones principales */}
          <section aria-label="Acciones principales" className="xl:col-span-2">
            <h3 className="sr-only">Acciones principales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {beneficiarioSections.map((section, index) => (
                <ActionCard
                  key={index}
                  title={section.title}
                  description={section.description}
                  badge={section.badge}
                  urgent={section.urgent}
                  onClick={section.action}
                  icon={section.icon}
                />
              ))}
            </div>
          </section>

            {/* Reportes recientes */}
          <SectionPanel
            title="Mis reportes recientes"
            description="Resumen de actividad más reciente"
            as="section"
            className="h-full flex flex-col"
          >
            <ul className="space-y-4 divide-y divide-techo-gray-100" aria-label="Listado de reportes recientes">
              {recentReports.map((report) => (
                <li key={report.id} className="pt-4 first:pt-0"> 
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-techo-gray-800">Problema {report.type}</span>
                      <span className="text-[11px] uppercase tracking-wide text-techo-gray-500">Reporte #{report.id} · {report.date}</span>
                    </div>
                    <div className="text-right min-w-[110px]">
                      <span className={`badge ${getStatusColor(report.status)} mb-1`}>{report.status}</span>
                      <p className={`text-[11px] font-medium ${getPriorityColor(report.priority)}`}>Prioridad: {report.priority}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <button className="btn-primary w-full text-sm">Ver todos los reportes</button>
            </div>
          </SectionPanel>
        </div>

        {/* Información de la vivienda y contacto */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <SectionPanel
            title="Información de tu vivienda"
            description="Detalles clave y contacto principal"
            className="lg:col-span-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-techo-gray-500 mb-2">Detalles generales</h4>
                  <ul className="space-y-2 text-techo-gray-700 dark:text-techo-gray-200">
                    <li><span className="font-medium text-techo-gray-800 dark:text-techo-gray-100">Dirección:</span> Calle Falsa 123, Comuna X</li>
                    <li><span className="font-medium text-techo-gray-800 dark:text-techo-gray-100">Tipo:</span> Casa Básica</li>
                    <li><span className="font-medium text-techo-gray-800 dark:text-techo-gray-100">Metros cuadrados:</span> 42 m²</li>
                    <li><span className="font-medium text-techo-gray-800 dark:text-techo-gray-100">Fecha de entrega:</span> 15 de marzo, 2023</li>
                  </ul>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-techo-gray-500 mb-2">Contacto de emergencia</h4>
                <ul className="space-y-2 text-techo-gray-700 dark:text-techo-gray-200">
                  <li><span className="font-medium text-techo-gray-800 dark:text-techo-gray-100">Técnico asignado:</span> Ana Gómez</li>
                  <li><span className="font-medium text-techo-gray-800 dark:text-techo-gray-100">Teléfono:</span> +56 9 1234 5678</li>
                  <li><span className="font-medium text-techo-gray-800 dark:text-techo-gray-100">Email:</span> ana@correo.cl</li>
                  <li><span className="font-medium text-techo-gray-800 dark:text-techo-gray-100">Horario:</span> Lun-Vie 8:00-18:00</li>
                </ul>
              </div>
            </div>
          </SectionPanel>
          <SectionPanel
            title="Consejos rápidos"
            description="Cuidado preventivo de tu vivienda"
            variant="highlight"
          >
            <ul className="text-sm text-techo-gray-700 space-y-3" aria-label="Lista de consejos">
              {[
                { icon: '💨', text: 'Ventila tu hogar diariamente para evitar humedad.' },
                { icon: '🔌', text: 'Revisa periódicamente las instalaciones eléctricas.' },
                { icon: '🚨', text: 'Reporta cualquier problema inmediatamente.' },
                { icon: '🧼', text: 'Mantén limpios los desagües y canaletas.' }
              ].map((c,i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-lg leading-none" aria-hidden>{c.icon}</span>
                  <span className="leading-snug">{c.text}</span>
                </li>
              ))}
            </ul>
          </SectionPanel>
        </div>
      </div>
    </DashboardLayout>
  );
}
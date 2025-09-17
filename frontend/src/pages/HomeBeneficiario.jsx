import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ActionCard } from "../components/ui/ActionCard";
import { StatCard } from "../components/ui/StatCard";
import { SectionPanel } from "../components/ui/SectionPanel";
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
  const [theme, setTheme] = useState(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    if (stored) return stored;
    // fallback prefer scheme
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

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
  <div className="min-h-screen flex flex-col bg-gradient-to-b from-techo-blue-50 via-white to-white dark:from-techo-gray-900 dark:via-techo-gray-900 dark:to-techo-gray-900">
      {/* Header / Navbar */}
  <header className="relative z-20 shadow-sm backdrop-blur bg-white/85 dark:bg-techo-gray-800/80 border-b border-techo-gray-100 dark:border-techo-gray-700">
        <div className="app-container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <img src="/LOGO-TECHO-COLOR-768x768.png" alt="Logo Techo" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="text-base sm:text-lg font-semibold text-techo-blue-700 leading-tight">Mi Hogar</h1>
              <p className="text-[11px] text-techo-gray-500 uppercase tracking-wide">Portal Beneficiario</p>
            </div>
          </div>
            <div className="flex items-center gap-3">
              <button onClick={toggleTheme} aria-label="Cambiar tema" className="btn-outline p-2 h-9 w-9 flex items-center justify-center !px-0">
                {theme === 'dark' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path d="M12 3.75a.75.75 0 01.75.75 7.5 7.5 0 007.5 7.5.75.75 0 010 1.5 9 9 0 01-9-9 .75.75 0 01.75-.75z" />
                    <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75 8.25 8.25 0 008.25 8.25.75.75 0 010 1.5A9.75 9.75 0 1111.25 3a.75.75 0 01.75-.75zm-7.5 9.75a8.25 8.25 0 0015.51 3.318A9.75 9.75 0 018.932 4.74 8.25 8.25 0 004.5 12z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path d="M12 18.75a6.75 6.75 0 100-13.5 6.75 6.75 0 000 13.5z" />
                    <path fillRule="evenodd" d="M12 1.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0V2.25A.75.75 0 0112 1.5zm0 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0112 16.5zm10.5-4.5a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 01.75.75zM7.5 12a.75.75 0 01-.75.75H5.25a.75.75 0 010-1.5H6.75A.75.75 0 017.5 12zm11.03 6.53a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 11-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zm-9.94 0a.75.75 0 010 1.06L7.53 20.65a.75.75 0 11-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zM18.47 4.47a.75.75 0 010 1.06L17.41 6.59a.75.75 0 11-1.06-1.06L17.41 4.47a.75.75 0 011.06 0zM8.53 4.47a.75.75 0 010 1.06L7.47 6.59a.75.75 0 11-1.06-1.06L7.47 4.47a.75.75 0 011.06 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            <div className="text-right">
              <p className="text-xs text-techo-gray-500">Hola, <span className="font-semibold text-techo-blue-700">{user?.nombre || user?.name || user?.email || "Beneficiario"}</span></p>
              <p className="text-[11px] text-techo-gray-400">Rol: {user?.rol || "beneficiario"}</p>
            </div>
            <button onClick={handleLogout} className="btn-outline text-xs px-3 py-1.5">Cerrar sesión</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 app-container w-full py-8" aria-label="Panel principal beneficiario">
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
                  <ul className="space-y-2">
                    <li><span className="font-medium">Dirección:</span> Calle Falsa 123, Comuna X</li>
                    <li><span className="font-medium">Tipo:</span> Casa Básica</li>
                    <li><span className="font-medium">Metros cuadrados:</span> 42 m²</li>
                    <li><span className="font-medium">Fecha de entrega:</span> 15 de marzo, 2023</li>
                  </ul>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-techo-gray-500 mb-2">Contacto de emergencia</h4>
                <ul className="space-y-2">
                  <li><span className="font-medium">Técnico asignado:</span> Ana Gómez</li>
                  <li><span className="font-medium">Teléfono:</span> +56 9 1234 5678</li>
                  <li><span className="font-medium">Email:</span> ana@correo.cl</li>
                  <li><span className="font-medium">Horario:</span> Lun-Vie 8:00-18:00</li>
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
      </main>

      <footer className="mt-16 border-t border-techo-gray-100 dark:border-techo-gray-700 bg-white/60 dark:bg-techo-gray-800/70 backdrop-blur py-6 text-center text-[11px] text-techo-gray-500 dark:text-techo-gray-400">
        <div className="app-container">© {new Date().getFullYear()} TECHO Chile · Plataforma Beneficiarios · Tema: {theme === 'dark' ? 'Oscuro' : 'Claro'}</div>
      </footer>
    </div>
  );
}
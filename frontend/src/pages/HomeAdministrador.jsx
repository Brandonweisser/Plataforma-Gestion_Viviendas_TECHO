import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function HomeAdministrador() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const adminSections = [
    {
      title: "👥 Gestión de Usuarios",
      description: "Crear, editar y eliminar cuentas de técnicos y beneficiarios",
      icon: "👥",
      color: "bg-blue-500 hover:bg-blue-600",
      badge: "23 activos",
      action: () => console.log("Gestión de usuarios")
    },
    {
      title: "🏠 Gestión de Viviendas",
      description: "Administrar todas las viviendas, asignar beneficiarios y técnicos",
      icon: "🏠",
      color: "bg-green-500 hover:bg-green-600",
      badge: "89 casas",
      action: () => console.log("Gestión de viviendas")
    },
    {
      title: "📊 Reportes Ejecutivos",
      description: "Dashboard completo con métricas y KPIs del sistema",
      icon: "📊",
      color: "bg-purple-500 hover:bg-purple-600",
      badge: "Tiempo real",
      action: () => console.log("Reportes generales")
    },
    {
      title: "🔧 Supervisión de Incidencias",
      description: "Monitorear todas las incidencias y asignaciones de técnicos",
      icon: "🔧",
      color: "bg-orange-500 hover:bg-orange-600",
      badge: "23 abiertas",
      action: () => console.log("Gestión de incidencias")
    },
    {
      title: "⚙️ Configuración del Sistema",
      description: "Ajustes globales, permisos y configuraciones avanzadas",
      icon: "⚙️",
      color: "bg-gray-500 hover:bg-gray-600",
      badge: "Admin only",
      action: () => console.log("Configuración")
    },
    {
      title: "📋 Centro de Asignaciones",
      description: "Asignar técnicos a zonas, viviendas e incidencias específicas",
      icon: "📋",
      color: "bg-indigo-500 hover:bg-indigo-600",
      badge: "12 pendientes",
      action: () => console.log("Asignaciones")
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-blue-600 text-white px-6 py-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">TECHO - Panel Administrador</h1>
            <p className="text-blue-100 text-sm">Sistema de Gestión de Viviendas</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-sm">Hola, <b className="text-blue-300">{user?.nombre || user?.name || user?.email || "Administrador"}</b></span>
              <p className="text-xs text-blue-200">Rol: {user?.rol || "administrador"}</p>
            </div>
            <button
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-sm transition-colors"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <main className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Panel de Control</h2>
          <p className="text-gray-600">Administra todos los aspectos del sistema de gestión de viviendas</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                👥
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">125</p>
                <p className="text-gray-600">Total Usuarios</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                🏠
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">89</p>
                <p className="text-gray-600">Viviendas</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
                🔧
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">23</p>
                <p className="text-gray-600">Incidencias Abiertas</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                📊
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">95%</p>
                <p className="text-gray-600">Satisfacción</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section, index) => (
            <div key={index} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 border-blue-500">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">{section.title}</h3>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {section.badge}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{section.description}</p>
                <button
                  onClick={section.action}
                  className={`w-full ${section.color} text-white py-3 px-4 rounded transition-colors font-medium`}
                >
                  Acceder al Panel
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-xl font-semibold text-gray-800">Actividad Reciente</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Nueva vivienda registrada por Juan Pérez</span>
                <span className="text-sm text-gray-400">Hace 2 horas</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-gray-600">Incidencia reportada en Vivienda #45</span>
                <span className="text-sm text-gray-400">Hace 4 horas</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Técnico asignado a incidencia #123</span>
                <span className="text-sm text-gray-400">Hace 6 horas</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
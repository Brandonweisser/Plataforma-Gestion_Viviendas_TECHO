import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function HomeTecnico() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const tecnicoSections = [
    {
      title: "📋 Panel de Mis Asignaciones",
      description: "Ver y gestionar todas las viviendas e incidencias bajo mi responsabilidad",
      icon: "📋",
      color: "bg-orange-500 hover:bg-orange-600",
      badge: "12 asignadas",
      priority: "normal",
      action: () => console.log("Ver asignaciones")
    },
    {
      title: "🚨 Incidencias Críticas",
      description: "Atender reportes urgentes que requieren resolución inmediata",
      icon: "�",
      color: "bg-red-500 hover:bg-red-600",
      badge: "3 urgentes",
      priority: "high",
      action: () => console.log("Ver incidencias")
    },
    {
      title: "🔍 Inspecciones Programadas",
      description: "Realizar inspecciones preventivas y programadas en mi zona",
      icon: "🔍",
      color: "bg-green-500 hover:bg-green-600",
      badge: "5 hoy",
      priority: "normal",
      action: () => console.log("Realizar inspecciones")
    },
    {
      title: "📝 Centro de Reportes",
      description: "Crear y gestionar reportes técnicos detallados de trabajos realizados",
      icon: "📝",
      color: "bg-blue-500 hover:bg-blue-600",
      badge: "Nuevo",
      priority: "normal",
      action: () => console.log("Crear reporte")
    },
    {
      title: "📦 Gestión de Inventario",
      description: "Controlar materiales, herramientas y solicitar suministros",
      icon: "📦",
      color: "bg-purple-500 hover:bg-purple-600",
      badge: "85% stock",
      priority: "normal",
      action: () => console.log("Ver inventario")
    },
    {
      title: "💬 Centro de Comunicación",
      description: "Chat con beneficiarios, coordinadores y otros técnicos",
      icon: "💬",
      color: "bg-teal-500 hover:bg-teal-600",
      badge: "4 mensajes",
      priority: "normal",
      action: () => console.log("Comunicación")
    }
  ];

  const pendingIncidents = [
    { id: 1, vivienda: "Casa #45", problema: "Filtración de agua", prioridad: "Alta", fecha: "2024-01-16" },
    { id: 2, vivienda: "Casa #23", problema: "Problema eléctrico", prioridad: "Media", fecha: "2024-01-15" },
    { id: 3, vivienda: "Casa #67", problema: "Puerta dañada", prioridad: "Baja", fecha: "2024-01-14" }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Alta": return "bg-red-100 text-red-800";
      case "Media": return "bg-yellow-100 text-yellow-800";
      case "Baja": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-orange-600 text-white px-6 py-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">TECHO - Panel Técnico</h1>
            <p className="text-orange-100 text-sm">Área de Trabajo Técnico</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-sm">Hola, <b className="text-orange-300">{user?.nombre || user?.name || user?.email || "Técnico"}</b></span>
              <p className="text-xs text-orange-200">Rol: {user?.rol || "tecnico"}</p>
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
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Panel de Trabajo</h2>
          <p className="text-gray-600">Gestiona tus asignaciones y resuelve incidencias de manera eficiente</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                📋
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">12</p>
                <p className="text-gray-600">Viviendas Asignadas</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
                🔧
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">8</p>
                <p className="text-gray-600">Incidencias Pendientes</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                ✅
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">25</p>
                <p className="text-gray-600">Resueltas este mes</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                ⭐
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">4.8</p>
                <p className="text-gray-600">Calificación</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Actions */}
          <div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">Herramientas de Trabajo</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tecnicoSections.map((section, index) => (
                <div key={index} className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 ${section.priority === 'high' ? 'border-red-500 bg-red-50' : 'border-orange-500'}`}>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-gray-800">{section.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${section.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                        {section.badge}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4 text-sm">{section.description}</p>
                    <button
                      onClick={section.action}
                      className={`w-full ${section.color} text-white py-2 px-4 rounded transition-colors text-sm font-medium`}
                    >
                      {section.priority === 'high' ? "¡Atender Urgente!" : "Acceder"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Incidents */}
          <div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">Incidencias Urgentes</h3>
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="space-y-4">
                  {pendingIncidents.map((incident) => (
                    <div key={incident.id} className="border-l-4 border-orange-500 pl-4 py-3 bg-gray-50 rounded-r">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-800">{incident.vivienda}</h4>
                          <p className="text-gray-700">{incident.problema}</p>
                          <p className="text-sm text-gray-600">Reportado: {incident.fecha}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(incident.prioridad)}`}>
                            {incident.prioridad}
                          </span>
                          <button className="block mt-2 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-xs transition-colors">
                            Atender
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded transition-colors">
                  Ver Todas las Incidencias
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-xl font-semibold text-gray-800">Agenda de Hoy</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-gray-800">9:00 AM</h4>
                <p className="text-gray-600">Inspección Casa #23</p>
                <p className="text-sm text-gray-500">Verificar reparación eléctrica</p>
              </div>
              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="font-semibold text-gray-800">11:30 AM</h4>
                <p className="text-gray-600">Reparación Casa #45</p>
                <p className="text-sm text-gray-500">Arreglar filtración de agua</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-gray-800">2:00 PM</h4>
                <p className="text-gray-600">Entrega de materiales</p>
                <p className="text-sm text-gray-500">Casa #67 - Puerta nueva</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-orange-50 border border-orange-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-orange-800 mb-4">🚀 Acciones Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-white border border-orange-300 text-orange-700 px-4 py-2 rounded hover:bg-orange-100 transition-colors">
              📞 Llamar Coordinador
            </button>
            <button className="bg-white border border-orange-300 text-orange-700 px-4 py-2 rounded hover:bg-orange-100 transition-colors">
              📊 Reportar Progreso
            </button>
            <button className="bg-white border border-orange-300 text-orange-700 px-4 py-2 rounded hover:bg-orange-100 transition-colors">
              🚨 Reportar Emergencia
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
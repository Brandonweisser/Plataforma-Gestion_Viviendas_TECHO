import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function HomeBeneficiario() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const beneficiarioSections = [
    {
      title: "🏠 Estado de Mi Vivienda",
      description: "Ver información detallada, historial y condición actual de mi hogar",
      icon: "🏠",
      color: "bg-green-500 hover:bg-green-600",
      badge: "Activa",
      urgent: false,
      action: () => console.log("Ver mi vivienda")
    },
    {
      title: "🚨 Reportar Problema Urgente",
      description: "Reportar emergencias o problemas que requieren atención inmediata",
      icon: "🚨",
      color: "bg-red-500 hover:bg-red-600",
      badge: "24/7",
      urgent: true,
      action: () => console.log("Reportar problema")
    },
    {
      title: "📋 Historial de Mis Reportes",
      description: "Ver todos mis reportes anteriores, seguimiento y resoluciones",
      icon: "📋",
      color: "bg-blue-500 hover:bg-blue-600",
      badge: "3 activos",
      urgent: false,
      action: () => console.log("Ver mis reportes")
    },
    {
      title: "📞 Contacto con Mi Técnico",
      description: "Comunicarme directamente con el técnico asignado a mi zona",
      icon: "📞",
      color: "bg-purple-500 hover:bg-purple-600",
      badge: "Ana Gómez",
      urgent: false,
      action: () => console.log("Contactar técnico")
    },
    {
      title: "📚 Guías de Mantenimiento",
      description: "Consejos y tutoriales para el cuidado básico de mi vivienda",
      icon: "📚",
      color: "bg-teal-500 hover:bg-teal-600",
      badge: "Nuevas",
      urgent: false,
      action: () => console.log("Ver guías")
    },
    {
      title: "📝 Programar Inspección",
      description: "Solicitar una revisión programada de mi vivienda",
      icon: "📝",
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
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-green-600 text-white px-6 py-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">TECHO - Mi Hogar</h1>
            <p className="text-green-100 text-sm">Portal del Beneficiario</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-sm">Hola, <b className="text-green-300">{user?.nombre || user?.name || user?.email || "Beneficiario"}</b></span>
              <p className="text-xs text-green-200">Rol: {user?.rol || "beneficiario"}</p>
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
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Bienvenido a tu hogar</h2>
          <p className="text-gray-600">Administra tu vivienda y reporta cualquier problema que necesite atención</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                🏠
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800">Vivienda #127</p>
                <p className="text-green-600">Estado: Bueno</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
                🔧
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">2</p>
                <p className="text-gray-600">Reportes Activos</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                👷
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800">Ana Gómez</p>
                <p className="text-gray-600">Técnico Asignado</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Actions */}
          <div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">Acciones Principales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {beneficiarioSections.map((section, index) => (
                <div key={index} className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 ${section.urgent ? 'border-red-500 bg-red-50' : 'border-green-500'}`}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-800">{section.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${section.urgent ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {section.badge}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4 text-sm">{section.description}</p>
                    <button
                      onClick={section.action}
                      className={`w-full ${section.color} text-white py-2 px-4 rounded transition-colors font-medium`}
                    >
                      {section.urgent ? "¡Reportar Ahora!" : "Acceder"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Reports */}
          <div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">Mis Reportes Recientes</h3>
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="space-y-4">
                  {recentReports.map((report) => (
                    <div key={report.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-800">Problema {report.type}</h4>
                          <p className="text-sm text-gray-600">Reporte #{report.id} - {report.date}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(report.status)}`}>
                            {report.status}
                          </span>
                          <p className={`text-sm mt-1 ${getPriorityColor(report.priority)}`}>
                            Prioridad: {report.priority}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition-colors">
                  Ver Todos los Reportes
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Information Panel */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-xl font-semibold text-gray-800">Información de tu Vivienda</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Detalles de la Vivienda</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Dirección:</span> Calle Falsa 123, Comuna X</p>
                  <p><span className="font-medium">Tipo:</span> Casa Básica</p>
                  <p><span className="font-medium">Metros cuadrados:</span> 42 m²</p>
                  <p><span className="font-medium">Fecha de entrega:</span> 15 de marzo, 2023</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Contacto de Emergencia</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Técnico asignado:</span> Ana Gómez</p>
                  <p><span className="font-medium">Teléfono:</span> +56 9 1234 5678</p>
                  <p><span className="font-medium">Email:</span> ana@correo.cl</p>
                  <p><span className="font-medium">Horario:</span> Lun-Vie 8:00-18:00</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">💡 Consejos para el cuidado de tu vivienda</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <p className="mb-2">• Ventila tu hogar diariamente para evitar humedad</p>
              <p className="mb-2">• Revisa periódicamente las instalaciones eléctricas</p>
            </div>
            <div>
              <p className="mb-2">• Reporta cualquier problema inmediatamente</p>
              <p className="mb-2">• Mantén limpios los desagües y canaletas</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
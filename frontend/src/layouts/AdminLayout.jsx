import React, { useContext } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { DashboardLayout } from "../components/ui/DashboardLayout";

export default function AdminLayout() {
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    // el navigate lo puede hacer el DashboardLayout o el ProtectedRoute en logout
  };

  const linkClass = ({ isActive }) =>
    `block px-3 py-2 rounded-md text-sm font-medium ${isActive ? "bg-techo-gray-200 dark:bg-techo-gray-700" : "hover:bg-techo-gray-50 dark:hover:bg-techo-gray-800"}`;

  return (
    <DashboardLayout
      title="Panel Administrador"
      subtitle="Sistema de Gestión de Viviendas"
      user={user || {}}
      onLogout={handleLogout}
      accent="blue"
      footer={`© ${new Date().getFullYear()} TECHO – Panel Administrador`}
    >
      <div className="flex gap-6">
        <aside className="w-64 shrink-0" aria-label="Navegación admin">
          <nav className="space-y-1">
            <NavLink to="/admin" end className={linkClass}>Panel</NavLink>
            <NavLink to="/admin/usuarios" className={linkClass}>Usuarios</NavLink>
            <NavLink to="/admin/viviendas" className={linkClass}>Viviendas</NavLink>
            <NavLink to="/admin/reportes" className={linkClass}>Reportes</NavLink>
            <NavLink to="/admin/incidencias" className={linkClass}>Incidencias</NavLink>
            <NavLink to="/admin/configuracion" className={linkClass}>Configuración</NavLink>
          </nav>
        </aside>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </DashboardLayout>
  );
}
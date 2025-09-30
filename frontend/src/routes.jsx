import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import { ProtectedRoute, RoleRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Home from "./pages/Home";
// Rutas de debug eliminadas para versión final
import IncidenciasHistorial from "./pages/IncidenciasHistorial";
import IncidenciasListaTecnico from './pages/tecnico/IncidenciasLista';
import IncidenciaDetalleTecnico from './pages/tecnico/IncidenciaDetalle';
import FormularioPosventa from './pages/tecnico/FormularioPosventa';
import ViviendasTecnico from './pages/tecnico/ViviendasTecnico';
// Versión completa de gestión de proyectos
import GestionProyectos from './pages/admin/GestionProyectos';
import GestionViviendas from './pages/admin/GestionViviendas';
import AsignacionViviendas from './pages/admin/AsignacionViviendas';
import GestionUsuarios from './pages/admin/GestionUsuarios';
import KpisMetricas from './pages/admin/KpisMetricas';

export default function AppRoutes() {
  const { isLoading } = useContext(AuthContext);

  // Bandera para habilitar/deshabilitar rutas de debug rápidamente
  // Eliminado soporte de rutas debug en versión final

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-sm">Inicializando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
  {/* Rutas debug removidas */}
        
        <Route element={<ProtectedRoute redirectTo="/" />}>
          <Route path="/home" element={<Home />} />
          <Route path="/home/incidencias" element={<IncidenciasHistorial />} />

          <Route element={<RoleRoute allowed={['tecnico']} fallback="/home" />}>
            <Route path="/tecnico/incidencias" element={<IncidenciasListaTecnico />} />
            <Route path="/tecnico/incidencias/:id" element={<IncidenciaDetalleTecnico />} />
            <Route path="/tecnico/posventa/formulario/:id" element={<FormularioPosventa />} />
            <Route path="/tecnico/viviendas" element={<ViviendasTecnico />} />
          </Route>

          <Route element={<RoleRoute allowed={['administrador']} fallback="/home" />}>
            <Route path="/admin" element={<Navigate to="/home" replace />} />
            <Route path="/admin/proyectos" element={<GestionProyectos />} />
            <Route path="/admin/viviendas" element={<GestionViviendas />} />
            <Route path="/admin/asignaciones" element={<AsignacionViviendas />} />
            <Route path="/admin/usuarios" element={<GestionUsuarios />} />
            <Route path="/admin/kpis" element={<KpisMetricas />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import { ProtectedRoute, RoleRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Home from "./pages/Home";
import DebugAuth from "./pages/DebugAuth";
import TestPage from "./pages/TestPage";
import IncidenciasHistorial from "./pages/IncidenciasHistorial";
import IncidenciasListaTecnico from './pages/tecnico/IncidenciasLista';
import IncidenciaDetalleTecnico from './pages/tecnico/IncidenciaDetalle';
import FormularioPosventa from './pages/tecnico/FormularioPosventa';
import ViviendasTecnico from './pages/tecnico/ViviendasTecnico';
import GestionProyectosSimple from './pages/admin/GestionProyectosSimple';
import GestionViviendas from './pages/admin/GestionViviendas';
import AsignacionViviendas from './pages/admin/AsignacionViviendas';
import KpisMetricas from './pages/admin/KpisMetricas';
import HomeAdministrador from './pages/HomeAdministrador';

export default function AppRoutes() {
  const { isLoading } = useContext(AuthContext);

  // Evitar decisiones prematuras de rutas mientras cargamos el usuario
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
        <Route path="/debug" element={<DebugAuth />} />
        <Route path="/test" element={<TestPage />} />
        
        {/* Bloque protegido (requiere usuario autenticado) */}
        <Route element={<ProtectedRoute redirectTo="/" />}>
          {/* Dashboard principal (decide contenido por rol) */}
          <Route path="/home" element={<Home />} />
          <Route path="/home/incidencias" element={<IncidenciasHistorial />} />

          {/* Rutas solo técnico */}
            <Route element={<RoleRoute allowed={['tecnico']} fallback="/home" />}>
              <Route path="/tecnico/incidencias" element={<IncidenciasListaTecnico />} />
              <Route path="/tecnico/incidencias/:id" element={<IncidenciaDetalleTecnico />} />
              <Route path="/tecnico/posventa/formulario/:id" element={<FormularioPosventa />} />
              <Route path="/tecnico/viviendas" element={<ViviendasTecnico />} />
            </Route>

          {/* Rutas solo administrador (excepto KPIs que se autoverifica internamente para evitar loops) */}
          <Route element={<RoleRoute allowed={['administrador']} fallback="/home" />}>
            <Route path="/admin" element={<Navigate to="/home" replace />} />
            <Route path="/admin/proyectos" element={<GestionProyectosSimple />} />
            <Route path="/admin/viviendas" element={<GestionViviendas />} />
            <Route path="/admin/asignaciones" element={<AsignacionViviendas />} />
          </Route>
          <Route path="/admin/kpis" element={<KpisMetricas />} />
    <Route path="/admin/kpis-inline" element={<ProtectedRoute><HomeAdministrador forceShowKpis /></ProtectedRoute>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

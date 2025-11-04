import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import { ProtectedRoute, RoleRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Home from "./pages/Home";
// Rutas de debug eliminadas para versión final
import IncidenciasHistorial from "./pages/IncidenciasHistorial";
import EstadoVivienda from './pages/beneficiario/EstadoVivienda';
import NuevaIncidencia from './pages/beneficiario/NuevaIncidencia';
import IncidenciasListaTecnico from './pages/tecnico/IncidenciasLista';
import IncidenciaDetalleTecnico from './pages/tecnico/IncidenciaDetalle';
import FormularioPosventa from './pages/tecnico/FormularioPosventa';
import FormulariosPosventa from './pages/tecnico/FormulariosPosventa';
import ViviendasTecnico from './pages/tecnico/ViviendasTecnico';
import HomeTecnicoCampo from './pages/tecnico/HomeTecnicoCampo';
// Versión completa de gestión de proyectos
import GestionProyectos from './pages/admin/GestionProyectos';
import GestionViviendas from './pages/admin/GestionViviendas';
import AsignacionViviendas from './pages/admin/AsignacionViviendas';
import GestionUsuarios from './pages/admin/GestionUsuarios';
import KpisMetricas from './pages/admin/KpisMetricas';
import MapaViviendas from './pages/admin/MapaViviendas';
import GestionTemplatesPosventa from './pages/admin/GestionTemplatesPosventa';
import Constructoras from './pages/admin/Constructoras';
import SecurityDashboard from './pages/admin/SecurityDashboard';
import RBACMockup from './pages/admin/RBACMockup';
import PosventaFormPage from './pages/PosventaForm.jsx';
import Registro from './pages/registrar.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import AceptarInvitacion from './pages/auth/AceptarInvitacion.jsx';
import FirstAdmin from './pages/setup/FirstAdmin.jsx';

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
        {/* Rutas públicas */}
        <Route path="/registro" element={<Registro />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
  <Route path="/aceptar-invitacion" element={<AceptarInvitacion />} />
  <Route path="/setup" element={<FirstAdmin />} />
  {/* Rutas debug removidas */}
        
        <Route element={<ProtectedRoute redirectTo="/" />}>
          <Route path="/home" element={<Home />} />
          <Route path="/home/incidencias" element={<IncidenciasHistorial />} />
          {/* Beneficiario posventa */}
          <Route path="/beneficiario/posventa" element={<PosventaFormPage />} />
          {/* Beneficiario: Estado de vivienda y reportes */}
          <Route path="/beneficiario/estado-vivienda" element={<EstadoVivienda />} />
          <Route path="/beneficiario/incidencias" element={<IncidenciasHistorial />} />
          <Route path="/beneficiario/nueva-incidencia" element={<NuevaIncidencia />} />

          <Route element={<RoleRoute allowed={['tecnico', 'tecnico_campo', 'administrador']} fallback="/home" />}>
            {/* Alias legacy path to new list path to avoid dead links */}
            <Route path="/tecnico/posventa" element={<Navigate to="/tecnico/posventa/formularios" replace />} />
            <Route path="/tecnico/incidencias" element={<IncidenciasListaTecnico />} />
            <Route path="/tecnico/incidencias/:id" element={<IncidenciaDetalleTecnico />} />
            <Route path="/tecnico/posventa/formularios" element={<FormulariosPosventa />} />
            <Route path="/tecnico/posventa/formulario/:id" element={<FormularioPosventa />} />
            <Route path="/tecnico/viviendas" element={<ViviendasTecnico />} />
          </Route>

          {/* 🆕 Dashboard específico para técnico de campo */}
          <Route element={<RoleRoute allowed={['tecnico_campo']} fallback="/home" />}>
            <Route path="/tecnico-campo/dashboard" element={<HomeTecnicoCampo />} />
          </Route>

          <Route element={<RoleRoute allowed={['administrador']} fallback="/home" />}>
            <Route path="/admin" element={<Navigate to="/home" replace />} />
            <Route path="/admin/proyectos" element={<GestionProyectos />} />
            <Route path="/admin/viviendas" element={<GestionViviendas />} />
            <Route path="/admin/constructoras" element={<Constructoras />} />
            <Route path="/admin/asignaciones" element={<AsignacionViviendas />} />
            <Route path="/admin/usuarios" element={<GestionUsuarios />} />
            <Route path="/admin/kpis" element={<KpisMetricas />} />
            <Route path="/admin/mapa-viviendas" element={<MapaViviendas />} />
            <Route path="/admin/templates-posventa" element={<GestionTemplatesPosventa />} />
            <Route path="/admin/seguridad" element={<SecurityDashboard />} />
            <Route path="/admin/rbac-demo" element={<RBACMockup />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
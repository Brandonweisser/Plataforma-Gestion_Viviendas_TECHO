import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Registro from "./pages/registrar";
import Home from "./pages/Home";
import Unauthorized from "./pages/Unauthorized";
// Usar las páginas completas de cada rol (antes: dashboards placeholder)
import HomeAdministrador from "./pages/HomeAdministrador";
import HomeTecnico from "./pages/HomeTecnico";
import HomeBeneficiario from "./pages/HomeBeneficiario";
import BeneficiarioDashboard from "./pages/beneficiario/Dashboard";
import EstadoVivienda from "./pages/beneficiario/EstadoVivienda";
import NuevaIncidencia from "./pages/beneficiario/NuevaIncidencia";
import IncidenciasHistorial from "./pages/IncidenciasHistorial";
import PosventaFormPage from "./pages/PosventaForm";
import IncidenciasListaTecnico from './pages/tecnico/IncidenciasLista';
import IncidenciaDetalleTecnico from './pages/tecnico/IncidenciaDetalle';
import FormulariosPosventa from './pages/tecnico/FormulariosPosventa';
import FormularioPosventa from './pages/tecnico/FormularioPosventa';
import { ProtectedRoute, RoleRoute } from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Auth genérico */}
          <Route element={<ProtectedRoute />}> 
            <Route path="/home" element={<Home />} />
          </Route>

            {/* Rutas por rol */}
          <Route element={<ProtectedRoute />}> 
            <Route element={<RoleRoute allowed={["administrador"]} />}> 
              <Route path="/admin" element={<HomeAdministrador />} />
            </Route>
            <Route element={<RoleRoute allowed={["tecnico"]} />}> 
              <Route path="/tecnico" element={<HomeTecnico />} />
              <Route path="/tecnico/incidencias" element={<IncidenciasListaTecnico />} />
              <Route path="/tecnico/incidencias/:id" element={<IncidenciaDetalleTecnico />} />
              <Route path="/tecnico/posventa" element={<FormulariosPosventa />} />
              <Route path="/tecnico/posventa/formulario/:id" element={<FormularioPosventa />} />
            </Route>
            <Route element={<RoleRoute allowed={["beneficiario"]} />}> 
              {/* UI pulida conectada al backend */}
              <Route path="/beneficiario" element={<HomeBeneficiario />} />
              {/* Estado completo de la vivienda */}
              <Route path="/beneficiario/estado-vivienda" element={<EstadoVivienda />} />
              {/* Nueva incidencia */}
              <Route path="/beneficiario/nueva-incidencia" element={<NuevaIncidencia />} />
              {/* Vista técnica/debug con JSON crudo */}
              <Route path="/beneficiario/debug" element={<BeneficiarioDashboard />} />
              {/* Historial completo de incidencias */}
              <Route path="/beneficiario/incidencias" element={<IncidenciasHistorial />} />
              <Route path="/beneficiario/posventa" element={<PosventaFormPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
  );
}
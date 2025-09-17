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
            </Route>
            <Route element={<RoleRoute allowed={["beneficiario"]} />}> 
              <Route path="/beneficiario" element={<HomeBeneficiario />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
  );
}
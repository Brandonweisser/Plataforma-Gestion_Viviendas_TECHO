import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Registro from "./pages/registrar";
import Home from "./pages/Home";
import Unauthorized from "./pages/Unauthorized";
import HomeAdministrador from "./pages/HomeAdministrador";
import HomeTecnico from "./pages/HomeTecnico";
import HomeBeneficiario from "./pages/HomeBeneficiario";
import { ProtectedRoute, RoleRoute } from "./components/ProtectedRoute";

import AdminDashboard from "./pages/admin/AdminDashboard";
import Usuarios from "./pages/admin/Usuarios";
import Viviendas from "./pages/admin/Viviendas";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protegidas */}
        <Route element={<ProtectedRoute />}>
          {/* Punto de entrada común (decide qué dashboard mostrar según rol) */}
          <Route path="/home" element={<Home />} />

          {/* Admin */}
          <Route element={<RoleRoute allowed={["administrador"]} />}>
            <Route path="/admin" element={<HomeAdministrador />}>
              <Route index element={<AdminDashboard />} />
              <Route path="usuarios" element={<Usuarios />} />
              <Route path="viviendas" element={<Viviendas />} />
              {/* Aquí puedes ir sumando más subrutas */}
            </Route>
          </Route>

          {/* Técnico */}
          <Route element={<RoleRoute allowed={["tecnico"]} />}>
            <Route path="/tecnico" element={<HomeTecnico />} />
          </Route>

          {/* Beneficiario */}
          <Route element={<RoleRoute allowed={["beneficiario"]} />}>
            <Route path="/beneficiario" element={<HomeBeneficiario />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

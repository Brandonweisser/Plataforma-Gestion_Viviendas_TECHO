import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import IncidenciasHistorial from "./pages/IncidenciasHistorial";
import IncidenciasListaTecnico from './pages/tecnico/IncidenciasLista'
import IncidenciaDetalleTecnico from './pages/tecnico/IncidenciaDetalle'
import FormularioPosventa from './pages/tecnico/FormularioPosventa'
import ViviendasTecnico from './pages/tecnico/ViviendasTecnico'

export default function AppRoutes() {
  const { user } = useContext(AuthContext);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={user ? <Home /> : <Navigate to="/" replace />} />
        <Route path="/home/incidencias" element={user ? <IncidenciasHistorial /> : <Navigate to="/" replace />} />
        <Route path="/tecnico/incidencias" element={user ? <IncidenciasListaTecnico /> : <Navigate to="/" replace />} />
        <Route path="/tecnico/incidencias/:id" element={user ? <IncidenciaDetalleTecnico /> : <Navigate to="/" replace />} />
        <Route path="/tecnico/posventa/formulario/:id" element={user ? <FormularioPosventa /> : <Navigate to="/" replace />} />
        <Route path="/tecnico/viviendas" element={user ? <ViviendasTecnico /> : <Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

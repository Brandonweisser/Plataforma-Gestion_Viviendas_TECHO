import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
//Home original
import HomeAdministrador from "./HomeAdministrador";
import HomeBeneficiario from "./HomeBeneficiario";
import HomeTecnico from "./HomeTecnico";
//Con dashboard
import AdminDashboard from "./admin/AdminDashboard";
import TecnicoDashboard from "./tecnico/TecnicoDashboard";
import BeneficiarioDashboard from "./beneficiario/BeneficiarioDashboard";

export default function Home() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Si no hay usuario autenticado, redirigir al login
  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Si no hay usuario, mostrar cargando o redirigir
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Renderizar la interfaz según el rol del usuario
  const userRole = user?.rol?.toLowerCase();
  console.log("🏠 Home - Full user object:", user); // Debug
  console.log("🏠 Home - Detected role:", userRole); // Debug
  console.log("🏠 Home - Raw rol property:", user?.rol); // Debug
  
  //switch original con redireccion a paginas separadas

  // switch (userRole) {
  //   case "administrador":
  //   case "admin":
  //     return <HomeAdministrador />;
    
  //   case "tecnico":
  //   case "técnico":
  //     return <HomeTecnico />;
    
  //   case "beneficiario":
  //   default:
  //     return <HomeBeneficiario />;
  // }

  // Modelo HOME Universal, ajustable segun usuario.
  // Veamos que podemos hacer, BANKAI!!

  switch (userRole) {
    case "administrador":
    case "admin":
      return <AdminDashboard user={user} />;
      
    case "tecnico":
    case "técnico":
      return <TecnicoDashboard user={user} />;
    case "beneficiario":
      return <BeneficiarioDashboard user={user} />;
    default:
      return <p>Usuario no encontrado</p>
  }
}
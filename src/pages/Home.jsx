import React from "react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">TECHO - Plataforma Viviendas</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">
            Hola, <b>admin@techo.org</b>
          </span>
          <button
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-sm"
            // Puedes agregar funcionalidad aquí si lo deseas
          >
            Cerrar sesión
          </button>
        </div>
      </nav>
      {/* Contenido del Home */}
      <main className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Bienvenido al Home</h2>
        <p className="text-gray-700">
          Aquí irán las secciones de reporte de fallas, estado de vivienda, etc.
        </p>
      </main>
    </div>
  );
}
import React from 'react';
import AppRoutes from './routes.jsx';

// Centralizamos toda la lógica de enrutamiento en routes.jsx para evitar duplicidades.
// Este componente ahora solo delega.
export default function App() {
  return <AppRoutes />;
}
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// Ensure global providers (Auth, Theme) wrap the entire app. CRA uses index.js as the entrypoint.
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
// Nota: Desactivamos StrictMode para evitar errores de reconciliación provocados por extensiones del navegador
// (ej. overlays de traducción) durante desarrollo.
if (process.env.NODE_ENV !== 'production') {
  const suppressRemoveChildError = (msg) => /removeChild/.test(msg || '') && /not a child of this node|no es un hijo de este nodo/.test(msg || '')
  window.addEventListener('error', (e) => {
    const msg = (e?.error && e.error.message) || e.message || ''
    if (suppressRemoveChildError(msg)) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }
  })
  window.addEventListener('unhandledrejection', (e) => {
    const msg = (e?.reason && e.reason.message) || ''
    if (suppressRemoveChildError(msg)) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }
  })
}
root.render(
  <ThemeProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ThemeProvider>
);

// NOTE: A separate main.jsx existed (likely from a Vite-style scaffold).
// With Create React App, index.js is the canonical entry. main.jsx is now redundant.
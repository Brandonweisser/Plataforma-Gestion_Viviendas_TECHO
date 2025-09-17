import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// Ensure global providers (Auth, Theme) wrap the entire app. CRA uses index.js as the entrypoint.
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);

// NOTE: A separate main.jsx existed (likely from a Vite-style scaffold).
// With Create React App, index.js is the canonical entry. main.jsx is now redundant.
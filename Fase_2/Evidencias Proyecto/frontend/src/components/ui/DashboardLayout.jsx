import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { ArrowRightOnRectangleIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import FooterTecho from './FooterTecho';

/**
 * DashboardLayout: Contenedor profesional para paneles.
 * Props:
 * - title, subtitle
 * - user (objeto con nombre/email/rol)
 * - onLogout (fn)
 * - children (contenido principal)
 * - accent (color principal del rol: 'blue'|'orange'|'green'...)
 */
export function DashboardLayout({ title, subtitle, user, onLogout, children, accent = 'blue', footer, paddingTop }) {
  const { theme, toggleTheme } = useTheme();
  const accentTextMap = {
    blue: 'text-techo-blue-700 dark:text-techo-blue-300',
    orange: 'text-orange-700 dark:text-orange-300',
    green: 'text-green-700 dark:text-green-300',
    red: 'text-red-700 dark:text-red-300',
    purple: 'text-purple-700 dark:text-purple-300',
    indigo: 'text-indigo-700 dark:text-indigo-300'
  };
  const accentText = accentTextMap[accent] || accentTextMap.blue;
  return (
    <div className="min-h-screen flex flex-col bg-white/80 dark:bg-techo-gray-900/80 backdrop-blur-sm transition-colors">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 dark:bg-techo-gray-900/70 border-b border-techo-gray-100 dark:border-techo-gray-800">
        <div className="app-container flex items-center justify-between py-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/LOGO-TECHO-COLOR-768x768.png"
              alt="Logo TECHO"
              className="h-9 w-9 object-contain drop-shadow-sm select-none"
              draggable="false"
            />
            <div className="flex flex-col truncate">
              <h1 className={`text-lg sm:text-xl font-bold tracking-tight ${accentText} truncate`}>{title}</h1>
              {subtitle && <p className="text-xs text-techo-gray-500 dark:text-techo-gray-400 truncate">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors" 
              aria-label="Cambiar tema"
            >
              {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
            {user && (
              <div className="text-right hidden sm:block">
                <span className="block text-xs text-techo-gray-600 dark:text-techo-gray-300">Hola, <b className={accentText}>{user.nombre || user.name || user.email}</b></span>
                <span className="block text-[11px] text-techo-gray-400 dark:text-techo-gray-500">Rol: {user.rol || '—'}</span>
              </div>
            )}
            {onLogout && (
              <button onClick={onLogout} className="btn bg-red-600 hover:bg-red-700 text-white px-3 py-2 flex items-center gap-1">
                <ArrowRightOnRectangleIcon className="h-5 w-5" /> <span className="hidden sm:inline">Salir</span>
              </button>
            )}
          </div>
        </div>
      </header>
      <main className={`app-container flex-1 ${paddingTop || 'py-8'} space-y-10`} role="main">
        {children}
      </main>
      {/* Footer global estilo TECHO */}
      <FooterTecho />
    </div>
  );
}

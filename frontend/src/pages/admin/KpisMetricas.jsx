import React, { useEffect, useState, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { normalizeRole } from '../../utils/roles';
import { AuthContext } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/ui/DashboardLayout';
import { StatCard } from '../../components/ui/StatCard';
import DashboardCharts from '../../components/dashboard/DashboardCharts';
import { adminApi } from '../../services/api';
import { UsersIcon, HomeModernIcon, WrenchScrewdriverIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function KpisMetricas() {
  const { user, logout, isLoading } = useContext(AuthContext);
  const [stats, setStats] = useState({
    usuarios: { total: 0, administrador: 0, tecnico: 0, beneficiario: 0 },
    viviendas: { total: 0 },
    incidencias: { abiertas: 0 },
    loading: true,
    error: null
  });
  const [lastUpdated, setLastUpdated] = useState(null);

  async function loadStats() {
    try {
      const res = await adminApi.obtenerEstadisticas();
      if (res?.data) {
        setStats(s => ({ ...s, ...res.data, loading: false, error: null }));
        setLastUpdated(new Date());
      }
    } catch (e) {
      setStats(s => ({ ...s, loading: false, error: e.message || 'Error cargando estadísticas' }));
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => { if (!cancelled) await loadStats(); })();
    const interval = setInterval(loadStats, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const iconSize = 'h-6 w-6';

  // Manejo de estados de autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900/40">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-pink-500 mx-auto mb-4" />
          <p className="text-xs text-gray-400">Cargando sesión...</p>
        </div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/" replace />; // Sesión inexistente
  }
  const effectiveRole = normalizeRole(user?.role || user?.rol);
  if (effectiveRole !== 'administrador') {
    return <Navigate to="/home" replace />;
  }

  return (
    <DashboardLayout
      title="KPIs y Métricas"
      subtitle={`Análisis en tiempo casi real · Usuario: ${user?.nombre || user?.email || ''}`}
      user={user || {}}
      onLogout={logout}
      accent="pink"
      footer={`© ${new Date().getFullYear()} TECHO – KPIs`}
    >
      <div className="space-y-10" role="region" aria-label="KPIs y métricas administrativas">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-techo-gray-800 dark:text-white">Panel Analítico</h2>
          <p className="text-sm text-techo-gray-600 dark:text-techo-gray-300">Visualización consolidada de usuarios, incidencias y viviendas.</p>
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <button onClick={loadStats} disabled={stats.loading} className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
              <ArrowPathIcon className="h-4 w-4" /> Refrescar
            </button>
            {lastUpdated && <span>Actualizado: {lastUpdated.toLocaleTimeString()}</span>}
          </div>
        </div>

        {stats.error && <div className="text-xs text-red-500">{stats.error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <StatCard icon={<UsersIcon className={iconSize} />} label="Usuarios" value={stats.loading ? '—' : stats.usuarios.total} subtitle={stats.loading ? 'Cargando' : `${stats.usuarios.administrador || 0} Admin / ${stats.usuarios.tecnico || 0} Tec / ${stats.usuarios.beneficiario || 0} Ben`} accent='blue' />
          <StatCard icon={<HomeModernIcon className={iconSize} />} label="Viviendas" value={stats.loading ? '—' : stats.viviendas.total} subtitle={stats.loading ? 'Cargando' : 'Registradas'} accent='green' />
          <StatCard icon={<WrenchScrewdriverIcon className={iconSize} />} label="Incidencias" value={stats.loading ? '—' : stats.incidencias.abiertas} subtitle={stats.loading ? 'Cargando' : 'Abiertas'} accent='orange' />
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-200">Visualizaciones</h3>
            <span className="text-xs text-gray-500">Auto‑refresh 60s</span>
          </div>
            <DashboardCharts stats={stats} loading={stats.loading} />
        </div>
      </div>
    </DashboardLayout>
  );
}

import React, { useEffect, useState, useContext, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { normalizeRole } from '../../utils/roles';
import { AuthContext } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/ui/DashboardLayout';
import { StatCard } from '../../components/ui/StatCard';
import DashboardCharts from '../../components/dashboard/DashboardCharts';
import { adminApi } from '../../services/api';
import { UsersIcon, HomeModernIcon, WrenchScrewdriverIcon, ArrowPathIcon, CloudArrowDownIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

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
  const [statsHistory, setStatsHistory] = useState([]); // { t: Date, usuarios, viviendas, incidencias }
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Utilidad segura
  const safe = (n) => (typeof n === 'number' && !isNaN(n) ? n : 0);

  const pushHistory = useCallback((data) => {
    setStatsHistory(prev => {
      const next = [...prev, { t: new Date(), ...data }];
      // Limitar a 24 (≈ últimas 24 capturas)
      return next.slice(-24);
    });
  }, []);

  async function loadStats() {
    try {
      const res = await adminApi.obtenerEstadisticas();
      if (res?.data) {
        setStats(s => ({ ...s, ...res.data, loading: false, error: null }));
        setLastUpdated(new Date());
        pushHistory(res.data);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Métricas derivadas (heurísticas, no histórica)
  const derivadas = (() => {
    const admins = safe(stats?.usuarios?.administrador);
    const tecnicos = safe(stats?.usuarios?.tecnico);
    const beneficiarios = safe(stats?.usuarios?.beneficiario);
    const usuariosTotal = safe(stats?.usuarios?.total);
    const vivTotal = safe(stats?.viviendas?.total);
    const incidAbiertas = safe(stats?.incidencias?.abiertas);
    const incidCerradas = safe(stats?.incidencias?.cerradas);
    const densidadIncidencias = vivTotal > 0 ? incidAbiertas / vivTotal : 0; // incidencias por vivienda
    const ratioTecViv = vivTotal > 0 ? tecnicos / vivTotal : 0; // técnicos por vivienda
    const ratioBenViv = vivTotal > 0 ? beneficiarios / vivTotal : 0; // beneficiarios vs viviendas
    const porcAdmins = usuariosTotal > 0 ? (admins / usuariosTotal) : 0;
    const usuariosPorVivienda = vivTotal > 0 ? usuariosTotal / vivTotal : 0;
    const cierreEstimado = (incidAbiertas + incidCerradas) > 0 ? (incidCerradas / (incidAbiertas + incidCerradas)) : null;

    function labelEstado(v, { warn, crit, invert = false }) {
      if (invert) { // invert => valores bajos son buenos
        if (v <= warn) return 'Óptimo';
        if (v <= crit) return 'Atención';
        return 'Riesgo';
      }
      if (v < warn) return 'Óptimo';
      if (v < crit) return 'Atención';
      return 'Crítico';
    }

    return [
      {
        key: 'densidadIncidencias',
        titulo: 'Densidad de Incidencias',
        valor: densidadIncidencias,
        formato: (v) => (v * 100).toFixed(1) + '%',
        estado: labelEstado(densidadIncidencias, { warn: 0.15, crit: 0.40 }),
        descripcion: 'Incidencias abiertas sobre viviendas totales (ideal < 15%).'
      },
      {
        key: 'ratioTecViv',
        titulo: 'Técnicos por Vivienda',
        valor: ratioTecViv,
        formato: (v) => (v * 100).toFixed(2) + '%',
        estado: labelEstado(ratioTecViv, { warn: 0.02, crit: 0.05, invert: true }),
        descripcion: 'Porcentaje de técnicos respecto a viviendas (más bajo puede saturar soporte).'
      },
      {
        key: 'ratioBenViv',
        titulo: 'Beneficiarios vs Viviendas',
        valor: ratioBenViv,
        formato: (v) => (v * 100).toFixed(1) + '%',
        estado: labelEstado(ratioBenViv, { warn: 0.50, crit: 0.85 }),
        descripcion: 'Cobertura de beneficiarios; por encima de 85% implica casi completa asignación.'
      },
      {
        key: 'porcAdmins',
        titulo: 'Administradores',
        valor: porcAdmins,
        formato: (v) => (v * 100).toFixed(1) + '%',
        estado: labelEstado(porcAdmins, { warn: 0.05, crit: 0.15 }),
        descripcion: 'Proporción de cuentas administradoras (demasiadas elevan riesgo de cambios no controlados).'
      },
      {
        key: 'usuariosPorVivienda',
        titulo: 'Usuarios por Vivienda',
        valor: usuariosPorVivienda,
        formato: (v) => v.toFixed(2),
        estado: labelEstado(usuariosPorVivienda, { warn: 2.5, crit: 4 }),
        descripcion: 'Carga administrativa: usuarios totales divididos por viviendas.'
      },
      {
        key: 'tasaCierre',
        titulo: 'Tasa de Cierre Estimada',
        valor: cierreEstimado,
        formato: (v) => v == null ? '—' : (v * 100).toFixed(1) + '%',
        estado: cierreEstimado == null ? 'N/D' : labelEstado(1 - cierreEstimado, { warn: 0.6, crit: 0.8 }),
        descripcion: 'Incidencias cerradas sobre el total (si el backend entrega "cerradas").'
      }
    ];
  })();

  const exportCsv = () => {
    if (!statsHistory.length) return;
    const headers = ['timestamp','usuarios_total','admins','tecnicos','beneficiarios','viviendas_total','incidencias_abiertas','incidencias_cerradas'];
    const rows = statsHistory.map(h => [
      h.t.toISOString(),
      safe(h.usuarios?.total),
      safe(h.usuarios?.administrador),
      safe(h.usuarios?.tecnico),
      safe(h.usuarios?.beneficiario),
      safe(h.viviendas?.total),
      safe(h.incidencias?.abiertas),
      safe(h.incidencias?.cerradas)
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kpis_history.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  function Sparkline({ data, color = '#ec4899' }) {
    if (!data.length) return <div className="h-8" />;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const points = data.map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x},${y}`;
    }).join(' ');
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-8 w-full">
        <polyline fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={points} />
      </svg>
    );
  }

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
            <button onClick={exportCsv} disabled={!statsHistory.length} className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-pink-400 text-pink-500 hover:bg-pink-500/10 disabled:opacity-40">
              <CloudArrowDownIcon className="h-4 w-4" /> CSV
            </button>
            <button onClick={() => setShowAdvanced(s => !s)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-gray-500 hover:bg-gray-700/40">
              <InformationCircleIcon className="h-4 w-4" /> {showAdvanced ? 'Ocultar Detalle' : 'Ver Detalle'}
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

        {/* Insights Derivados */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-200">Insights Derivados</h3>
            <span className="text-[10px] text-gray-500">Heurísticas locales (no sustituyen auditoría)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {derivadas.map(m => (
              <div key={m.key} className="rounded-lg border border-gray-700 bg-gray-800/60 p-4 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold tracking-wide text-gray-300 uppercase">{m.titulo}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${m.estado === 'Óptimo' ? 'bg-emerald-600/20 text-emerald-300' : m.estado === 'Atención' ? 'bg-amber-600/20 text-amber-300' : m.estado === 'Crítico' ? 'bg-red-600/20 text-red-300' : 'bg-gray-600/30 text-gray-300'}`}>{m.estado}</span>
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-lg font-bold text-pink-400 tabular-nums">{m.valor == null ? '—' : m.formato(m.valor)}</span>
                </div>
                <p className="text-[11px] text-gray-400 flex-1 leading-snug">{m.descripcion}</p>
                {m.key === 'densidadIncidencias' && (
                  <div className="mt-2 h-2 w-full rounded bg-gray-700 overflow-hidden">
                    <div className={`h-full ${m.valor < 0.15 ? 'bg-emerald-500' : m.valor < 0.4 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, (m.valor * 100).toFixed(1))}%` }} />
                  </div>
                )}
                {m.key === 'ratioTecViv' && (
                  <div className="mt-2 h-2 w-full rounded bg-gray-700 overflow-hidden">
                    <div className={`h-full ${m.valor <= 0.02 ? 'bg-red-500' : m.valor <= 0.05 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (m.valor * 400).toFixed(1))}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Historial / Tendencias */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-200">Tendencia Reciente</h3>
            <span className="text-[10px] text-gray-500">Capturas: {statsHistory.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-lg border border-gray-700 bg-gray-800/60 p-4">
              <p className="text-xs text-gray-400 mb-1">Incidencias Abiertas</p>
              <Sparkline data={statsHistory.map(h => safe(h.incidencias?.abiertas))} color="#f59e0b" />
              <div className="mt-1 text-[11px] text-gray-500 flex justify-between">
                <span>Inicio: {statsHistory[0]?.incidencias?.abiertas ?? '—'}</span>
                <span>Actual: {stats.incidencias?.abiertas ?? '—'}</span>
              </div>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-800/60 p-4">
              <p className="text-xs text-gray-400 mb-1">Usuarios Totales</p>
              <Sparkline data={statsHistory.map(h => safe(h.usuarios?.total))} color="#3b82f6" />
              <div className="mt-1 text-[11px] text-gray-500 flex justify-between">
                <span>Inicio: {statsHistory[0]?.usuarios?.total ?? '—'}</span>
                <span>Actual: {stats.usuarios?.total ?? '—'}</span>
              </div>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-800/60 p-4">
              <p className="text-xs text-gray-400 mb-1">Viviendas</p>
              <Sparkline data={statsHistory.map(h => safe(h.viviendas?.total))} color="#0ea5e9" />
              <div className="mt-1 text-[11px] text-gray-500 flex justify-between">
                <span>Inicio: {statsHistory[0]?.viviendas?.total ?? '—'}</span>
                <span>Actual: {stats.viviendas?.total ?? '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {showAdvanced && (
          <div className="rounded-lg border border-pink-700/40 bg-pink-900/10 p-4">
            <h4 className="text-sm font-semibold mb-2 text-pink-300">Detalle JSON (Debug)</h4>
            <pre className="text-[10px] whitespace-pre-wrap max-h-72 overflow-auto text-pink-200/90">{JSON.stringify({ stats, history: statsHistory }, null, 2)}</pre>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

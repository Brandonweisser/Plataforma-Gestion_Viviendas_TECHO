import React, { useEffect, useState, useContext, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { normalizeRole } from '../../utils/roles';
import { AuthContext } from '../../context/AuthContext';
import { DashboardLayout } from '../../components/ui/DashboardLayout';
import { StatCard } from '../../components/ui/StatCard';
import DashboardCharts from '../../components/dashboard/DashboardCharts';
import { adminApi } from '../../services/api';
import { UsersIcon, HomeModernIcon, WrenchScrewdriverIcon, ArrowPathIcon, CloudArrowDownIcon, InformationCircleIcon, TagIcon, ChartPieIcon, ExclamationTriangleIcon, BuildingOffice2Icon, HomeIcon, UserGroupIcon, ArchiveBoxIcon, ShieldCheckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Chart from 'react-apexcharts';

export default function KpisMetricas() {
  const navigate = useNavigate();
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
  const [analytics, setAnalytics] = useState(null);

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

  async function loadAnalytics() {
    try {
      const res = await adminApi.obtenerAnalytics({ days: 90 });
      if (res?.data) setAnalytics(res.data);
    } catch (e) {
      console.warn('Analytics no disponible:', e.message);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => { if (!cancelled) { await loadStats(); await loadAnalytics(); } })();
    const interval = setInterval(() => { loadStats(); loadAnalytics(); }, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Métricas derivadas (desactivadas temporalmente)
  // Nota: Si se requieren, mover a un hook y renderizarlas explícitamente para evitar cálculos no usados.

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

  // Exportación CSV de Analytics (snapshot único con secciones)
  const exportAnalyticsCsv = () => {
    if (!analytics) return;
    const esc = (v) => {
      if (v == null) return '';
      const s = String(v);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replaceAll('"', '""') + '"';
      }
      return s;
    };
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const fname = `analytics_snapshot_${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}.csv`;
    const lines = [];

    // Encabezado general
    lines.push(`snapshot_timestamp,${esc(now.toISOString())}`);
    lines.push(`timeframe_days,${esc(analytics.timeframeDays)}`);

    // Totales
    lines.push('');
    lines.push('section,totals');
    lines.push('metric,incidencias,abiertas,cerradas');
    lines.push(`values,${esc(analytics.totals.incidencias)},${esc(analytics.totals.abiertas)},${esc(analytics.totals.cerradas)}`);

    // Prioridades
    lines.push('');
    lines.push('section,prioridades');
    lines.push('prioridad,valor');
    (analytics.prioridades || []).forEach(p => lines.push(`${esc((p.key||'').toUpperCase())},${esc(p.value||0)}`));

    // Estados
    lines.push('');
    lines.push('section,estados');
    lines.push('estado,valor');
    (analytics.estados || []).forEach(e => lines.push(`${esc(e.key)},${esc(e.value||0)}`));

    // Backlog
    lines.push('');
    lines.push('section,backlog');
    lines.push('bucket,valor');
    const b = analytics.backlog?.buckets || {};
    ['0-7d','8-14d','15-30d','31-60d','61-90d','90d+'].forEach(k => lines.push(`${esc(k)},${esc(b[k]||0)}`));
    lines.push(`promedio_dias,${esc(analytics.backlog?.antiguedadPromedioDias ?? '')}`);

    // Categorías top/bottom
    lines.push('');
    lines.push('section,categorias_top');
    lines.push('categoria,valor');
    (analytics.categorias?.top || []).forEach(c => lines.push(`${esc(c.key)},${esc(c.value||0)}`));
    lines.push('');
    lines.push('section,categorias_bottom');
    lines.push('categoria,valor');
    (analytics.categorias?.bottom || []).forEach(c => lines.push(`${esc(c.key)},${esc(c.value||0)}`));

    // Proyectos top
    lines.push('');
    lines.push('section,proyectos_top');
    lines.push('id,nombre,viviendas,reportes,ratio_rep_por_vivienda');
    (analytics.proyectos?.topReportes || []).forEach(p => lines.push(`${esc(p.id)},${esc(p.nombre)},${esc(p.viviendas||0)},${esc(p.count||0)},${esc(p.ratioIncPorViv ?? '')}`));

    // Viviendas top
    lines.push('');
    lines.push('section,viviendas_top');
    lines.push('id_vivienda,direccion,reportes');
    (analytics.viviendas?.topReportes || []).forEach(v => lines.push(`${esc(v.id_vivienda)},${esc(v.direccion||'')},${esc(v.count||0)}`));

    // Técnicos carga
    lines.push('');
    lines.push('section,tecnicos_carga');
    lines.push('tecnico_uid,nombre,email,abiertas,total,avg_res_horas,avg_res_dias');
    (analytics.tecnicos?.topCarga || []).forEach(t => {
      const avgH = t.avgResHoras == null ? '' : t.avgResHoras.toFixed(2);
      const avgD = t.avgResHoras == null ? '' : (t.avgResHoras/24).toFixed(2);
      lines.push(`${esc(t.tecnico_uid)},${esc(t.nombre||'')},${esc(t.email||'')},${esc(t.open||0)},${esc(t.total||0)},${esc(avgH)},${esc(avgD)}`);
    });

    // Técnicos resoluciones 30d
    lines.push('');
    lines.push('section,tecnicos_resol_30d');
    lines.push('tecnico_uid,nombre,email,resueltos_30d,avg_res_horas,avg_res_dias');
    (analytics.tecnicos?.topResoluciones30d || []).forEach(t => {
      const avgH = t.avgResHoras == null ? '' : t.avgResHoras.toFixed(2);
      const avgD = t.avgResHoras == null ? '' : (t.avgResHoras/24).toFixed(2);
      lines.push(`${esc(t.tecnico_uid)},${esc(t.nombre||'')},${esc(t.email||'')},${esc(t.closed30d||0)},${esc(avgH)},${esc(avgD)}`);
    });

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fname;
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
      <div className="space-y-6" role="region" aria-label="KPIs y métricas administrativas">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Panel Analítico</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Visualización consolidada de usuarios, incidencias y viviendas.</p>
              </div>
              <button 
                onClick={() => navigate('/home')} 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors font-medium"
              >
                <ArrowLeftIcon className="h-5 w-5" /> Volver
              </button>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={loadStats} 
                disabled={stats.loading} 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                <ArrowPathIcon className="h-4 w-4" /> Refrescar
              </button>
              <button 
                onClick={exportCsv} 
                disabled={!statsHistory.length} 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-pink-300 dark:border-pink-500 bg-white dark:bg-transparent text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-500/10 disabled:opacity-40 transition-colors text-sm font-medium"
              >
                <CloudArrowDownIcon className="h-4 w-4" /> CSV histórico
              </button>
              <button 
                onClick={exportAnalyticsCsv} 
                disabled={!analytics} 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-300 dark:border-blue-500 bg-white dark:bg-transparent text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 disabled:opacity-40 transition-colors text-sm font-medium"
              >
                <CloudArrowDownIcon className="h-4 w-4" /> CSV Analytics
              </button>
              <button 
                onClick={() => setShowAdvanced(s => !s)} 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                <InformationCircleIcon className="h-4 w-4" /> {showAdvanced ? 'Ocultar Detalle' : 'Ver Detalle'}
              </button>
              {lastUpdated && (
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                  Actualizado: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {stats.error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{stats.error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard 
            icon={<UsersIcon className={iconSize} />} 
            label="Usuarios" 
            value={stats.loading ? '—' : stats.usuarios.total} 
            subtitle={stats.loading ? 'Cargando' : `${stats.usuarios.administrador || 0} Admin / ${stats.usuarios.tecnico || 0} Tec / ${stats.usuarios.beneficiario || 0} Ben`} 
            accent='blue' 
          />
          <StatCard 
            icon={<HomeModernIcon className={iconSize} />} 
            label="Viviendas" 
            value={stats.loading ? '—' : stats.viviendas.total} 
            subtitle={stats.loading ? 'Cargando' : 'Registradas'} 
            accent='green' 
          />
          <StatCard 
            icon={<WrenchScrewdriverIcon className={iconSize} />} 
            label="Incidencias" 
            value={stats.loading ? '—' : stats.incidencias.abiertas} 
            subtitle={stats.loading ? 'Cargando' : 'Abiertas'} 
            accent='orange' 
          />
        </div>

        {/* Charts Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Visualizaciones</h3>
            <span className="text-xs px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">
              Auto‑refresh 60s
            </span>
          </div>
          <DashboardCharts stats={stats} loading={stats.loading} />
        </div>

        {/* Advanced Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Métricas avanzadas (90 días)</h3>
            {!analytics && <span className="text-xs text-gray-500 dark:text-gray-400">cargando…</span>}
          </div>
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Distribución por estado - Dona */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <ChartPieIcon className="h-5 w-5 text-blue-500" />
                  Distribución por estado
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {(analytics.totals.abiertas + analytics.totals.cerradas) || 0}
                </div>
                <div className="mt-4">
                  <Chart
                    type="donut"
                    height={260}
                    series={[analytics.totals.abiertas || 0, analytics.totals.cerradas || 0]}
                    options={{
                      labels: ['Abierta', 'Cerrada'],
                      colors: ['#f59e0b', '#22c55e'],
                      legend: { labels: { colors: '#cbd5e1' } },
                      dataLabels: { enabled: true },
                      tooltip: { theme: 'dark', y: { formatter: (v) => `${v}` } },
                      plotOptions: {
                        pie: {
                          donut: {
                            size: '70%',
                            labels: {
                              show: true,
                              total: {
                                show: true,
                                label: 'Total',
                                color: '#e2e8f0',
                                formatter: (w) => {
                                  const s = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                                  return String(s);
                                }
                              },
                              value: {
                                color: '#f8fafc'
                              }
                            }
                          }
                        }
                      },
                      stroke: { colors: ['#0f172a'] }
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-4">Proporción de incidencias que están actualmente 'Abiertas' (requieren acción) vs 'Cerradas' (resueltas).</p>
              </div>

              {/* Distribución por prioridad - Barras horizontal */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                  Distribución por prioridad
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {analytics.prioridades.reduce((a,b)=>a + (b.value||0), 0)}
                </div>
                {(() => {
                  const map = new Map(analytics.prioridades.map(p => [String(p.key||'').toUpperCase(), p.value]));
                  const cats = ['ALTA','MEDIA','BAJA'];
                  const data = cats.map(k => map.get(k) || 0);
                  return (
                    <div className="mt-4">
                      <Chart
                        type="bar"
                        height={260}
                        series={[{ name: 'Total', data }]}
                        options={{
                          chart: { toolbar: { show: false } },
                          plotOptions: { bar: { horizontal: true, borderRadius: 6, distributed: true } },
                          xaxis: { categories: cats, labels: { style: { colors: '#cbd5e1' } } },
                          yaxis: { labels: { style: { colors: '#cbd5e1' } } },
                          legend: { show: false },
                          colors: ['#EF4444', '#F59E0B', '#22C55E'],
                          tooltip: { theme: 'dark', fillSeriesColor: true, y: { formatter: (v) => `${v}` }, x: { formatter: (val) => `${val}` } }
                        }}
                      />
                      <p className="text-xs text-slate-500 mt-4">Clasificación de todas las incidencias abiertas según su nivel de urgencia.</p>
                    </div>
                  );
                })()}
              </div>

              {/* Backlog - Barras vertical */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <ArchiveBoxIcon className="h-5 w-5 text-purple-500" />
                  Backlog (antigüedad)
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {Object.values(analytics.backlog.buckets).reduce((a,b)=>a+b,0)}
                </div>
                {(() => {
                  const cats = ['0-7d','8-14d','15-30d','31-60d','61-90d','90d+'];
                  const src = analytics.backlog?.buckets || {};
                  const data = cats.map(k => src[k] || 0);
                  return (
                    <div className="mt-4">
                      <Chart
                        type="bar"
                        height={260}
                        series={[{ name: 'Incidencias', data }]}
                        options={{
                          chart: { toolbar: { show: false } },
                          plotOptions: { bar: { columnWidth: '45%', borderRadius: 6, distributed: true } },
                          xaxis: { categories: cats, labels: { style: { colors: '#cbd5e1' } } },
                          yaxis: { labels: { style: { colors: '#cbd5e1' } } },
                          legend: { show: false },
                          colors: ['#22C55E', '#F59E0B', '#F97316', '#EF4444', '#EF4444', '#EF4444'],
                          tooltip: { theme: 'dark', y: { formatter: (v) => `${v} incidencias` }, x: { formatter: (val) => `Rango: ${val}` } }
                        }}
                      />
                      <p className="text-xs text-slate-500 mt-4">Incidencias abiertas agrupadas por cuántos días han pasado sin ser resueltas.</p>
                    </div>
                  );
                })()}
              </div>

              {/* SLA - Radiales */}
              <div className="bg-slate-800 p-6 rounded-xl shadow-lg lg:col-span-2">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-400 uppercase tracking-wider">
                  <ShieldCheckIcon className="h-5 w-5" />
                  SLA
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/40 rounded-xl p-3">
                    <div className="text-xs text-slate-400 mb-1">Cierre en tiempo</div>
                    <Chart
                      type="radialBar"
                      height={220}
                      series={[analytics.sla.cierreDentro == null ? 0 : (analytics.sla.cierreDentro * 100)]}
                      options={{
                        colors: ['#22c55e'],
                          plotOptions: { radialBar: { hollow: { size: '60%' }, dataLabels: { name: { show: true, color:'#cbd5e1' }, value: { show: true, formatter: (v)=>`${Number(v).toFixed(1)}%`, color:'#f8fafc' } } } },
                          tooltip: { theme: 'dark', y: { formatter: (v) => `${Number(v).toFixed(1)}%` } },
                        labels: ['Cierre']
                      }}
                    />
                  </div>
                  <div className="bg-slate-900/40 rounded-xl p-3">
                    <div className="text-xs text-slate-400 mb-1">Atención en tiempo</div>
                    <Chart
                      type="radialBar"
                      height={220}
                      series={[analytics.sla.atencionDentro == null ? 0 : (analytics.sla.atencionDentro * 100)]}
                      options={{
                          colors: ['#EF4444'],
                          plotOptions: { radialBar: { hollow: { size: '60%' }, dataLabels: { name: { show: true, color:'#cbd5e1' }, value: { show: true, formatter: (v)=>`${Number(v).toFixed(1)}%`, color:'#f8fafc' } } } },
                          tooltip: { theme: 'dark', y: { formatter: (v) => `${Number(v).toFixed(1)}%` } },
                        labels: ['Atención']
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-4">Muestra el porcentaje de reportes cerrados y atendidos dentro del tiempo límite establecido (SLA).</p>
              </div>

              {/* Análisis de Categorías (consolidado) */}
              <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-400 uppercase tracking-wider">
                  <TagIcon className="h-5 w-5" />
                  Análisis de Categorías
                </div>
                <div className="mt-2 text-3xl font-bold text-white">{analytics.categorias.top.reduce((a,b)=>a+(b.value||0),0)}</div>
                <span className="text-sm text-slate-400 mt-1 block">Reportes Totales</span>
                {(() => {
                  const top = analytics.categorias.top || [];
                  const bottom = analytics.categorias.bottom || [];
                  const normalize = (arr) => arr.map(it => ({ key: String(it.key), value: Number(it.value||0) }));
                  const a = normalize(top);
                  const b = normalize(bottom);
                  const isSame = a.length === b.length && JSON.stringify(a) === JSON.stringify(b);
                  return (
                    <div className={`mt-4 ${isSame ? 'grid grid-cols-1' : 'grid grid-cols-2'} gap-4`}>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Más frecuentes</div>
                        <ul className="text-sm text-slate-200">
                          {top.map((c, i) => (
                            <li key={i} className="flex justify-between items-center mt-2"><span className="truncate pr-2">{c.key}</span><span className="bg-slate-700 text-slate-200 text-xs font-semibold px-2 py-0.5 rounded-full">{c.value}</span></li>
                          ))}
                        </ul>
                      </div>
                      {!isSame && (
                        <div>
                          <div className="text-xs text-slate-400 mb-1">Menos frecuentes</div>
                          <ul className="text-sm text-slate-200">
                            {bottom.map((c, i) => (
                              <li key={i} className="flex justify-between items-center mt-2"><span className="truncate pr-2">{c.key}</span><span className="bg-slate-700 text-slate-200 text-xs font-semibold px-2 py-0.5 rounded-full">{c.value}</span></li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })()}
                <p className="text-xs text-slate-500 mt-4">Clasificación de reportes por el tipo de problema identificado (ej. losa, electricidad).</p>
              </div>

              {/* Proyectos con más reportes */}
              <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-400 uppercase tracking-wider">
                  <BuildingOffice2Icon className="h-5 w-5" />
                  Proyectos con más reportes
                </div>
                <div className="mt-2 text-3xl font-bold text-white">{analytics.proyectos.topReportes.reduce((a,b)=>a+(b.count||0),0)}</div>
                <ul className="mt-4 text-sm text-slate-200">
                  {analytics.proyectos.topReportes.map((p, i) => (
                    <li key={i} className="flex justify-between items-center mt-2"><span className="truncate pr-2">{p.nombre} <span className="text-slate-400">({p.viviendas||0} viv)</span></span><span className="bg-slate-700 text-slate-200 text-xs font-semibold px-2 py-0.5 rounded-full">{p.count}{p.ratioIncPorViv != null ? <span className="text-slate-400"> · {(p.ratioIncPorViv).toFixed(2)}/viv</span> : null}</span></li>
                  ))}
                </ul>
              </div>

              {/* Viviendas con más reportes */}
              <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-400 uppercase tracking-wider">
                  <HomeIcon className="h-5 w-5" />
                  Viviendas con más reportes
                </div>
                <div className="mt-2 text-3xl font-bold text-white">{analytics.viviendas.topReportes.reduce((a,b)=>a+(b.count||0),0)}</div>
                <ul className="mt-4 text-sm text-slate-200">
                  {analytics.viviendas.topReportes.map((v, i) => (
                    <li key={i} className="flex justify-between items-center mt-2"><span className="truncate pr-2">#{v.id_vivienda} <span className="text-slate-400">{v.direccion || ''}</span></span><span className="bg-slate-700 text-slate-200 text-xs font-semibold px-2 py-0.5 rounded-full">{v.count}</span></li>
                  ))}
                </ul>
              </div>

              {/* Técnicos */}
              <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-400 uppercase tracking-wider">
                  <UserGroupIcon className="h-5 w-5" />
                  Técnicos
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Mayor carga (abiertas)</div>
                    <ul className="text-sm text-slate-200">
                      {(analytics.tecnicos.topCarga && analytics.tecnicos.topCarga.length > 0) ? (
                        analytics.tecnicos.topCarga.map((t, i) => {
                          const nombre = t.nombre || `UID ${t.tecnico_uid}`;
                          return (
                            <li key={i} className="flex justify-between items-center mt-2">
                              <span title={t.email || undefined} className={t.email ? 'cursor-help' : undefined}>#{i + 1} {nombre}</span>
                              <span className="bg-slate-700 text-slate-200 text-xs font-semibold px-2 py-0.5 rounded-full">{t.open ?? 0}</span>
                            </li>
                          );
                        })
                      ) : (
                        <>
                          <li className="flex justify-between items-center text-slate-200 mt-2"><p>#1 Juan Pérez</p><span className="bg-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full">3</span></li>
                          <li className="flex justify-between items-center text-slate-200 mt-2"><p>#2 María López</p><span className="bg-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full">2</span></li>
                          <li className="flex justify-between items-center text-slate-200 mt-2"><p>#3 Carlos Díaz</p><span className="bg-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full">1</span></li>
                        </>
                      )}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Más resoluciones (30d)</div>
                    <ul className="text-sm text-slate-200">
                      {(analytics.tecnicos.topResoluciones30d && analytics.tecnicos.topResoluciones30d.length > 0) ? (
                        analytics.tecnicos.topResoluciones30d.map((t, i) => {
                          const nombre = t.nombre || `UID ${t.tecnico_uid}`;
                          const avgDays = (t.avgResHoras == null ? null : (t.avgResHoras / 24));
                          const badgeTitle = (avgDays == null) ? 'Sin datos de promedio de resolución' : `Promedio de resolución: ${avgDays.toFixed(1)} días`;
                          return (
                            <li key={i} className="flex justify-between items-center mt-2">
                              <span title={t.email || undefined} className={t.email ? 'cursor-help' : undefined}>#{i + 1} {nombre}</span>
                              <span title={badgeTitle} className="bg-slate-700 text-slate-200 text-xs font-semibold px-2 py-0.5 rounded-full cursor-help">{t.closed30d ?? 0}</span>
                            </li>
                          );
                        })
                      ) : (
                        <>
                          <li className="flex justify-between items-center text-slate-200 mt-2"><p>#1 Juan Pérez</p><span className="bg-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full">5</span></li>
                          <li className="flex justify-between items-center text-slate-200 mt-2"><p>#2 María López</p><span className="bg-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full">4</span></li>
                          <li className="flex justify-between items-center text-slate-200 mt-2"><p>#3 Carlos Díaz</p><span className="bg-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full">3</span></li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-4">Ranking de técnicos con más incidencias abiertas y más reportes resueltos en los últimos 30 días.</p>
              </div>
            </div>
          )}
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

import React, { useEffect, useRef, useState } from 'react';

// Carga dinámica segura de apexcharts. Evita problemas de default export (mod.default || mod).
function useApexCharts() {
  const [Apex, setApex] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let mounted = true;
    import('apexcharts')
      .then(mod => {
        if (mounted) setApex(() => (mod.default || mod));
      })
      .catch(err => { if (mounted) setError(err); });
    return () => { mounted = false; };
  }, []);
  return { Apex, error };
}

function ChartWrapper({ type, series, options, height = 260 }) {
  const { Apex, error } = useApexCharts();
  const elRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!Apex || !elRef.current) return;
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }
    const merged = {
      chart: { type, height, toolbar: { show: false }, animations: { enabled: true } },
      series,
      ...options,
    };
    try {
      chartRef.current = new Apex(elRef.current, merged);
      chartRef.current.render();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error creando gráfico ApexCharts:', e);
    }
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Apex, type, JSON.stringify(series), JSON.stringify(options), height]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-60 text-center text-xs text-red-400 border border-red-400/30 rounded">
        <div>
          <p className="font-semibold mb-1">Error cargando ApexCharts</p>
          <p className="opacity-80 break-all">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!Apex) {
    return <div className="h-60 rounded-lg bg-gray-800/40 border border-gray-700 animate-pulse" />;
  }

  return <div ref={elRef} />;
}

/**
 * DashboardCharts
 * Visualizaciones de KPIs principales usando ApexCharts.
 * Recibe objeto stats con estructura:
 * {
 *   usuarios: { total, administrador, tecnico, beneficiario },
 *   viviendas: { total, asignadas?, sinAsignar? },
 *   incidencias: { abiertas, cerradas? }
 * }
 */
export function DashboardCharts({ stats, loading }) {
  const safe = (n) => (typeof n === 'number' ? n : 0);

  // Pie de distribución de roles
  const rolesSeries = [
    safe(stats?.usuarios?.administrador),
    safe(stats?.usuarios?.tecnico),
    safe(stats?.usuarios?.beneficiario)
  ];
  const rolesOptions = {
    labels: ['Administradores', 'Técnicos', 'Beneficiarios'],
    legend: { position: 'bottom' },
    theme: { mode: 'dark' },
    dataLabels: { enabled: true },
    stroke: { width: 1 },
  };

  // Barra de incidencias (abiertas vs cerradas si llega el dato)
  const cerradas = safe(stats?.incidencias?.cerradas);
  const abiertas = safe(stats?.incidencias?.abiertas);
  const incidenciasOptions = {
    chart: { stacked: false, toolbar: { show: false } },
    xaxis: { categories: ['Incidencias'] },
    plotOptions: { bar: { horizontal: false, columnWidth: '45%' } },
    theme: { mode: 'dark' },
    colors: ['#ea580c', '#16a34a'],
    dataLabels: { enabled: true },
    legend: { position: 'bottom' }
  };
  const incidenciasSeries = [
    { name: 'Abiertas', data: [abiertas] },
    { name: 'Cerradas', data: [cerradas] }
  ];

  // Donut de viviendas (si tenemos asignadas / sinAsignar, si no mostramos solo total)
  const viviendasAsignadas = safe(stats?.viviendas?.asignadas);
  const viviendasSin = safe(stats?.viviendas?.sinAsignar);
  const hasBreakdown = (viviendasAsignadas + viviendasSin) > 0;
  const viviendasOptions = {
    labels: hasBreakdown ? ['Asignadas', 'Sin Asignar'] : ['Total'],
    legend: { position: 'bottom' },
    theme: { mode: 'dark' },
    colors: hasBreakdown ? ['#0ea5e9', '#475569'] : ['#0ea5e9'],
    dataLabels: { enabled: true }
  };
  const viviendasSeries = hasBreakdown ? [viviendasAsignadas, viviendasSin] : [safe(stats?.viviendas?.total)];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1,2,3].map(i => (
          <div key={i} className="h-72 rounded-lg bg-gray-800/40 border border-gray-700 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-200 mb-2">Distribución de Roles</h4>
        <ChartWrapper type="pie" series={rolesSeries} options={rolesOptions} height={260} />
      </div>
      <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-200 mb-2">Incidencias</h4>
        <ChartWrapper type="bar" series={incidenciasSeries} options={incidenciasOptions} height={260} />
      </div>
      <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-200 mb-2">Viviendas</h4>
        <ChartWrapper type="donut" series={viviendasSeries} options={viviendasOptions} height={260} />
      </div>
    </div>
  );
}

export default DashboardCharts;
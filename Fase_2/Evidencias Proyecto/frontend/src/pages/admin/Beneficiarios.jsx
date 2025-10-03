import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/ui/DashboardLayout';
import { SectionPanel } from '../../components/ui/SectionPanel';
import { adminApi } from '../../services/api';

export default function Beneficiarios() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [viviendas, setViviendas] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [soloSinAsignar, setSoloSinAsignar] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true); setError('');
    try {
      const [uRes, vRes] = await Promise.allSettled([
        adminApi.listarUsuarios(),
        adminApi.listarViviendas()
      ]);
      if (uRes.status === 'fulfilled') setUsuarios(uRes.value.data || []);
      if (vRes.status === 'fulfilled') setViviendas(vRes.value.data || []);
    } catch (e) {
      setError(e.message || 'Error cargando datos');
    } finally { setLoading(false); }
  }

  const viviendasPorBeneficiario = useMemo(() => {
    const map = new Map();
    viviendas.forEach(v => { if (v.beneficiario_uid) map.set(v.beneficiario_uid, v); });
    return map;
  }, [viviendas]);

  const beneficiarios = useMemo(() => usuarios.filter(u => u.rol === 'beneficiario'), [usuarios]);

  const filtrados = beneficiarios.filter(b => {
    if (soloSinAsignar && viviendasPorBeneficiario.has(b.uid)) return false;
    if (!buscar) return true;
    const q = buscar.toLowerCase();
    return (b.nombre || '').toLowerCase().includes(q) || (b.email || '').toLowerCase().includes(q) || (''+b.uid).includes(q);
  });

  const stats = {
    total: beneficiarios.length,
    asignados: beneficiarios.filter(b => viviendasPorBeneficiario.has(b.uid)).length,
    sinAsignar: beneficiarios.filter(b => !viviendasPorBeneficiario.has(b.uid)).length
  };

  if (loading && usuarios.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300 text-sm">Cargando beneficiarios...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-2">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Beneficiarios</h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Listado de beneficiarios y su estado de vivienda.</p>
            </div>
            <div className="flex gap-2 items-center">
              <button onClick={loadData} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">Recargar</button>
              <button onClick={() => navigate('/admin/asignaciones')} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">Ir a Asignaciones</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-2 text-sm">
            <div className="px-4 py-2 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300">
              <span className="font-semibold">{stats.total}</span> Total
            </div>
            <div className="px-4 py-2 rounded-md bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300">
              <span className="font-semibold">{stats.asignados}</span> Asignados
            </div>
            <div className="px-4 py-2 rounded-md bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-300">
              <span className="font-semibold">{stats.sinAsignar}</span> Sin asignar
            </div>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

        <SectionPanel title="Filtros" description="Buscar y segmentar" className="dark:bg-gray-900/40">
          <div className="grid gap-4 md:grid-cols-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Buscar</label>
              <input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Nombre, email o UID" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex items-center gap-2">
              <input id="soloSin" type="checkbox" checked={soloSinAsignar} onChange={e => setSoloSinAsignar(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded" />
              <label htmlFor="soloSin" className="text-xs text-gray-600 dark:text-gray-300">Sólo sin vivienda</label>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{filtrados.length} resultados</div>
          </div>
        </SectionPanel>

        <SectionPanel title="Listado" description="Beneficiarios con o sin vivienda" className="dark:bg-gray-900/40">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300">
                  <th className="py-2 px-4 font-semibold">UID</th>
                  <th className="py-2 px-4 font-semibold">Nombre</th>
                  <th className="py-2 px-4 font-semibold">Email</th>
                  <th className="py-2 px-4 font-semibold">Estado</th>
                  <th className="py-2 px-4 font-semibold">Vivienda</th>
                  <th className="py-2 px-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500 dark:text-gray-400">Sin resultados</td>
                  </tr>
                )}
                {filtrados.map(b => {
                  const v = viviendasPorBeneficiario.get(b.uid);
                  return (
                    <tr key={b.uid} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                      <td className="py-2 px-4 font-mono text-xs text-gray-500 dark:text-gray-400">{b.uid}</td>
                      <td className="py-2 px-4 text-gray-800 dark:text-gray-100">{b.nombre}</td>
                      <td className="py-2 px-4 text-gray-600 dark:text-gray-300">{b.email}</td>
                      <td className="py-2 px-4">
                        {v ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300">Asignado</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-yellow-100 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-300">Sin vivienda</span>
                        )}
                      </td>
                      <td className="py-2 px-4 text-xs text-gray-600 dark:text-gray-300">
                        {v ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-700 dark:text-gray-200">{v.direccion}</span>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">Estado: {v.estado}</span>
                          </div>
                        ) : <span className="text-gray-400 italic">—</span>}
                      </td>
                      <td className="py-2 px-4">
                        {v ? (
                          <button onClick={() => navigate('/admin/viviendas')} className="text-xs px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white">Ver</button>
                        ) : (
                          <button onClick={() => navigate('/admin/asignaciones')} className="text-xs px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white">Asignar</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionPanel>
      </div>
    </DashboardLayout>
  );
}

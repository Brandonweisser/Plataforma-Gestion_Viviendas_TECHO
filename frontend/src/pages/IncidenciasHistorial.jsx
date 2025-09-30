import React, { useEffect, useState, useContext } from 'react';
import { fetchHistorialIncidencia, groupEventsByDay, eventIcon } from '../services/historial'
import { DashboardLayout } from '../components/ui/DashboardLayout';
import { beneficiarioApi } from '../services/api';
import CardIncidencia from '../components/CardIncidencia';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function IncidenciasHistorial() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [incidencias, setIncidencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [detailInc, setDetailInc] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loadingHist, setLoadingHist] = useState(false);
  const [histMeta, setHistMeta] = useState({ total:0, limit:50, offset:0, has_more:false })
  const [filters, setFilters] = useState({ estado: '', categoria: '', prioridad: '', search: '' });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const offset = (page - 1) * pageSize;
  const query = new URLSearchParams();
  if (filters.estado) query.set('estado', filters.estado);
  if (filters.categoria) query.set('categoria', filters.categoria);
  if (filters.prioridad) query.set('prioridad', filters.prioridad);
  if (debouncedSearch) query.set('search', debouncedSearch);
  const res = await beneficiarioApi.listarIncidencias(pageSize, offset, query.toString());
      const list = Array.isArray(res.data) ? res.data : [];
      setIncidencias(list);
      setHasMore(res.meta?.hasMore || false);
      setTotal(res.meta?.total || list.length);
    } catch (e) {
      setError(e.message || 'No se pudieron cargar las incidencias');
    } finally { setLoading(false); }
  }

  // Debounce search input
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(filters.search.trim()), 400);
    return () => clearTimeout(id);
  }, [filters.search]);

  useEffect(() => { load(); // eslint-disable-next-line
  }, [page, debouncedSearch, filters.estado, filters.categoria, filters.prioridad]);

  // When filters (except search debounce) change, reset to page 1
  useEffect(() => { setPage(1); }, [debouncedSearch, filters.estado, filters.categoria, filters.prioridad]);

  return (
    <DashboardLayout
      title="Historial de Reportes"
      subtitle="Todos tus reportes registrados"
      accent="blue"
      user={user || {}}
      onLogout={logout}
      footer={`© ${new Date().getFullYear()} TECHO Chile`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <button onClick={() => navigate('/beneficiario')} className="btn-outline btn-sm">← Volver al inicio</button>
            <div className="flex flex-wrap gap-3">
              <select value={filters.estado} onChange={e => setFilters(f => ({ ...f, estado: e.target.value }))} className="border rounded px-2 py-1 text-sm dark:bg-slate-800 dark:border-slate-600">
                <option value="">Estado (todos)</option>
                <option value="abierta">Abierta</option>
                <option value="en_proceso">En proceso</option>
                <option value="resuelta">Resuelta</option>
                <option value="cerrada">Cerrada</option>
              </select>
              <select value={filters.categoria} onChange={e => setFilters(f => ({ ...f, categoria: e.target.value }))} className="border rounded px-2 py-1 text-sm dark:bg-slate-800 dark:border-slate-600">
                <option value="">Categoría (todas)</option>
                <option value="Eléctrico">Eléctrico</option>
                <option value="Plomería">Plomería</option>
                <option value="Estructura">Estructura</option>
                <option value="Otro">Otro</option>
              </select>
              <input
                type="text"
                placeholder="Buscar descripción…"
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                className="border rounded px-3 py-1 text-sm w-48 dark:bg-slate-800 dark:border-slate-600"
              />
              {(filters.estado || filters.categoria || filters.prioridad || debouncedSearch) && (
                <button
                  onClick={() => setFilters({ estado: '', categoria: '', prioridad: '', search: '' })}
                  className="btn-outline btn-sm"
                >Limpiar</button>
              )}
            </div>
          </div>
        </div>
        {error && <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Listado completo</h2>
          <div className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-4">
            <span>{total} total</span>
            {loading && <span className="text-slate-500">Cargando…</span>}
          </div>
        </div>
        <div className="grid gap-4">
          {incidencias.map(inc => (
            <CardIncidencia key={inc.id_incidencia} incidencia={inc} onOpen={async (incData)=>{
              setDetailInc(incData);
              setLoadingHist(true); setHistorial([]); setHistMeta({ total:0, limit:50, offset:0, has_more:false })
              try {
                const r = await fetchHistorialIncidencia(incData.id_incidencia, { limit:50, offset:0 })
                setHistorial(r.events); setHistMeta(r.meta)
              } catch(_){ } finally { setLoadingHist(false) }
            }} allowUpload={false} />
          ))}
          {!loading && incidencias.length === 0 && (
            <p className="text-sm text-slate-500">No hay reportes aún.</p>
          )}
        </div>
        <nav className="flex items-center gap-4 mt-8 justify-center" aria-label="Paginación reportes">
          <button
            disabled={page === 1 || loading}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="btn-outline btn-sm disabled:opacity-40"
          >Anterior</button>
          <span className="text-sm text-slate-600 dark:text-slate-300">Página {page}</span>
          <button
            disabled={!hasMore || loading}
            onClick={() => setPage(p => p + 1)}
            className="btn-outline btn-sm disabled:opacity-40"
          >Siguiente</button>
        </nav>
      </div>

      {detailInc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-2xl w-full max-w-2xl p-6 md:p-7">
            <div className="flex items-start justify-between mb-5">
              <h3 className="text-lg md:text-xl font-semibold text-slate-800 dark:text-white">Detalle reporte #{detailInc.id_incidencia}</h3>
              <button className="btn-outline" onClick={() => setDetailInc(null)}>Cerrar</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 text-slate-700 dark:text-slate-200">
              <div className="space-y-2 text-sm leading-relaxed">
                <p><span className="font-medium text-slate-900 dark:text-white">Estado:</span> {detailInc.estado}</p>
                <p><span className="font-medium text-slate-900 dark:text-white">Categoría:</span> {detailInc.categoria || '—'}</p>
                <p><span className="font-medium text-slate-900 dark:text-white">Prioridad:</span> {(detailInc.prioridad || '—').toUpperCase()}</p>
                <p><span className="font-medium text-slate-900 dark:text-white">Fecha:</span> {(detailInc.fecha_reporte || '').split('T')[0]}</p>
                <p className="whitespace-pre-line"><span className="font-medium text-slate-900 dark:text-white">Descripción:</span>\n{detailInc.descripcion}</p>
                <div className='mt-4'>
                  <p className='font-medium text-slate-900 dark:text-white mb-1'>Historial</p>
                  {loadingHist && <p className='text-xs text-slate-500'>Cargando historial…</p>}
                  {!loadingHist && historial.length===0 && <p className='text-xs text-slate-500'>Sin eventos</p>}
                  {!loadingHist && historial.length>0 && groupEventsByDay(historial).map(group => (
                    <div key={group.day} className='mb-2'>
                      <div className='text-[11px] font-semibold text-slate-500 mb-1'>{group.day}</div>
                      <ul className='space-y-1'>
                        {group.events.map(ev => (
                          <li key={ev.id} className='text-[11px] flex justify-between gap-2 border-b border-slate-100 dark:border-slate-700 py-1'>
                            <div>
                              <span className='mr-1'>{eventIcon(ev.tipo_evento)}</span>
                              <span className='font-semibold'>{ev.tipo_evento}</span>
                              {ev.estado_anterior && ev.estado_nuevo && <span className='ml-1'>({ev.estado_anterior}→{ev.estado_nuevo})</span>}
                              {ev.comentario && <span className='italic ml-1 text-slate-500'>“{ev.comentario}”</span>}
                            </div>
                            <time className='text-slate-400'>{(ev.created_at||'').replace('T',' ').substring(11,16)}</time>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {histMeta.has_more && !loadingHist && (
                    <button className='btn-outline btn-xs mt-1' onClick={async ()=>{
                      setLoadingHist(true)
                      try {
                        const next = await fetchHistorialIncidencia(detailInc.id_incidencia, { limit: histMeta.limit, offset: histMeta.offset + histMeta.limit })
                        setHistorial(prev => [...prev, ...next.events])
                        setHistMeta(next.meta)
                      } catch(_){} finally { setLoadingHist(false) }
                    }}>Ver más</button>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2 text-slate-800 dark:text-slate-100">Fotos</p>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(detailInc.media) && detailInc.media.length > 0 ? (
                    detailInc.media.map(m => (
                      <img key={m.id || m.url} src={m.url} alt="foto" className="h-24 w-24 object-cover rounded border border-slate-300 dark:border-slate-600" />
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">Sin fotos</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

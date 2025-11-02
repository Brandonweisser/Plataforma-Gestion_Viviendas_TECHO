import React, { useEffect, useState, useContext } from 'react';
import { fetchHistorialIncidencia, groupEventsByDay, eventIcon } from '../services/historial'
import { DashboardLayout } from '../components/ui/DashboardLayout';
import { beneficiarioApi } from '../services/api';
import CardIncidencia from '../components/CardIncidencia';
import ValidationModal from '../components/ValidationModal';
import ImageModal from '../components/ui/ImageModal';
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
  const [filters, setFilters] = useState({ estado: '' });
  const [actionLoading, setActionLoading] = useState(false)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [preview, setPreview] = useState({ open: false, src: '', alt: '' })
  const stateChips = [
    { label: 'Todas', value: '' },
    { label: 'Abiertas', value: 'abierta' },
  { label: 'En proceso', value: 'en_proceso' },
    { label: 'Resueltas', value: 'resuelta' }
  ];

  async function load() {
    setLoading(true); setError('');
    try {
      const offset = (page - 1) * pageSize;
  const query = new URLSearchParams();
  if (filters.estado) query.set('estado', filters.estado);
  const res = await beneficiarioApi.listarIncidencias(pageSize, offset, query.toString());
      const list = Array.isArray(res.data) ? res.data : [];
      setIncidencias(list);
      setHasMore(res.meta?.hasMore || false);
      setTotal(res.meta?.total || list.length);
    } catch (e) {
      setError(e.message || 'No se pudieron cargar las incidencias');
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); // eslint-disable-next-line
  }, [page, filters.estado]);

  // When filters change, reset to page 1
  useEffect(() => { setPage(1); }, [filters.estado]);

  return (
    <DashboardLayout
      title="Historial de Reportes"
      subtitle="Todos tus reportes registrados"
      accent="blue"
      user={user || {}}
      onLogout={logout}
      footer={`© ${new Date().getFullYear()} TECHO Chile`}
    >
      <div className="w-full">
        <div className="mb-6">
          <button 
            onClick={() => navigate('/beneficiario')} 
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium transition-colors shadow-sm"
          >
            <span>←</span>
            <span>Volver al inicio</span>
          </button>
          
          {/* Chips de estado */}
          <div className="w-full overflow-x-auto scrollbar-hide -mx-2 px-2">
            <div className="flex items-center gap-2 min-w-min">
              {stateChips.map(chip => {
                const active = (filters.estado || '') === chip.value;
                return (
                  <button
                    key={chip.value || 'all'}
                    onClick={() => setFilters(f => ({ ...f, estado: chip.value }))}
                    className={`select-none whitespace-nowrap inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border text-xs sm:text-sm font-medium transition-all duration-200 ${active ? 'bg-techo-blue-600 text-white border-techo-blue-600 shadow-md' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700'} focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-techo-blue-400`}
                    aria-pressed={active}
                  >
                    {chip.label}
                  </button>
                )
              })}
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
        <div className="space-y-3 md:space-y-4">
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
            <div className="text-center py-10 md:py-12 bg-white/70 dark:bg-slate-800/40 border-2 border-slate-200 dark:border-slate-700 rounded-2xl">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-sky-50 text-sky-600 grid place-items-center border-2 border-sky-100">
                <span className="text-3xl" aria-hidden>🔧</span>
              </div>
              <h3 className="text-lg text-slate-800 dark:text-slate-100 font-bold mb-2">Sin reportes por ahora</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mb-5 px-4">Cuando tengas un problema en tu vivienda, crea un reporte para que podamos ayudarte.</p>
              <button className="btn-primary text-base px-6 py-3" onClick={() => navigate('/beneficiario/nueva-incidencia')}>📝 Crear mi primer reporte</button>
            </div>
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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 md:p-6" role="dialog" aria-modal="true">
          <div className="mt-8 mb-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-2xl w-full max-w-2xl p-6 md:p-7">
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
                {detailInc.estado === 'resuelta' && (
                  <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700">
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">¿La solución implementada resolvió tu incidencia?</p>
                    <div className="flex flex-wrap gap-2">
                      <button disabled={actionLoading} onClick={()=> setShowValidationModal(true)} className="btn-primary btn-sm disabled:opacity-50">Validar / Rechazar</button>
                    </div>
                  </div>
                )}
                <div className='mt-4'>
                  <p className='font-medium text-slate-900 dark:text-white mb-1'>Historial</p>
                  {loadingHist && <p className='text-xs text-slate-500'>Cargando historial…</p>}
                  {!loadingHist && historial.length===0 && <p className='text-xs text-slate-500'>Sin eventos</p>}
                  {!loadingHist && historial.length>0 && groupEventsByDay(historial).map(group => (
                    <div key={group.day} className='mb-2'>
                      <div className='text-[11px] font-semibold text-slate-500 mb-1'>{group.day}</div>
                      <ul className='space-y-1'>
                        {group.events.map(ev => (
                          <li key={ev.id} className='text-[11px] flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-700 py-1'>
                            <div className='flex-1 min-w-0'>
                              <span className='mr-1'>{eventIcon(ev.tipo_evento)}</span>
                              <span className='font-semibold'>{ev.tipo_evento}</span>
                              {ev.estado_anterior && ev.estado_nuevo && <span className='ml-1'>({ev.estado_anterior}→{ev.estado_nuevo})</span>}
                              {ev.comentario && <span className='italic ml-1 text-slate-500 block truncate'>"{ev.comentario}"</span>}
                            </div>
                            <time className='text-slate-400 text-[10px] whitespace-nowrap flex-shrink-0'>{(ev.created_at||'').replace('T',' ').substring(11,16)}</time>
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
                      <img
                        key={m.id || m.url}
                        src={m.url}
                        alt="foto"
                        className="h-24 w-24 object-cover rounded border border-slate-300 dark:border-slate-600 cursor-zoom-in hover:opacity-90"
                        onClick={() => setPreview({ open: true, src: m.url, alt: `Incidencia #${detailInc.id_incidencia}` })}
                      />
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
      {/* Modal de imagen en grande */}
      <ImageModal
        open={preview.open}
        src={preview.src}
        alt={preview.alt}
        onClose={() => setPreview({ open: false, src: '', alt: '' })}
      />
      {showValidationModal && detailInc && (
        <ValidationModal
          open={showValidationModal}
          loading={actionLoading}
          onClose={()=> setShowValidationModal(false)}
          onAccept={async ()=>{
            setActionLoading(true);
            try {
              await beneficiarioApi.validarIncidencia(detailInc.id_incidencia,{ conforme:true });
              await load();
              const refreshed = incidencias.find(i=>i.id_incidencia===detailInc.id_incidencia); setDetailInc(refreshed || null);
              setShowValidationModal(false);
            } catch(e){ throw e } finally { setActionLoading(false) }
          }}
          onReject={async ({ comentario, file })=>{
            setActionLoading(true);
            try {
              // Subir foto primero
              await beneficiarioApi.subirMediaIncidencia(detailInc.id_incidencia, [file]);
              await beneficiarioApi.validarIncidencia(detailInc.id_incidencia,{ conforme:false, comentario });
              await load();
              const refreshed = incidencias.find(i=>i.id_incidencia===detailInc.id_incidencia); setDetailInc(refreshed || null);
              setShowValidationModal(false);
            } catch(e){ throw e } finally { setActionLoading(false) }
          }}
        />
      )}
    </DashboardLayout>
  );
}

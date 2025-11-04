import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/ui/DashboardLayout';
import { SectionPanel } from '../../components/ui/SectionPanel';
import { adminApi } from '../../services/api';
import { XMarkIcon, MapPinIcon, UserGroupIcon, CheckCircleIcon, ClockIcon, ArrowPathIcon, ArrowLeftIcon } from '@heroicons/react/24/solid'

// Carga dinámica de Leaflet solo cuando se monta (evita SSR y reduce bundle inicial)
function useLeaflet() {
  const [L, setL] = useState(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (window.L) { setL(window.L); return; }
      const cssId = 'leaflet-css';
      if (!document.getElementById(cssId)) {
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      await import('https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js')
        .then(mod => { if (!cancelled) setL(mod); })
        .catch(async () => {
          // Fallback a versión global UMD si falla ESM (navegadores viejos)
          const scriptId = 'leaflet-umd';
          if (!document.getElementById(scriptId)) {
            const s = document.createElement('script');
            s.id = scriptId;
            s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            s.onload = () => { if (!cancelled) setL(window.L); };
            document.body.appendChild(s);
          } else if (window.L) setL(window.L);
        });
    }
    load();
    return () => { cancelled = true; };
  }, []);
  return L;
}

function markerHtml(color = '#0ea5e9', label = '•') {
  const size = 18;
  return `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:${color};color:#fff;font-size:10px;font-weight:600;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.25);">${label}</div>`;
}

// Chip de estado con iconos y estilos
function estadoChip(estadoRaw) {
  const e = (estadoRaw || '').toString().toLowerCase();
  const base = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors';
  if (['entregada','entregada_inicial','entregada_definitiva'].includes(e)) {
    return { label: 'entregada', className: `${base} bg-teal-600 text-white hover:bg-teal-500`, Icon: CheckCircleIcon };
  }
  if (['asignada'].includes(e)) {
    return { label: 'asignada', className: `${base} bg-sky-600 text-white hover:bg-sky-500`, Icon: UserGroupIcon };
  }
  if (['pendiente'].includes(e)) {
    return { label: 'pendiente', className: `${base} bg-amber-500 text-white hover:bg-amber-400`, Icon: ClockIcon };
  }
  if (['en_construccion','planificada','construida','lista_para_entregar'].includes(e)) {
    return { label: e.replaceAll('_',' '), className: `${base} bg-purple-600 text-white hover:bg-purple-500`, Icon: MapPinIcon };
  }
  return { label: e || '-', className: `${base} bg-gray-300 text-gray-800 hover:bg-gray-200`, Icon: MapPinIcon };
}

export default function MapaViviendas() {
  const navigate = useNavigate();
  const L = useLeaflet();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersLayer = useRef(null); // viviendas
  const projectsLayer = useRef(null); // proyectos
  const isMountedRef = useRef(true);
  
  const [search, setSearch] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  
  // Montaje/desmontaje para evitar setState tras unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Controles de zoom
  const zoomIn = () => { if (mapInstance.current) mapInstance.current.zoomIn(); };
  const zoomOut = () => { if (mapInstance.current) mapInstance.current.zoomOut(); };
  const resetView = () => {
    if (!mapInstance.current) return;
    try {
      const layers = markersLayer.current ? markersLayer.current.getLayers() : [];
      if (layers && layers.length && L) {
        const group = L.featureGroup(layers);
        mapInstance.current.fitBounds(group.getBounds().pad(0.2));
      } else {
        mapInstance.current.setView([-33.45, -70.66], 6);
      }
    } catch {
      mapInstance.current.setView([-33.45, -70.66], 6);
    }
  };
  

  // Función de carga reutilizable (para botón Refrescar y carga inicial)
  const loadData = async () => {
    try {
      setLoading(true);
      setApiError(null);
      const [resViv, resProj] = await Promise.all([
        adminApi.listarViviendas().catch((e)=>{ throw e }),
        adminApi.listarProyectos().catch(()=>({ data: [] }))
      ]);
      const raw = Array.isArray(resViv?.data) ? resViv.data : [];
      // Normalizar y validar coordenadas (acepta string/number)
      const toNum = (x) => {
        if (x === null || typeof x === 'undefined') return NaN;
        const n = typeof x === 'number' ? x : parseFloat(String(x).replace(',', '.'));
        return Number.isFinite(n) ? n : NaN;
      };
      const inRange = (lat, lon) => lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
      const list = raw
        .map(v => {
          const lat = toNum(v.latitud ?? v.latitude ?? v.lat);
          const lon = toNum(v.longitud ?? v.longitude ?? v.lng ?? v.lon);
          return { ...v, latitud: lat, longitud: lon };
        })
        .filter(v => Number.isFinite(v.latitud) && Number.isFinite(v.longitud) && inRange(v.latitud, v.longitud));
      if (isMountedRef.current) setData(list);
      // Proyectos: normalizar lat/lon también
      const rawProj = Array.isArray(resProj?.data) ? resProj.data : [];
      const projList = rawProj
        .map(p => ({
          ...p,
          latitud: toNum(p.latitud ?? p.latitude ?? p.lat),
          longitud: toNum(p.longitud ?? p.longitude ?? p.lng ?? p.lon),
        }))
        .filter(p => Number.isFinite(p.latitud) && Number.isFinite(p.longitud) && inRange(p.latitud, p.longitud));
      if (isMountedRef.current) setProjects(projList);
    } catch (e) {
      console.warn('No se pudieron cargar viviendas:', e?.message);
      if (isMountedRef.current) {
        setApiError(e?.message || 'Error cargando viviendas');
        setData([]);
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  // Carga inicial
  useEffect(() => { loadData(); }, []);

  // Inicializar mapa
  useEffect(() => {
    if (!L || mapInstance.current) return;
    mapInstance.current = L.map(mapRef.current, { minZoom: 3, maxZoom: 19, zoomControl: true }).setView([-33.45, -70.66], 6);
    const base = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors', maxZoom: 19 });
    base.addTo(mapInstance.current);
  markersLayer.current = L.layerGroup().addTo(mapInstance.current);
  projectsLayer.current = L.layerGroup().addTo(mapInstance.current);
    // Escala métrica
    if (L.control && L.control.scale) {
      L.control.scale({ imperial: false }).addTo(mapInstance.current);
    }
    return () => {
      try { mapInstance.current && mapInstance.current.remove(); } catch {}
      mapInstance.current = null;
    }
  }, [L]);

  // Pintar marcadores (viviendas solo si hay proyecto seleccionado)
  useEffect(() => {
    if (!L || !markersLayer.current) return;
  markersLayer.current.clearLayers();
  projectsLayer.current && projectsLayer.current.clearLayers();
    // Solo mostramos viviendas del proyecto seleccionado
    const viviendaFilter = (data || []).filter(d => {
      if (!selectedProjectId) return false; // no mostrar si no hay proyecto seleccionado
      const pid = d.id_proyecto ?? d.proyecto_id;
      if (pid !== selectedProjectId) return false;
      const txt = `${d?.proyecto?.nombre || ''} ${d?.direccion_normalizada || d?.direccion || ''}`.toLowerCase();
      return txt.includes(search.toLowerCase());
    });
    const leafletMarkers = viviendaFilter.map(f => L.marker([f.latitud, f.longitud], {
      icon: L.divIcon({ className: 'vivienda-marker', html: markerHtml('#0ea5e9', '•'), iconSize: [18,18], iconAnchor:[9,9], popupAnchor:[0,-12] })
    }).bindPopup(`
      <div style="min-width:220px">
        <strong>Vivienda ${f.numero_vivienda || ''}</strong><br/>
        Proyecto: ${f?.proyecto?.nombre || '-'}<br/>
        Estado: ${f?.estado || '-'}<br/>
        Dirección: ${f?.direccion_normalizada || f?.direccion || '-'}
      </div>
    `));
    leafletMarkers.forEach(m => markersLayer.current.addLayer(m));
    // Proyectos markers
    if (projectsLayer.current && Array.isArray(projects)) {
      const projMarkers = projects.map(p => {
        const m = L.marker([p.latitud, p.longitud], {
          draggable: !!editMode,
          icon: L.divIcon({ className: 'proyecto-marker', html: markerHtml('#a855f7', 'P'), iconSize: [18,18], iconAnchor:[9,9], popupAnchor:[0,-12] })
        }).bindPopup(`
        <div style="min-width:220px">
          <strong>Proyecto</strong><br/>
          Nombre: ${p?.nombre || '-'}<br/>
          Ubicación: ${p?.ubicacion || '-'}
        </div>
      `)
        if (editMode) {
          m.on('dragend', async (e) => {
            const ll = e.target.getLatLng();
            const id = p.id || p.id_proyecto;
            if (!id) return;
            try {
              await adminApi.actualizarProyecto(id, { latitud: ll.lat, longitud: ll.lng });
              // Actualizar estado local
              setProjects(prev => prev.map(pp => (pp.id === id || pp.id_proyecto === id) ? { ...pp, latitud: ll.lat, longitud: ll.lng } : pp));
            } catch (err) {
              console.warn('No se pudo guardar nueva ubicación del proyecto:', err?.message);
            }
          });
        }
        return m;
      });
      projMarkers.forEach(m => projectsLayer.current.addLayer(m));
    }
    // Ajustar vista si hay viviendas visibles; si no, enfocamos proyectos
    const vivLayers = markersLayer.current ? markersLayer.current.getLayers() : [];
    if (vivLayers && vivLayers.length) {
      const group = L.featureGroup(vivLayers);
      try { mapInstance.current.fitBounds(group.getBounds().pad(0.2)); } catch {}
    } else {
      const projLayers = projectsLayer.current ? projectsLayer.current.getLayers() : [];
      if (projLayers && projLayers.length) {
        const group = L.featureGroup(projLayers);
        try { mapInstance.current.fitBounds(group.getBounds().pad(0.2)); } catch {}
      }
    }
  }, [L, data, projects, search, selectedProjectId, editMode]);

  

  // Sin autocompletado externo: este mapa muestra solo viviendas existentes

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <SectionPanel title="Mapa de Viviendas" description="Distribución geográfica y validación de direcciones (demo)" showBack={false} actions={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/home')} className="inline-flex items-center gap-1 px-2 py-1 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm" aria-label="Volver al inicio">
              <ArrowLeftIcon className="h-4 w-4" />
              Volver
            </button>
            <button onClick={zoomOut} className="px-2 py-1 text-sm border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700" aria-label="Alejar">−</button>
            <button onClick={zoomIn} className="px-2 py-1 text-sm border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700" aria-label="Acercar">+</button>
            <button onClick={resetView} className="px-2 py-1 text-sm border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700" aria-label="Restablecer vista">Reset</button>
            <button onClick={loadData} disabled={loading} className={`px-2 py-1 text-sm border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 ${loading ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`} aria-label="Refrescar datos">
              <span className="inline-flex items-center gap-1">
                <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Actualizando…' : 'Refrescar'}
              </span>
            </button>
            <button onClick={() => setEditMode(v => !v)} className={`px-2 py-1 text-sm border rounded-lg ${editMode ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`} aria-label="Modo ajuste">
              {editMode ? 'Ajuste ON' : 'Ajustar proyectos'}
            </button>
          </div>
        }>
          <div className="flex flex-col md:flex-row gap-4 mb-4 items-center">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Buscar dirección o proyecto..."
                value={search}
                onChange={e=>setSearch(e.target.value)}
                className="w-full pr-8 pl-3 py-2 border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              {search && (
                <button
                  aria-label="Limpiar búsqueda"
                  onClick={()=>setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={()=>setSearch('')}
              className="px-3 py-2 text-sm border rounded-lg border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            >Limpiar</button>
            
          </div>
          {/* Mapa solo de viviendas creadas; sin buscador externo */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="order-2 lg:order-1 lg:col-span-1 max-h-[70vh] overflow-auto space-y-2 pr-2">
              {loading && <p className="text-xs text-gray-500">Cargando datos…</p>}
              {!loading && apiError && (
                <p className="text-xs text-red-500">{apiError}. ¿Está el backend en puerto 3001?</p>
              )}

              {/* Proyectos */}
              {(() => {
                const list = (projects || []).filter(p => (`${p?.nombre || ''} ${p?.ubicacion || ''}`).toLowerCase().includes(search.toLowerCase()));
                return (
                  <div>
                    {list.length > 0 && (
                      <div className="mb-1 text-[11px] font-semibold uppercase text-gray-500 dark:text-gray-400">Proyectos</div>
                    )}
                    {list.map(p => {
                      const pid = p.id || p.id_proyecto;
                      const isOpen = selectedProjectId === pid;
                      const viviendasDeProyecto = (data || []).filter(v => (v.id_proyecto ?? v.proyecto_id) === pid);
                      return (
                        <div key={`proj-${pid || p.nombre}`} className="w-full transition-all">
                          <button
                            onClick={() => {
                              if (mapInstance.current) mapInstance.current.setView([p.latitud, p.longitud], 15);
                              setSelectedProjectId(prev => prev === pid ? null : pid);
                            }}
                            className={`w-full flex items-center justify-between text-left px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm transition-colors ${isOpen ? 'bg-gray-50 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700' : ''}`}
                          >
                            <span className="truncate">
                              {p?.nombre || '(Proyecto)'} — {p?.ubicacion || '(Sin ubicación)'}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-purple-600 text-white hover:bg-purple-500 transition-colors">
                              <MapPinIcon className="h-3.5 w-3.5" /> proyecto
                            </span>
                          </button>
                          {isOpen && viviendasDeProyecto.length > 0 && (
                            <div className="ml-3 mt-1 space-y-1">
                              <div className="text-[10px] uppercase text-gray-400">Viviendas del proyecto</div>
                              {viviendasDeProyecto.map(d => (
                                <button key={`viv-in-proj-${d.id_vivienda}`}
                                  onClick={() => { if (mapInstance.current) mapInstance.current.setView([d.latitud, d.longitud], 16); }}
                                  className="w-full flex items-center justify-between text-left px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-[12px] transition-all hover:translate-x-0.5"
                                >
                                  <span className="truncate">
                                    {d?.direccion_normalizada || d?.direccion || '(Sin dirección)'}
                                  </span>
                                  {(() => { const s = estadoChip(d.estado); const I = s.Icon; return (
                                    <span className={s.className} title={`Estado: ${s.label}`}>
                                      <I className="h-3.5 w-3.5" /> {s.label}
                                    </span>
                                  ) })()}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Se removió la lista general de viviendas. Ahora solo se muestran al abrir un proyecto. */}

              {L && !loading && !apiError && (projects.length + data.length === 0) && (
                <p className="text-xs text-gray-500">Sin datos con coordenadas (latitud/longitud)</p>
              )}
            </div>
            <div className="order-1 lg:order-2 lg:col-span-3">
              <div ref={mapRef} className="w-full h-[70vh] rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700" />
            </div>
          </div>
          <div className="mt-4 text-[11px] text-gray-500 dark:text-gray-400 flex flex-wrap gap-4">
            <span>Librería: Leaflet 1.9.4</span>
            <span>Base: © OpenStreetMap</span>
            
            <span>Leyenda: 
              <span className="ml-1 inline-flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background:'#0ea5e9' }}></span>
                Viviendas
              </span>
              <span className="ml-3 inline-flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background:'#a855f7' }}></span>
                Proyectos
              </span>
            </span>
          </div>
        </SectionPanel>
      </div>
    </DashboardLayout>
  );
}

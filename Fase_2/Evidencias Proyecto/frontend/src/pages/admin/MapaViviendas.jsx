import React, { useEffect, useRef, useState } from 'react';
import { DashboardLayout } from '../../components/ui/DashboardLayout';
import { SectionPanel } from '../../components/ui/SectionPanel';
import { adminApi } from '../../services/api';

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

function markerHtml() {
  const size = 18;
  const color = '#0ea5e9';
  return `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:${color};color:#fff;font-size:10px;font-weight:600;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.25);">•</div>`;
}

export default function MapaViviendas() {
  const L = useLeaflet();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersLayer = useRef(null);
  
  const [search, setSearch] = useState('');
  const [data, setData] = useState([]);
  

  // Cargar viviendas desde API y luego inicializar mapa
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminApi.listarViviendas();
        const list = (res?.data || []).filter(v => typeof v.latitud === 'number' && typeof v.longitud === 'number');
        if (!cancelled) setData(list);
      } catch (e) {
        console.warn('No se pudieron cargar viviendas:', e?.message);
        if (!cancelled) setData([]);
      }
    })();
    return () => { cancelled = true };
  }, []);

  // Inicializar mapa
  useEffect(() => {
    if (!L || mapInstance.current) return;
    mapInstance.current = L.map(mapRef.current, { minZoom: 4, maxZoom: 12, zoomControl: false }).setView([-33.45, -70.66], 5.2);
    const base = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' });
    base.addTo(mapInstance.current);
    markersLayer.current = L.layerGroup().addTo(mapInstance.current);
    return () => {
      mapInstance.current = null;
    }
  }, [L]);

  // Pintar marcadores (solo viviendas existentes)
  useEffect(() => {
    if (!L || !markersLayer.current) return;
    markersLayer.current.clearLayers();
    const filtered = (data || []).filter(d => {
      const txt = `${d?.proyecto?.nombre || ''} ${d?.direccion_normalizada || d?.direccion || ''}`.toLowerCase();
      return txt.includes(search.toLowerCase());
    });
    const leafletMarkers = filtered.map(f => L.marker([f.latitud, f.longitud], {
      icon: L.divIcon({ className: 'vivienda-marker', html: markerHtml(), iconSize: [0,0], popupAnchor:[0,-10] })
    }).bindPopup(`
      <div style="min-width:220px">
        <strong>Vivienda ${f.numero_vivienda || ''}</strong><br/>
        Proyecto: ${f?.proyecto?.nombre || '-'}<br/>
        Estado: ${f?.estado || '-'}<br/>
        Dirección: ${f?.direccion_normalizada || f?.direccion || '-'}
      </div>
    `));
    leafletMarkers.forEach(m => markersLayer.current.addLayer(m));
    if (leafletMarkers.length) {
      const group = L.featureGroup(leafletMarkers);
      mapInstance.current.fitBounds(group.getBounds().pad(0.2));
    }
  }, [L, data, search]);

  

  // Sin autocompletado externo: este mapa muestra solo viviendas existentes

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <SectionPanel title="Mapa de Viviendas" description="Distribución geográfica y validación de direcciones (demo)">
          <div className="flex flex-col md:flex-row gap-4 mb-4 items-center">
            <input
              type="text"
              placeholder="Buscar comuna..."
              value={search}
              onChange={e=>setSearch(e.target.value)}
              className="w-full md:w-64 px-3 py-2 border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
            />
            <button
              onClick={()=>setSearch('')}
              className="px-3 py-2 text-sm border rounded-lg border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            >Limpiar</button>
            
          </div>
          {/* Mapa solo de viviendas creadas; sin buscador externo */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="order-2 lg:order-1 lg:col-span-1 max-h-[70vh] overflow-auto space-y-1 pr-2">
              {data
                .filter(d => (`${d?.proyecto?.nombre || ''} ${d?.direccion_normalizada || d?.direccion || ''}`).toLowerCase().includes(search.toLowerCase()))
                .map(d => (
                <button key={d.id_vivienda} onClick={() => { if (mapInstance.current) mapInstance.current.setView([d.latitud, d.longitud], 12); }} className="w-full flex items-center justify-between text-left px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">
                  <span className="truncate">
                    {d?.proyecto?.nombre || '(Proyecto)'} — {d?.direccion_normalizada || d?.direccion || '(Sin dirección)'}
                  </span>
                  <span className="text-xs font-semibold bg-sky-600 text-white px-2 py-0.5 rounded">{d.estado || '-'}</span>
                </button>
              ))}
              {L && !data.length && <p className="text-xs text-gray-500">Sin datos</p>}
            </div>
            <div className="order-1 lg:order-2 lg:col-span-3">
              <div ref={mapRef} className="w-full h-[70vh] rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700" />
            </div>
          </div>
          <div className="mt-4 text-[11px] text-gray-500 dark:text-gray-400 flex flex-wrap gap-4">
            <span>Librería: Leaflet 1.9.4</span>
            <span>Base: © OpenStreetMap</span>
            
            <span>Colores por rango: 1 / 2–3 / 4–5 / 6+</span>
          </div>
        </SectionPanel>
      </div>
    </DashboardLayout>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { DashboardLayout } from '../../components/ui/DashboardLayout';
import { SectionPanel } from '../../components/ui/SectionPanel';

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

const DEMO_DATA = [
  { comuna: 'San Bernardo', lat: -33.592, lng: -70.699, viviendas: 2 },
  { comuna: 'Maipú', lat: -33.516, lng: -70.757, viviendas: 3 },
  { comuna: 'Los Ángeles', lat: -37.469, lng: -72.353, viviendas: 5 },
  { comuna: 'Valparaíso', lat: -33.047, lng: -71.612, viviendas: 4 },
  { comuna: 'La Serena', lat: -29.904, lng: -71.249, viviendas: 1 },
  { comuna: 'Antofagasta', lat: -23.652, lng: -70.398, viviendas: 6 },
  { comuna: 'Puerto Montt', lat: -41.468, lng: -72.942, viviendas: 2 },
  { comuna: 'Punta Arenas', lat: -53.163, lng: -70.917, viviendas: 1 }
];

function markerHtml(v) {
  const size = Math.min(60, 24 + v * 4);
  const color = v >= 6 ? '#dc2626' : v >= 4 ? '#fb923c' : v >= 2 ? '#16a34a' : '#2563eb';
  return `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:${color};color:#fff;font-size:12px;font-weight:600;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.25);">${v}</div>`;
}

export default function MapaViviendas() {
  const L = useLeaflet();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersLayer = useRef(null);
  const [search, setSearch] = useState('');
  const [data, setData] = useState(DEMO_DATA);

  // Inicializar mapa
  useEffect(() => {
    if (!L || mapInstance.current) return;
    mapInstance.current = L.map(mapRef.current, { minZoom: 4, maxZoom: 12 }).setView([-33.45, -70.66], 5.2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(mapInstance.current);
    markersLayer.current = L.layerGroup().addTo(mapInstance.current);
  }, [L]);

  // Pintar marcadores
  useEffect(() => {
    if (!L || !markersLayer.current) return;
    markersLayer.current.clearLayers();
    const filtered = data.filter(d => d.comuna.toLowerCase().includes(search.toLowerCase()));
    const leafletMarkers = filtered.map(f => L.marker([f.lat, f.lng], {
      icon: L.divIcon({ className: 'vivienda-marker', html: markerHtml(f.viviendas), iconSize: [0,0], popupAnchor:[0,-10] })
    }).bindPopup(`<strong>${f.comuna}</strong><br>Viviendas: ${f.viviendas}`));
    leafletMarkers.forEach(m => markersLayer.current.addLayer(m));
    if (leafletMarkers.length) {
      const group = L.featureGroup(leafletMarkers);
      mapInstance.current.fitBounds(group.getBounds().pad(0.2));
    }
  }, [L, data, search]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <SectionPanel title="Mapa de Viviendas" description="Distribución geográfica demo de viviendas por comuna (datos estáticos)">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="order-2 lg:order-1 lg:col-span-1 max-h-[70vh] overflow-auto space-y-1 pr-2">
              {data.filter(d=>d.comuna.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>b.viviendas-a.viviendas).map(d => (
                <button key={d.comuna} onClick={() => { if (mapInstance.current) mapInstance.current.setView([d.lat, d.lng], 10); }} className="w-full flex items-center justify-between text-left px-2 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">
                  <span>{d.comuna}</span>
                  <span className="text-xs font-semibold bg-pink-600 text-white px-2 py-0.5 rounded">{d.viviendas}</span>
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
            <span>Fuente base: © OpenStreetMap</span>
            <span>Colores por rango: 1 / 2–3 / 4–5 / 6+</span>
          </div>
        </SectionPanel>
      </div>
    </DashboardLayout>
  );
}

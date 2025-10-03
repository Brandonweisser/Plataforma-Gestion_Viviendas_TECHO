// script.js - Demo Mapa Viviendas por Comuna (Leaflet)
// Requiere incluir leaflet.css y leaflet.js vía CDN en index.html

const MAP_INITIAL = {
  center: [-33.45, -70.66], // Santiago
  zoom: 5.2
};

const map = L.map('map', { minZoom: 4, maxZoom: 12 }).setView(MAP_INITIAL.center, MAP_INITIAL.zoom);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Icono escalable según cantidad de viviendas
function markerHtml(viviendas) {
  const size = Math.min(60, 24 + viviendas * 4); // limita máximo
  const color = viviendas >= 6 ? '#dc2626' : viviendas >= 4 ? '#fb923c' : viviendas >= 2 ? '#16a34a' : '#2563eb';
  return `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:${color};color:#fff;font-size:12px;font-weight:600;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.25);">${viviendas}</div>`;
}

function createMarker(feature) {
  return L.marker([feature.lat, feature.lng], {
    icon: L.divIcon({
      className: 'vivienda-marker',
      html: markerHtml(feature.viviendas),
      iconSize: [0, 0], // se maneja por HTML
      popupAnchor: [0, -10]
    })
  }).bindPopup(`<strong>${feature.comuna}</strong><br>Viviendas: ${feature.viviendas}`);
}

async function loadData() {
  const res = await fetch('data.json');
  const data = await res.json();

  // Agrupar si hay duplicadas por comuna (ejemplo extendible)
  const agregadas = Object.values(data.reduce((acc, item) => {
    const key = item.comuna;
    if (!acc[key]) acc[key] = { ...item };
    else acc[key].viviendas += item.viviendas;
    return acc;
  }, {}));

  agregadas.forEach(f => createMarker(f).addTo(map));

  // Ajustar bounds
  const group = new L.FeatureGroup(agregadas.map(f => L.marker([f.lat, f.lng])));
  map.fitBounds(group.getBounds().pad(0.2));

  buildSidebar(agregadas);
}

function buildSidebar(list) {
  const side = document.getElementById('sidebar-list');
  if (!side) return;
  side.innerHTML = '';
  list.sort((a,b) => b.viviendas - a.viviendas).forEach(item => {
    const li = document.createElement('li');
    li.className = 'flex items-center justify-between gap-2 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer';
    li.innerHTML = `<span>${item.comuna}</span><span class="text-sm font-semibold">${item.viviendas}</span>`;
    li.addEventListener('click', () => {
      map.setView([item.lat, item.lng], 10);
    });
    side.appendChild(li);
  });
}

loadData();

// Verificación simple: coordenadas dentro de límites aproximados de Chile continental + extremos
// Mejorable a polígonos si se requiere más precisión.

const CHILE_BOUNDS = {
  minLat: -56.0, // sur (Magallanes)
  maxLat: -17.0, // norte
  minLng: -76.0, // pacífico
  maxLng: -66.0  // cordillera
}

export function isPointInChileBounds(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false
  return lat >= CHILE_BOUNDS.minLat && lat <= CHILE_BOUNDS.maxLat && lng >= CHILE_BOUNDS.minLng && lng <= CHILE_BOUNDS.maxLng
}

export default CHILE_BOUNDS

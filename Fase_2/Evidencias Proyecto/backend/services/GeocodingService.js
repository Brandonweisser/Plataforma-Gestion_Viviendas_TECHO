import fetch from 'node-fetch'
import { isPointInChileBounds } from '../utils/chileBounds.js'

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN
const GEOCODER_BASE = 'https://api.mapbox.com/geocoding/v5/mapbox.places'
const OSM_BASE = 'https://nominatim.openstreetmap.org'
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY

function normalizeText(s) {
  return (s || '').trim()
}
function haversineMeters(lat1, lon1, lat2, lon2) {
  function toRad(d) { return d * Math.PI / 180 }
  const R = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

async function osmGeocode(address) {
  const q = normalizeText(address)
  const url = `${OSM_BASE}/search?format=jsonv2&countrycodes=cl&addressdetails=1&limit=1&q=${encodeURIComponent(q)}`
  const resp = await fetch(url, { headers: { 'User-Agent': 'TECHO-Platform/2.0 (support@techo.org)' } })
  if (!resp.ok) return null
  const arr = await resp.json()
  const it = (arr || [])[0]
  if (!it) return null
  const lat = parseFloat(it.lat)
  const lng = parseFloat(it.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (!isPointInChileBounds(lat, lng)) return null
  const house = it.address?.house_number || extractNumberStr(it.display_name)
  return {
    provider: 'osm',
    valid: true,
    normalized: it.display_name,
    lat, lng,
    comuna: it.address?.city || it.address?.town || it.address?.suburb || it.address?.village || null,
    region: it.address?.state || null,
    houseNumber: house
  }
}

async function googleGeocode(address) {
  if (!GOOGLE_API_KEY) return null
  const q = normalizeText(address)
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&components=country:CL&region=cl&key=${GOOGLE_API_KEY}`
  const resp = await fetch(url)
  if (!resp.ok) return null
  const json = await resp.json()
  if (json.status !== 'OK' || !(json.results || []).length) return null
  const r = json.results[0]
  const lat = r.geometry?.location?.lat
  const lng = r.geometry?.location?.lng
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (!isPointInChileBounds(lat, lng)) return null
  const comps = r.address_components || []
  const get = (type) => comps.find(c => (c.types || []).includes(type))?.long_name
  const houseNumber = get('street_number') || extractNumberStr(r.formatted_address)
  const comuna = get('locality') || get('sublocality') || get('administrative_area_level_3') || null
  const region = get('administrative_area_level_1') || null
  return {
    provider: 'google',
    valid: true,
    normalized: r.formatted_address,
    lat, lng,
    comuna, region,
    houseNumber,
    raw: r
  }
}

function extractNumberStr(s) {
  const m = (s || '').match(/\d{1,6}/)
  return m ? m[0] : ''
}

function mapboxToSuggestion(f) {
  return {
    id: f.id,
    place_name: f.place_name,
    text: f.text,
    center: { lng: f.center?.[0], lat: f.center?.[1] },
    geometry: f.geometry || null,
    place_type: f.place_type || [],
    properties: f.properties || {},
    routable_points: f.routable_points || f.properties?.routable_points || null,
    context: f.context || [],
    relevance: f.relevance
  }
}

function extractChileAdmin(context = []) {
  // Mapbox context: region, district, place, locality, etc.
  const get = type => context.find(c => (c.id || '').startsWith(type + '.'))
  const region = get('region')?.text
  const place = get('place')?.text // comúnmente comuna/ciudad
  return { region, comuna: place }
}

export async function geocodeSearch(q) {
  if (!MAPBOX_TOKEN) return []
  // Solo direcciones para máxima precisión en la selección; routing=true para obtener puntos enrutable
  const url = `${GEOCODER_BASE}/${encodeURIComponent(q)}.json?country=cl&language=es&types=address&routing=true&proximity=-70.66,-33.45&limit=8&access_token=${MAPBOX_TOKEN}`
  const resp = await fetch(url)
  if (!resp.ok) return []
  const json = await resp.json()
  return (json.features || []).map(mapboxToSuggestion)
}

export async function validateAddress({ address, comuna, region }) {
  const q = normalizeText(address)
  const qNum = extractNumberStr(q)
  if (!qNum) return { valid: false, reason: 'Falta número en la dirección' }

  // 1) Google primero (si hay API key)
  try {
    const g = await googleGeocode(address)
    if (g && g.valid) {
      if (!g.houseNumber || g.houseNumber === qNum) {
        return {
          valid: true,
          normalized: g.normalized,
          lat: g.lat,
          lng: g.lng,
          comuna: g.comuna || comuna || null,
          region: g.region || region || null,
          provider: 'google',
          relevance: 1,
          raw: g.raw
        }
      }
    }
  } catch {}

  // 2) OSM
  try {
    const osmFirst = await osmGeocode(address)
    if (osmFirst && osmFirst.valid) {
      if (!osmFirst.houseNumber || osmFirst.houseNumber === qNum) {
        return {
          valid: true,
          normalized: osmFirst.normalized,
          lat: osmFirst.lat,
          lng: osmFirst.lng,
          comuna: osmFirst.comuna || comuna || null,
          region: osmFirst.region || region || null,
          provider: 'osm',
          relevance: 1,
          raw: { osm: osmFirst }
        }
      }
    }
  } catch {}

  // 3) Mapbox
  if (!MAPBOX_TOKEN) {
    return { valid: false, reason: 'No se pudo validar con Google/OSM y falta MAPBOX_TOKEN' }
  }
  const url = `${GEOCODER_BASE}/${encodeURIComponent(q)}.json?country=cl&language=es&types=address&autocomplete=false&fuzzyMatch=false&routing=true&proximity=-70.66,-33.45&limit=1&access_token=${MAPBOX_TOKEN}`
  const resp = await fetch(url)
  if (!resp.ok) return { valid: false, reason: 'Geocoder no disponible' }
  const json = await resp.json()
  const f = (json.features || [])[0]
  if (!f) return { valid: false, reason: 'Sin coincidencias' }
  if (typeof f.relevance === 'number' && f.relevance < 0.9) {
    return { valid: false, reason: 'Baja confianza del geocoder', relevance: f.relevance }
  }
  const { region: gRegion, comuna: gComuna } = extractChileAdmin(f.context)
  if (comuna && gComuna && normalizeText(comuna).toLowerCase() !== normalizeText(gComuna).toLowerCase()) {
    return { valid: false, reason: `Comuna no coincide (${gComuna})` }
  }
  if (region && gRegion && normalizeText(region).toLowerCase() !== normalizeText(gRegion).toLowerCase()) {
    return { valid: false, reason: `Región no coincide (${gRegion})` }
  }
  const rp = (f.routable_points && (f.routable_points.points?.[0]?.coordinates || f.routable_points[0]?.coordinates))
  // Preferir routable_points (más cercano a fachada/calle), luego geometry.coordinates, luego center
  const coords = (Array.isArray(rp) ? rp
    : (Array.isArray(f.geometry?.coordinates)
        ? f.geometry.coordinates
        : (Array.isArray(f.center)
            ? f.center
            : null)))
  const [lng, lat] = coords || []
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return { valid: false, reason: 'Coordenadas inválidas' }
  }
  const fNum = f.address || f.properties?.address || extractNumberStr(f.place_name)
  if (fNum && qNum && fNum !== qNum) {
    return { valid: false, reason: `Número de calle no coincide (${fNum} ≠ ${qNum})` }
  }
  if (!isPointInChileBounds(lat, lng)) {
    return { valid: false, reason: 'Fuera de límites de Chile' }
  }
  let result = {
    valid: true,
    normalized: f.place_name,
    lat, lng,
    comuna: gComuna || comuna || null,
    region: gRegion || region || null,
    provider: 'mapbox',
    relevance: f.relevance,
    raw: f
  }
  return result
}

// Validación basada en un feature ya seleccionado por el usuario (evita re-geocodificar)
export async function validateFromFeature(feature, { comuna, region, addressQuery } = {}) {
  if (!feature) return { valid: false, reason: 'Feature vacío' }
  const place_name = feature.place_name || ''
  const q = normalizeText(place_name)
  const qNum = extractNumberStr(addressQuery || q) || extractNumberStr(feature.text || '')
  if (!qNum) return { valid: false, reason: 'Falta número en la dirección' }

  // Preferir punto enrutable o geometry.coordinates si existen, si no center
  const rp = feature?.routable_points && (feature.routable_points.points?.[0]?.coordinates || feature.routable_points[0]?.coordinates)
  // Preferir routable_points, luego geometry.coordinates, luego center
  const coords = (Array.isArray(rp) ? rp
    : (Array.isArray(feature?.geometry?.coordinates)
        ? feature.geometry.coordinates
        : (feature.center?.lng != null && feature.center?.lat != null
            ? [feature.center.lng, feature.center.lat]
            : (Array.isArray(feature.center)
                ? feature.center
                : null))))
  const lng = Array.isArray(coords) ? coords[0] : undefined
  const lat = Array.isArray(coords) ? coords[1] : undefined
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return { valid: false, reason: 'Coordenadas inválidas' }
  }
  if (!isPointInChileBounds(lat, lng)) {
    return { valid: false, reason: 'Fuera de límites de Chile' }
  }

  // Coincidencia de número de calle si está disponible en el feature
  const fNum = feature.address || feature.properties?.address || extractNumberStr(place_name)
  if (fNum && qNum && fNum !== qNum) {
    return { valid: false, reason: `Número de calle no coincide (${fNum} ≠ ${qNum})` }
  }

  const { region: gRegion, comuna: gComuna } = extractChileAdmin(feature.context || [])
  // Si el front no envía comuna/region (caso normal), no forcemos el match exacto para evitar falsos negativos
  if (comuna && gComuna && normalizeText(comuna).toLowerCase() !== normalizeText(gComuna).toLowerCase()) {
    return { valid: false, reason: `Comuna no coincide (${gComuna})` }
  }
  if (region && gRegion && normalizeText(region).toLowerCase() !== normalizeText(gRegion).toLowerCase()) {
    return { valid: false, reason: `Región no coincide (${gRegion})` }
  }

  // 1) Google si addressQuery
  if (addressQuery) {
    try {
      const g = await googleGeocode(addressQuery)
      if (g && g.valid) {
        if (!g.houseNumber || g.houseNumber === qNum) {
          return {
            valid: true,
            normalized: g.normalized,
            lat: g.lat,
            lng: g.lng,
            comuna: g.comuna || null,
            region: g.region || null,
            provider: 'google',
            relevance: 1,
            raw: { google: g.raw, mapbox: feature }
          }
        }
      }
    } catch {}
  }

  // 2) OSM si addressQuery
  if (addressQuery) {
    try {
      const osmFirst = await osmGeocode(addressQuery)
      const qNum = extractNumberStr(addressQuery)
      if (osmFirst && osmFirst.valid) {
        if (!qNum || !osmFirst.houseNumber || qNum === osmFirst.houseNumber) {
          return {
            valid: true,
            normalized: osmFirst.normalized,
            lat: osmFirst.lat,
            lng: osmFirst.lng,
            comuna: osmFirst.comuna || null,
            region: osmFirst.region || null,
            provider: 'osm',
            relevance: 1,
            raw: { osm: osmFirst, mapbox: feature }
          }
        }
      }
    } catch {}
  }

  // 3) Mapbox feature
  let result = {
    valid: true,
    normalized: place_name,
    lat, lng,
    comuna: gComuna || comuna || null,
    region: gRegion || region || null,
    provider: 'mapbox',
    relevance: feature.relevance,
    raw: feature
  }

  // Fallback/contraste con OSM si hay addressQuery
  try {
    if (addressQuery) {
      const osm = await osmGeocode(addressQuery)
      if (osm && osm.valid) {
        const dist = haversineMeters(result.lat, result.lng, osm.lat, osm.lng)
        const fNum = feature.address || feature.properties?.address || extractNumberStr(place_name)
        const preferOSM = (fNum && osm.houseNumber && fNum !== osm.houseNumber) || dist > 120
        if (preferOSM) {
          result = {
            valid: true,
            normalized: osm.normalized,
            lat: osm.lat,
            lng: osm.lng,
            comuna: osm.comuna || result.comuna,
            region: osm.region || result.region,
            provider: 'osm',
            relevance: result.relevance,
            raw: { mapbox: feature, osm }
          }
        }
      }
    }
  } catch {}

  return result
}

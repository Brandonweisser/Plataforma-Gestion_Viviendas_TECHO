// Helper para obtener historial de incidencias con paginación
// Devuelve { events, meta }
import { getToken } from './token'

const BASE_URL = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL
  : 'http://localhost:3001'

export async function fetchHistorialIncidencia(id, { limit = 50, offset = 0 } = {}) {
  const token = getToken()
  const url = new URL(`/api/incidencias/${id}/historial`, BASE_URL)
  url.searchParams.set('limit', limit)
  url.searchParams.set('offset', offset)
  const res = await fetch(url.toString(), {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  })
  const data = await res.json().catch(()=>({}))
  if (!res.ok || data.success === false) {
    throw new Error(data.message || 'Error historial')
  }
  return { events: data.data || [], meta: data.meta || { total: 0, limit, offset, has_more: false } }
}

// Agrupar por día y ordenar: comentarios primero dentro de cada día, luego otros por fecha desc
export function groupEventsByDay(events) {
  const groups = {}
  for (const ev of events) {
    const day = (ev.created_at||'').slice(0,10)
    if (!groups[day]) groups[day] = []
    groups[day].push(ev)
  }
  const orderedDays = Object.keys(groups).sort((a,b)=> b.localeCompare(a)) // más reciente primero
  return orderedDays.map(day => {
    const evs = groups[day]
    evs.sort((a,b)=>{
      const isCommentA = a.tipo_evento === 'comentario'
      const isCommentB = b.tipo_evento === 'comentario'
      if (isCommentA !== isCommentB) return isCommentA ? -1 : 1 // comentarios primero
      return (b.created_at||'').localeCompare(a.created_at||'')
    })
    return { day, events: evs }
  })
}

export function eventIcon(tipo) {
  switch (tipo) {
    case 'comentario': return '💬'
    case 'estado_cambiado': return '🔄'
    case 'creada':
    case 'creada_desde_posventa': return '🆕'
    case 'media_agregada': return '🖼️'
    case 'edicion': return '✏️'
    case 'asignacion': return '👤'
    default: return '•'
  }
}

export async function searchAddresses(q) {
  const url = `/api/geo/search?q=${encodeURIComponent(q)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Error buscando direcciones')
  const json = await res.json()
  return json.data || []
}

export async function validateAddress(payload) {
  const res = await fetch('/api/geo/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const json = await res.json()
  if (!res.ok || !json.success) {
    const msg = json.message || 'Dirección no válida'
    const data = json.data
    const error = new Error(msg)
    error.data = data
    throw error
  }
  return json.data
}

import React, { useEffect, useState } from 'react'
import { beneficiarioApi } from '../../services/api'

export default function BeneficiarioDashboard() {
  const [vivienda, setVivienda] = useState(null)
  const [recepcion, setRecepcion] = useState(null)
  const [items, setItems] = useState([])
  const [incs, setIncs] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function loadAll() {
    setLoading(true)
    setMessage('')
    try {
      const v = await beneficiarioApi.vivienda()
      setVivienda(v.data)
      const r = await beneficiarioApi.recepcionResumen()
      setRecepcion(r.data)
      const it = await beneficiarioApi.recepcionItems()
      setItems(it?.data?.items || [])
      const li = await beneficiarioApi.listarIncidencias(20)
      setIncs(li.data || [])
    } catch (e) {
      setMessage(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  async function crearRecepcion() {
    setLoading(true); setMessage('')
    try { await beneficiarioApi.crearRecepcion(); await loadAll() } catch(e){ setMessage(e.message) } finally { setLoading(false) }
  }
  async function enviarRecepcion() {
    setLoading(true); setMessage('')
    try { await beneficiarioApi.enviarRecepcion(); await loadAll() } catch(e){ setMessage(e.message) } finally { setLoading(false) }
  }
  async function guardarItemsDemo() {
    setLoading(true); setMessage('')
    try {
      const demo = [ { categoria: 'General', item: 'Puerta', ok: false, comentario: 'Rasguño', orden: 1 } ]
      await beneficiarioApi.guardarRecepcionItems(demo)
      await loadAll()
    } catch(e){ setMessage(e.message) } finally { setLoading(false) }
  }
  async function crearIncidenciaDemo() {
    setLoading(true); setMessage('')
    try {
      await beneficiarioApi.crearIncidencia({ descripcion: 'Goteo en techo', categoria: 'Estructura' })
      await loadAll()
    } catch(e){ setMessage(e.message) } finally { setLoading(false) }
  }

  return (
    <div className='p-6 space-y-4'>
      <h1 className='text-2xl font-bold'>Panel Beneficiario</h1>
      {message && <div className='text-red-600'>{message}</div>}
      {loading && <div className='text-gray-600'>Cargando...</div>}

      <section className='border p-4 rounded bg-white'>
        <h2 className='font-semibold mb-2'>Mi vivienda</h2>
        <pre className='bg-gray-50 p-2 rounded overflow-auto text-sm'>{JSON.stringify(vivienda, null, 2)}</pre>
        <div className='flex gap-2 mt-3'>
          <button className='px-3 py-2 bg-blue-600 text-white rounded' onClick={loadAll} disabled={loading}>Refrescar</button>
          <button className='px-3 py-2 bg-emerald-600 text-white rounded' onClick={crearRecepcion} disabled={loading}>Crear recepción (si no hay activa)</button>
          <button className='px-3 py-2 bg-amber-600 text-white rounded' onClick={guardarItemsDemo} disabled={loading}>Guardar ítems (demo)</button>
          <button className='px-3 py-2 bg-indigo-600 text-white rounded' onClick={enviarRecepcion} disabled={loading}>Enviar recepción</button>
        </div>
      </section>

      <section className='border p-4 rounded bg-white'>
        <h2 className='font-semibold mb-2'>Recepción (resumen) e ítems</h2>
        <pre className='bg-gray-50 p-2 rounded overflow-auto text-sm'>{JSON.stringify(recepcion, null, 2)}</pre>
        <pre className='bg-gray-50 p-2 rounded overflow-auto text-sm'>{JSON.stringify(items, null, 2)}</pre>
      </section>

      <section className='border p-4 rounded bg-white'>
        <h2 className='font-semibold mb-2'>Incidencias</h2>
        <div className='flex gap-2 mb-2'>
          <button className='px-3 py-2 bg-blue-600 text-white rounded' onClick={loadAll} disabled={loading}>Refrescar</button>
          <button className='px-3 py-2 bg-rose-600 text-white rounded' onClick={crearIncidenciaDemo} disabled={loading}>Crear incidencia (demo)</button>
        </div>
        <pre className='bg-gray-50 p-2 rounded overflow-auto text-sm'>{JSON.stringify(incs, null, 2)}</pre>
      </section>
    </div>
  )
}

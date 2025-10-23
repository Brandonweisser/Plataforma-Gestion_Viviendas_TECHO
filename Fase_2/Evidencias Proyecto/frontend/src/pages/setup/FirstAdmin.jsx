import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setupApi } from '../../services/api'

export default function FirstAdmin() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [hasAdmin, setHasAdmin] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')

  useEffect(()=>{
    async function check() {
      setLoading(true); setError('')
      try {
        const r = await setupApi.estado()
        setHasAdmin(!!r.data?.hasAdmin)
      } catch(e) { setError(e.message || 'Error consultando estado') }
      finally { setLoading(false) }
    }
    check()
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    try {
      await setupApi.crearPrimerAdmin({ email, password, nombre })
      setSuccess('Admin creado. Ya puedes iniciar sesión.')
      // Redirigir automáticamente al login
      setTimeout(() => navigate('/', { replace: true }), 1200)
    } catch (e) {
      setError(e.message || 'No se pudo crear el admin')
    }
  }

  if (loading) return <p className='p-6 text-center text-gray-900'>Cargando...</p>

  if (hasAdmin) {
    return (
      <div className='min-h-screen flex items-center justify-center p-6 bg-gray-50'>
        <div className='max-w-md w-full bg-white rounded shadow p-6 border border-gray-200 text-gray-900'>
          <h1 className='text-2xl font-semibold mb-2 text-gray-900'>Setup bloqueado</h1>
          <p className='text-gray-800'>Ya existe un administrador. Ve a iniciar sesión.</p>
          <button
            type='button'
            onClick={() => navigate('/')}
            className='mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
          >Ir a iniciar sesión</button>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 p-6'>
      <div className='max-w-md w-full bg-white rounded shadow p-6 border border-gray-200 text-gray-900'>
        <h1 className='text-2xl font-semibold mb-2 text-gray-900'>Crear primer administrador</h1>
        {error && <p className='text-red-600'>{error}</p>}
        {success && <p className='text-green-700'>{success}</p>}
        <form onSubmit={handleCreate} className='space-y-3'>
          <div>
            <label className='block text-sm font-medium text-gray-800'>Email</label>
            <input
              type='email'
              value={email}
              onChange={e=>setEmail(e.target.value)}
              required
              className='w-full px-3 py-2 border border-gray-300 rounded bg-white text-gray-900'
              placeholder='admin@tuorg.org'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-800'>Nombre</label>
            <input
              value={nombre}
              onChange={e=>setNombre(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded bg-white text-gray-900'
              placeholder='Admin Inicial'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-800'>Contraseña</label>
            <input
              type='password'
              value={password}
              onChange={e=>setPassword(e.target.value)}
              required
              className='w-full px-3 py-2 border border-gray-300 rounded bg-white text-gray-900'
              placeholder='UnaClaveSegura123'
            />
          </div>
          <button type='submit' className='w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'>Crear administrador</button>
        </form>
      </div>
    </div>
  )
}

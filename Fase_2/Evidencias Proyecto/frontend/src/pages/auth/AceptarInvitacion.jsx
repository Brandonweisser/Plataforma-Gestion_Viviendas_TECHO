import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { invitationApi } from '../../services/api'

export default function AceptarInvitacion() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') || ''
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [info, setInfo] = useState(null)
  const [nombre, setNombre] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true); setError('')
      try {
        const res = await invitationApi.validar(token)
        setInfo(res.data)
        setNombre(res.data?.nombre || '')
      } catch (e) {
        setError(e.message || 'No se pudo validar la invitación')
      } finally { setLoading(false) }
    }
    if (token) load(); else { setError('Token faltante'); setLoading(false) }
  }, [token])

  async function handleAccept(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    try {
      await invitationApi.aceptar({ token, password, nombre })
      setSuccess('Cuenta creada. Ya puedes iniciar sesión.')
      setTimeout(()=> navigate('/', { replace:true }), 1500)
    } catch (e) {
      setError(e.message || 'No se pudo aceptar la invitación')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Aceptar invitación</h1>
        {loading && <p className="text-gray-500 dark:text-gray-400">Validando invitación...</p>}
        {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
        {info && !loading && !success && (
          <form onSubmit={handleAccept} className="space-y-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Invitación para <b className="text-gray-900 dark:text-gray-100">{info.email}</b> con rol <b className="text-gray-900 dark:text-gray-100">{info.rol}</b>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
              <input
                value={nombre}
                onChange={e=>setNombre(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Tu nombre"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e=>setPassword(e.target.value)}
                  className="w-full pr-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Elige una contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={()=>setShowPwd(v=>!v)}
                  aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title={showPwd ? 'Ocultar' : 'Mostrar'}
                >
                  {/* Ojo simple en SVG para no depender de icon libs */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 5 12 5c4.64 0 8.577 2.51 9.964 6.678.06.19.06.394 0 .644C20.577 16.49 16.64 19 12 19c-4.64 0-8.577-2.51-9.964-6.678z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>
            <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Crear cuenta</button>
          </form>
        )}
        {success && <p className="text-green-700 dark:text-green-400">{success}</p>}
      </div>
    </div>
  )
}

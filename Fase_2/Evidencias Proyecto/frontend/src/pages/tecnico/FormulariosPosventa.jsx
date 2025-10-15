import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/ui/DashboardLayout'
import { SectionPanel } from '../../components/ui/SectionPanel'

export default function FormulariosPosventa() {
  const [formularios, setFormularios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({
    estado: '',
    search: '',
    con_pdf: false,
    sin_pdf: false
  });
  const [meta, setMeta] = useState({ total: 0, limit: 20, offset: 0, hasMore: false });

  const fetchFormularios = useCallback(async (offset = 0) => {
    const params = new URLSearchParams({
      limit: meta.limit.toString(),
      offset: offset.toString(),
      ...(filtros.estado && { estado: filtros.estado }),
      ...(filtros.search && { search: filtros.search }),
      ...(filtros.con_pdf && { con_pdf: 'true' }),
      ...(filtros.sin_pdf && { sin_pdf: 'true' })
    });

    const token = localStorage.getItem('token');
    const url = `http://localhost:3001/api/tecnico/posventa/formularios?${params}`;
    
    try {
      setLoading(true);
      
      console.log('🔄 Iniciando petición a:', url);
      console.log('🎫 Token presente:', !!token);
      console.log('🎫 Token (primeros 20 chars):', token?.substring(0, 20) + '...');
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        if (offset === 0) {
          setFormularios(data.data);
        } else {
          setFormularios(prev => [...prev, ...data.data]);
        }
        setMeta(data.meta);
      } else {
        setError(data.message || 'Error cargando formularios');
      }
    } catch (err) {
      console.error('Error detallado cargando formularios:', {
        message: err.message,
        status: err.status,
        url: url
      });
      
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('Error: No se puede conectar al servidor backend (puerto 3001)');
      } else if (err.status === 401) {
        setError('Error: No autorizado - verifica que estés logueado como técnico');
      } else if (err.status === 403) {
        setError('Error: Sin permisos para ver formularios de posventa');
      } else {
        setError(`Error de conexión: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [filtros.estado, filtros.search, filtros.con_pdf, filtros.sin_pdf, meta.limit]);

  useEffect(() => {
    fetchFormularios();
  }, [fetchFormularios]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchFormularios(0);
  };

  const handleGenerarPDF = async (formId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/posventa/form/${formId}/generar-pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        // Actualizar el formulario en la lista
        setFormularios(prev => prev.map(form => 
          form.id === formId 
            ? { 
                ...form, 
                pdf: { 
                  existe: true, 
                  path: data.data.pdf_path,
                  url_publica: data.data.pdf_url,
                  generado_en: new Date().toISOString()
                }
              }
            : form
        ));
        
        // Abrir PDF en nueva pestaña
        if (data.data.pdf_url) {
          window.open(data.data.pdf_url, '_blank');
        }
      } else {
        alert(`Error generando PDF: ${data.message}`);
      }
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('Error de conexión al generar PDF');
    }
  };

  const handleDescargarPDF = async (formId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/posventa/form/${formId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success && data.data.download_url) {
        window.open(data.data.download_url, '_blank');
      } else {
        alert('Error obteniendo enlace de descarga');
      }
    } catch (err) {
      console.error('Error descargando PDF:', err);
      alert('Error de conexión');
    }
  };

  const handleRevisarFormulario = async (formId) => {
    const comentario = prompt('Comentario de revisión (opcional):');
    if (comentario === null) return; // Usuario canceló
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/tecnico/posventa/form/${formId}/revisar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comentario_tecnico: comentario,
          generar_incidencias: true
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Actualizar estado del formulario
        setFormularios(prev => prev.map(form => 
          form.id === formId 
            ? { ...form, estado: 'revisada', fecha_revisada: new Date().toISOString() }
            : form
        ));
        
        alert(data.data.mensaje || 'Formulario revisado exitosamente');
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (err) {
      console.error('Error revisando formulario:', err);
      alert('Error de conexión');
    }
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      'borrador': 'bg-gray-100 text-gray-800',
      'enviada': 'bg-blue-100 text-blue-800',
      'revisada': 'bg-green-100 text-green-800'
    };
    return badges[estado] || 'bg-gray-100 text-gray-800';
  };

  const getPrioridadColor = (count) => {
    if (count === 0) return 'text-green-600';
    if (count <= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const resumen = useMemo(() => {
    const total = formularios.length
    const enviadas = formularios.filter(f => f.estado === 'enviada').length
    const revisadas = formularios.filter(f => f.estado === 'revisada').length
    const conPDF = formularios.filter(f => f.pdf?.existe).length
    const sinPDF = total - conPDF
    return { total, enviadas, revisadas, conPDF, sinPDF }
  }, [formularios])

  return (
    <DashboardLayout title="Formularios de Posventa" subtitle="Gestiona los formularios enviados por beneficiarios" accent="blue">
      <div className="space-y-6">
        <SectionPanel title="Búsqueda y filtros" description="Encuentra rápidamente los formularios que necesitas revisar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <form onSubmit={handleSearch} className="lg:col-span-2">
              <div className="flex w-full">
                <input
                  type="text"
                  placeholder="Buscar por beneficiario, email o dirección..."
                  value={filtros.search}
                  onChange={(e) => setFiltros(prev => ({ ...prev, search: e.target.value }))}
                  className="input flex-1 rounded-r-none"
                />
                <button type="submit" className="btn btn-primary rounded-l-none">Buscar</button>
              </div>
            </form>

            {/* Estado y PDF */}
            <div className="flex flex-col md:flex-row gap-3">
              <select
                value={filtros.estado}
                onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
                className="input"
              >
                <option value="">Todos los estados</option>
                <option value="enviada">Enviada</option>
                <option value="revisada">Revisada</option>
              </select>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFiltros(prev => ({ ...prev, con_pdf: !prev.con_pdf, sin_pdf: false }))}
                  className={`btn ${filtros.con_pdf ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                >
                  Con PDF
                </button>
                <button
                  type="button"
                  onClick={() => setFiltros(prev => ({ ...prev, sin_pdf: !prev.sin_pdf, con_pdf: false }))}
                  className={`btn ${filtros.sin_pdf ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                >
                  Sin PDF
                </button>
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className="rounded-lg border border-techo-gray-100 bg-white p-3">
              <div className="text-[11px] uppercase text-techo-gray-500">Total</div>
              <div className="text-xl font-semibold">{resumen.total}</div>
            </div>
            <div className="rounded-lg border border-techo-gray-100 bg-white p-3">
              <div className="text-[11px] uppercase text-techo-gray-500">Enviadas</div>
              <div className="text-xl font-semibold">{resumen.enviadas}</div>
            </div>
            <div className="rounded-lg border border-techo-gray-100 bg-white p-3">
              <div className="text-[11px] uppercase text-techo-gray-500">Revisadas</div>
              <div className="text-xl font-semibold">{resumen.revisadas}</div>
            </div>
            <div className="rounded-lg border border-techo-gray-100 bg-white p-3">
              <div className="text-[11px] uppercase text-techo-gray-500">Con PDF</div>
              <div className="text-xl font-semibold">{resumen.conPDF}</div>
            </div>
          </div>
        </SectionPanel>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        )}

        <div className="bg-white rounded-xl shadow-soft border border-techo-gray-100 overflow-hidden">
        {loading && formularios.length === 0 ? (
          <div className="p-8">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-12 bg-gray-100 rounded"></div>
              <div className="h-12 bg-gray-100 rounded"></div>
              <div className="h-12 bg-gray-100 rounded"></div>
            </div>
          </div>
        ) : formularios.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-2">🗂️</div>
            <p className="text-gray-600 mb-3">No se encontraron formularios</p>
            <button onClick={() => fetchFormularios(0)} className="btn btn-primary">Recargar</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Beneficiario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vivienda
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Problemas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PDF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Envío
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {formularios.map((form) => (
                  <tr key={form.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {form.beneficiario?.nombre || '—'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {form.beneficiario?.email || ''}
                        </div>
                        {form.beneficiario?.rut && (
                          <div className="text-xs text-gray-400">
                            RUT: {form.beneficiario.rut}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          ID: {form.vivienda?.id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {form.vivienda?.direccion}
                        </div>
                        <div className="text-xs text-gray-400">
                          Tipo: {form.vivienda?.tipo || 'N/A'} • {form.vivienda?.proyecto}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoBadge(form.estado)}`}>
                        {form.estado.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className={`font-medium ${getPrioridadColor(form.items_no_ok_count)}`}>
                          {form.items_no_ok_count} problemas
                        </div>
                        <div className="text-gray-500 text-xs">
                          {form.observaciones_count} observaciones
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {form.pdf?.existe ? (
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            ✅ Generado
                          </span>
                          <button
                            onClick={() => handleDescargarPDF(form.id)}
                            className="btn btn-ghost btn-sm text-blue-700"
                            title="Descargar PDF"
                          >
                            Descargar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleGenerarPDF(form.id)}
                          className="btn btn-primary btn-sm"
                        >
                          Generar PDF
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {form.fecha_enviada ? 
                        new Date(form.fecha_enviada).toLocaleString('es-CL') :
                        'No enviado'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link to={`/tecnico/posventa/formulario/${form.id}`} className="btn btn-ghost btn-sm text-blue-700">Ver</Link>
                      {form.estado === 'enviada' && (
                        <button
                          onClick={() => handleRevisarFormulario(form.id)}
                          className="btn btn-ghost btn-sm text-green-700"
                        >
                          Revisar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {meta.hasMore && (
          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={() => fetchFormularios(meta.offset + meta.limit)}
              disabled={loading}
              className="btn btn-ghost w-full disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Cargar más formularios'}
            </button>
          </div>
        )}
      </div>

      {/* cierre del contenedor principal */}
      </div>

      {/* Resumen final */}
      <div className="text-center text-sm text-techo-gray-500">Mostrando {formularios.length} de {meta.total} formularios</div>
    </DashboardLayout>
  );
}
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

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

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📋 Formularios de Posventa
        </h1>
        <p className="text-gray-600">
          Gestiona los formularios de posventa enviados por beneficiarios
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <form onSubmit={handleSearch} className="md:col-span-2">
            <div className="flex">
              <input
                type="text"
                placeholder="Buscar por beneficiario, email o dirección..."
                value={filtros.search}
                onChange={(e) => setFiltros(prev => ({ ...prev, search: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                🔍
              </button>
            </div>
          </form>

          {/* Estado */}
          <select
            value={filtros.estado}
            onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            <option value="enviada">Enviada</option>
            <option value="revisada">Revisada</option>
          </select>

          {/* Filtro PDF */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filtros.con_pdf}
                onChange={(e) => setFiltros(prev => ({ ...prev, con_pdf: e.target.checked, sin_pdf: false }))}
                className="mr-2"
              />
              Con PDF
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filtros.sin_pdf}
                onChange={(e) => setFiltros(prev => ({ ...prev, sin_pdf: e.target.checked, con_pdf: false }))}
                className="mr-2"
              />
              Sin PDF
            </label>
          </div>
        </div>
      </div>

      {/* Lista de formularios */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading && formularios.length === 0 ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando formularios...</p>
          </div>
        ) : formularios.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No se encontraron formularios</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
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
              <tbody className="bg-white divide-y divide-gray-200">
                {formularios.map((form) => (
                  <tr key={form.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {form.beneficiario.nombre}
                        </div>
                        <div className="text-sm text-gray-500">
                          {form.beneficiario.email}
                        </div>
                        {form.beneficiario.rut && (
                          <div className="text-xs text-gray-400">
                            RUT: {form.beneficiario.rut}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          ID: {form.vivienda.id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {form.vivienda.direccion}
                        </div>
                        <div className="text-xs text-gray-400">
                          Tipo: {form.vivienda.tipo || 'N/A'} • {form.vivienda.proyecto}
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
                      {form.pdf.existe ? (
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            ✅ Generado
                          </span>
                          <button
                            onClick={() => handleDescargarPDF(form.id)}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                            title="Descargar PDF"
                          >
                            📥
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleGenerarPDF(form.id)}
                          className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        >
                          📄 Generar
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
                      <Link
                        to={`/tecnico/posventa/formulario/${form.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        👁️ Ver
                      </Link>
                      {form.estado === 'enviada' && (
                        <button
                          onClick={() => handleRevisarFormulario(form.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          ✅ Revisar
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
              className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Cargar más formularios'}
            </button>
          </div>
        )}
      </div>

      {/* Resumen */}
      <div className="mt-6 text-sm text-gray-600 text-center">
        Mostrando {formularios.length} de {meta.total} formularios
      </div>
    </div>
  );
}
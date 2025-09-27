import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

export default function FormularioPosventa() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formulario, setFormulario] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFormulario();
  }, [id]);

  const fetchFormulario = async () => {
    try {
      const token = localStorage.getItem('token');
      
      console.log('🔍 Iniciando carga de formulario ID:', id);
      console.log('🎫 Token presente:', !!token);
      
      // Obtener datos del formulario
      const response = await fetch(`http://localhost:3001/api/tecnico/posventa/form/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response statusText:', response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response body:', errorText);
        throw new Error(`Error ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📊 Datos recibidos:', data);
      
      if (data.success) {
        setFormulario(data.data.formulario);
        setItems(data.data.items || []);
        console.log('✅ Formulario cargado exitosamente');
      } else {
        setError(data.message || 'Error al cargar formulario');
        console.error('❌ Error en respuesta del servidor:', data.message);
      }
    } catch (err) {
      console.error('❌ Error obteniendo formulario:', err);
      setError(`Error de conexión: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRevisarFormulario = async () => {
    const comentario = prompt('Comentario de revisión (opcional):');
    if (comentario === null) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/tecnico/posventa/form/${id}/revisar`, {
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
        setFormulario(prev => ({ 
          ...prev, 
          estado: 'revisada',
          fecha_revisada: new Date().toISOString() 
        }));
        alert('Formulario revisado exitosamente');
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (err) {
      console.error('Error revisando formulario:', err);
      alert('Error de conexión');
    }
  };

  const handleGenerarPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/posventa/form/${id}/generar-pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        if (data.data.pdf_url) {
          window.open(data.data.pdf_url, '_blank');
        }
        alert('PDF generado exitosamente');
      } else {
        alert(`Error generando PDF: ${data.message}`);
      }
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('Error de conexión al generar PDF');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar formulario</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/tecnico/posventa/formularios"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            ← Volver a formularios
          </Link>
        </div>
      </div>
    );
  }

  if (!formulario) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No se pudo cargar el formulario</h2>
          <Link
            to="/tecnico/posventa/formularios"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            ← Volver a formularios
          </Link>
        </div>
      </div>
    );
  }

  // Agrupar items por categoría
  const itemsPorCategoria = items.reduce((acc, item) => {
    if (!acc[item.categoria]) acc[item.categoria] = [];
    acc[item.categoria].push(item);
    return acc;
  }, {});

  const resumenItems = {
    total: items.length,
    correctos: items.filter(i => i.ok).length,
    conProblemas: items.filter(i => !i.ok).length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                to="/tecnico/posventa/formularios"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
              >
                ← Volver a formularios
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getEstadoBadge(formulario.estado)}`}>
                {formulario.estado.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Información del Formulario */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Formulario de Posventa #{formulario.id}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Creado el {new Date(formulario.fecha_creada).toLocaleDateString('es-CL')}
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">BENEFICIARIO</h3>
                <p className="text-lg font-semibold text-gray-900">{formulario.beneficiario?.nombre || 'No disponible'}</p>
                <p className="text-sm text-gray-600">{formulario.beneficiario?.email || ''}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">VIVIENDA</h3>
                <p className="text-lg font-semibold text-gray-900">{formulario.vivienda?.direccion || 'No disponible'}</p>
                <p className="text-sm text-gray-600">{formulario.vivienda?.tipo_vivienda || ''}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">PROYECTO</h3>
                <p className="text-lg font-semibold text-gray-900">{formulario.vivienda?.proyecto?.nombre || 'No disponible'}</p>
                <p className="text-sm text-gray-600">{formulario.vivienda?.proyecto?.ubicacion || ''}</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{resumenItems.total}</p>
                    <p className="text-xs text-gray-500">Total Items</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{resumenItems.correctos}</p>
                    <p className="text-xs text-gray-500">Correctos</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${getPrioridadColor(resumenItems.conProblemas)}`}>{resumenItems.conProblemas}</p>
                    <p className="text-xs text-gray-500">Con Problemas</p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  {formulario.estado === 'enviada' && (
                    <button
                      onClick={handleRevisarFormulario}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      ✓ Marcar como Revisada
                    </button>
                  )}
                  <button
                    onClick={handleGenerarPDF}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors text-sm font-medium"
                  >
                    📄 Generar PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items por Categoría */}
        <div className="space-y-6">
          {Object.entries(itemsPorCategoria).map(([categoria, categoriaItems]) => (
            <div key={categoria} className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">{categoria}</h2>
                <p className="text-sm text-gray-600">
                  {categoriaItems.length} items • {categoriaItems.filter(i => !i.ok).length} con problemas
                </p>
              </div>
              
              <div className="p-6">
                <div className="grid gap-4">
                  {categoriaItems.map((item) => (
                    <div
                      key={item.id}
                      className={`border rounded-lg p-4 ${
                        item.ok ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              item.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {item.ok ? '✓ CORRECTO' : '✗ PROBLEMA'}
                            </span>
                            <h3 className="text-sm font-medium text-gray-900">{item.item}</h3>
                          </div>
                          
                          {item.comentario && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-500">Comentario:</p>
                              <p className="text-sm text-gray-700 mt-1">{item.comentario}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right text-xs text-gray-500">
                          Orden: {item.orden}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Información adicional */}
        {formulario.fecha_revisada && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-2">Formulario Revisado</h3>
            <p className="text-sm text-green-700">
              Revisado el {new Date(formulario.fecha_revisada).toLocaleDateString('es-CL')} a las {new Date(formulario.fecha_revisada).toLocaleTimeString('es-CL')}
            </p>
            {formulario.comentario_tecnico && (
              <div className="mt-3">
                <p className="text-xs font-medium text-green-600">Comentario del técnico:</p>
                <p className="text-sm text-green-800 mt-1">{formulario.comentario_tecnico}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
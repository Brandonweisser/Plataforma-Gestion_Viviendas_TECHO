import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function DetalleFormularioPosventa() {
  const { id } = useParams();
  const [formulario, setFormulario] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [procesandoRevision, setProcesandoRevision] = useState(false);

  const fetchFormulario = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Obtener datos del formulario (usando endpoint de beneficiario temporalmente)
      const response = await fetch(`http://localhost:3001/api/beneficiario/posventa/form`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        setFormulario(data.data.form);
        setItems(data.data.items || []);
      } else {
        setError('No se pudo cargar el formulario');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormulario();
  }, [id]);

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
      
      if (data.success && data.data.pdf_url) {
        window.open(data.data.pdf_url, '_blank');
      } else {
        alert(`Error generando PDF: ${data.message}`);
      }
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('Error de conexión');
    }
  };

  const handleRevisarFormulario = async () => {
    const comentario = prompt('Comentario de revisión (opcional):');
    if (comentario === null) return;
    
    setProcesandoRevision(true);
    
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
        
        alert(data.data.mensaje || 'Formulario revisado exitosamente');
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (err) {
      console.error('Error revisando formulario:', err);
      alert('Error de conexión');
    } finally {
      setProcesandoRevision(false);
    }
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      'borrador': { bg: 'bg-gray-100', text: 'text-gray-800', emoji: '📝' },
      'enviada': { bg: 'bg-blue-100', text: 'text-blue-800', emoji: '📤' },
      'revisada': { bg: 'bg-green-100', text: 'text-green-800', emoji: '✅' }
    };
    const badge = badges[estado] || badges.borrador;
    return (
      <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${badge.bg} ${badge.text}`}>
        <span className="mr-1">{badge.emoji}</span>
        {estado.toUpperCase()}
      </span>
    );
  };

  const getSeveridadBadge = (severidad) => {
    if (!severidad) return null;
    
    const badges = {
      'menor': { bg: 'bg-yellow-100', text: 'text-yellow-800', emoji: '⚠️' },
      'media': { bg: 'bg-orange-100', text: 'text-orange-800', emoji: '🔶' },
      'mayor': { bg: 'bg-red-100', text: 'text-red-800', emoji: '🔴' }
    };
    
    const badge = badges[severidad] || badges.media;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${badge.bg} ${badge.text}`}>
        <span className="mr-1">{badge.emoji}</span>
        {severidad.toUpperCase()}
      </span>
    );
  };

  // Agrupar items por categoría
  const itemsPorCategoria = items.reduce((acc, item) => {
    if (!acc[item.categoria]) {
      acc[item.categoria] = [];
    }
    acc[item.categoria].push(item);
    return acc;
  }, {});

  const resumen = {
    total: items.length,
    correctos: items.filter(item => item.ok).length,
    conProblemas: items.filter(item => !item.ok).length
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <Link 
          to="/tecnico/posventa/formularios" 
          className="mt-4 inline-block text-blue-600 hover:text-blue-800"
        >
          ← Volver a formularios
        </Link>
      </div>
    );
  }

  if (!formulario) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-gray-500">Formulario no encontrado</p>
        <Link 
          to="/tecnico/posventa/formularios" 
          className="mt-4 inline-block text-blue-600 hover:text-blue-800"
        >
          ← Volver a formularios
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <Link 
          to="/tecnico/posventa/formularios" 
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Volver a formularios
        </Link>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📋 Formulario de Posventa #{formulario.id}
            </h1>
            <div className="flex items-center space-x-4">
              {getEstadoBadge(formulario.estado)}
              <span className="text-gray-600">
                Enviado: {new Date(formulario.fecha_enviada || formulario.fecha_creada).toLocaleString('es-CL')}
              </span>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleGenerarPDF}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              📄 Generar/Ver PDF
            </button>
            
            {formulario.estado === 'enviada' && (
              <button
                onClick={handleRevisarFormulario}
                disabled={procesandoRevision}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {procesandoRevision ? '🔄 Procesando...' : '✅ Revisar Formulario'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Resumen</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{resumen.total}</div>
            <div className="text-gray-600">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{resumen.correctos}</div>
            <div className="text-gray-600">Correctos</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{resumen.conProblemas}</div>
            <div className="text-gray-600">Con Problemas</div>
          </div>
        </div>
      </div>

      {/* Items por categoría */}
      <div className="space-y-6">
        {Object.entries(itemsPorCategoria).map(([categoria, itemsCategoria]) => (
          <div key={categoria} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                🔧 {categoria}
                <span className="ml-2 text-sm text-gray-500">
                  ({itemsCategoria.length} items)
                </span>
              </h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {itemsCategoria.map((item) => (
                  <div 
                    key={item.id} 
                    className={`border rounded-lg p-4 ${item.ok ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{item.item}</h4>
                      <div className="flex items-center space-x-2">
                        {item.ok ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            ✅ OK
                          </span>
                        ) : (
                          <>
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              ❌ Problema
                            </span>
                            {getSeveridadBadge(item.severidad)}
                          </>
                        )}
                      </div>
                    </div>
                    
                    {item.comentario && (
                      <div className="mt-2 p-3 bg-gray-100 rounded text-sm text-gray-700">
                        <strong>💬 Comentario:</strong> {item.comentario}
                      </div>
                    )}
                    
                    {item.fotos_json && Array.isArray(item.fotos_json) && item.fotos_json.length > 0 && (
                      <div className="mt-2">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          📸 Fotos adjuntas ({item.fotos_json.length})
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {item.fotos_json.map((foto, index) => (
                            <div key={index} className="bg-gray-200 rounded p-2 text-center text-xs text-gray-600">
                              📷 Foto {index + 1}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {!item.ok && item.crear_incidencia && (
                      <div className="mt-2 flex items-center text-sm text-purple-600">
                        {item.incidencia_id ? 
                          `Incidencia #${item.incidencia_id} creada` : 
                          'Se creará incidencia automáticamente'
                        }
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Información adicional */}
      {formulario.estado === 'revisada' && formulario.fecha_revisada && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-green-600 mr-2">✅</span>
            <span className="font-medium text-green-800">
              Formulario revisado el {new Date(formulario.fecha_revisada).toLocaleString('es-CL')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
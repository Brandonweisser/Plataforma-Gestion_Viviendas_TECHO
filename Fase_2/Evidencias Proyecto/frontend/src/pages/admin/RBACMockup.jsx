import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/ui/DashboardLayout';
import { ShieldCheckIcon, UserGroupIcon, KeyIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

/**
 * MOCKUP - Sistema de Permisos Granulares (RBAC)
 * Vista de demostración sin funcionalidad real
 * Solo para presentar concepto al cliente
 */

const RBACMockup = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('administrador');

  // Permisos disponibles en el sistema (DEMO)
  const permissionsGroups = {
    usuarios: {
      name: 'Gestión de Usuarios',
      icon: UserGroupIcon,
      permissions: [
        { id: 'usuarios.ver', name: 'Ver usuarios', description: 'Listar todos los usuarios del sistema' },
        { id: 'usuarios.crear', name: 'Crear usuarios', description: 'Registrar nuevos usuarios' },
        { id: 'usuarios.editar', name: 'Editar usuarios', description: 'Modificar datos de usuarios existentes' },
        { id: 'usuarios.eliminar', name: 'Eliminar usuarios', description: 'Desactivar o eliminar usuarios' },
        { id: 'usuarios.cambiar_rol', name: 'Cambiar roles', description: 'Modificar el rol de otros usuarios' },
      ]
    },
    proyectos: {
      name: 'Gestión de Proyectos',
      icon: ShieldCheckIcon,
      permissions: [
        { id: 'proyectos.ver', name: 'Ver proyectos', description: 'Listar proyectos' },
        { id: 'proyectos.crear', name: 'Crear proyectos', description: 'Registrar nuevos proyectos' },
        { id: 'proyectos.editar', name: 'Editar proyectos', description: 'Modificar proyectos existentes' },
        { id: 'proyectos.eliminar', name: 'Eliminar proyectos', description: 'Eliminar proyectos' },
        { id: 'proyectos.asignar_tecnicos', name: 'Asignar técnicos', description: 'Asignar técnicos a proyectos' },
      ]
    },
    viviendas: {
      name: 'Gestión de Viviendas',
      icon: ShieldCheckIcon,
      permissions: [
        { id: 'viviendas.ver', name: 'Ver viviendas', description: 'Listar viviendas' },
        { id: 'viviendas.crear', name: 'Crear viviendas', description: 'Registrar nuevas viviendas' },
        { id: 'viviendas.editar', name: 'Editar viviendas', description: 'Modificar viviendas existentes' },
        { id: 'viviendas.eliminar', name: 'Eliminar viviendas', description: 'Eliminar viviendas' },
        { id: 'viviendas.asignar', name: 'Asignar beneficiarios', description: 'Asignar viviendas a beneficiarios' },
      ]
    },
    incidencias: {
      name: 'Gestión de Incidencias',
      icon: ShieldCheckIcon,
      permissions: [
        { id: 'incidencias.ver_todas', name: 'Ver todas las incidencias', description: 'Ver incidencias de todos los proyectos' },
        { id: 'incidencias.ver_asignadas', name: 'Ver solo asignadas', description: 'Ver solo incidencias propias' },
        { id: 'incidencias.asignar', name: 'Asignar incidencias', description: 'Asignar incidencias a técnicos' },
        { id: 'incidencias.cambiar_estado', name: 'Cambiar estado', description: 'Modificar estado de incidencias' },
        { id: 'incidencias.eliminar', name: 'Eliminar incidencias', description: 'Eliminar incidencias' },
      ]
    },
    seguridad: {
      name: 'Seguridad y Auditoría',
      icon: KeyIcon,
      permissions: [
        { id: 'seguridad.ver_logs', name: 'Ver logs', description: 'Acceder a registros de auditoría' },
        { id: 'seguridad.gestionar_sesiones', name: 'Gestionar sesiones', description: 'Cerrar sesiones activas' },
        { id: 'seguridad.exportar_reportes', name: 'Exportar reportes', description: 'Descargar reportes de seguridad' },
      ]
    }
  };

  // Roles predefinidos con permisos (DEMO)
  const rolesConfig = {
    administrador: {
      name: 'Administrador General',
      description: 'Acceso completo al sistema',
      permissions: Object.values(permissionsGroups).flatMap(g => g.permissions.map(p => p.id))
    },
    administrador_proyectos: {
      name: 'Administrador de Proyectos',
      description: 'Gestión de proyectos y viviendas',
      permissions: [
        'proyectos.ver', 'proyectos.crear', 'proyectos.editar', 'proyectos.asignar_tecnicos',
        'viviendas.ver', 'viviendas.crear', 'viviendas.editar', 'viviendas.asignar',
        'incidencias.ver_todas'
      ]
    },
    administrador_usuarios: {
      name: 'Administrador de Usuarios',
      description: 'Solo gestión de usuarios',
      permissions: [
        'usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.cambiar_rol',
        'seguridad.ver_logs'
      ]
    },
    tecnico_supervisor: {
      name: 'Técnico Supervisor',
      description: 'Supervisa técnicos y asigna incidencias',
      permissions: [
        'proyectos.ver', 'viviendas.ver',
        'incidencias.ver_todas', 'incidencias.asignar', 'incidencias.cambiar_estado'
      ]
    },
    tecnico: {
      name: 'Técnico de Campo',
      description: 'Gestiona solo incidencias asignadas',
      permissions: [
        'proyectos.ver', 'viviendas.ver',
        'incidencias.ver_asignadas', 'incidencias.cambiar_estado'
      ]
    },
    beneficiario: {
      name: 'Beneficiario',
      description: 'Solo ve su vivienda e incidencias propias',
      permissions: []
    }
  };

  const hasPermission = (permissionId) => {
    return rolesConfig[selectedRole]?.permissions.includes(permissionId);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/home')}
              className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Volver al Inicio
            </button>

            <h1 className="text-3xl font-bold text-gray-900">Sistema de Permisos Granulares (RBAC)</h1>
            <p className="text-gray-600 mt-2">Control de acceso basado en roles - Vista de demostración</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Selector de roles */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <UserGroupIcon className="h-5 w-5 text-blue-600" />
                  Seleccionar Rol
                </h2>
                
                <div className="space-y-2">
                  {Object.entries(rolesConfig).map(([roleKey, roleData]) => (
                    <button
                      key={roleKey}
                      onClick={() => setSelectedRole(roleKey)}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                        selectedRole === roleKey
                          ? 'border-blue-600 bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{roleData.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{roleData.description}</div>
                      <div className="text-xs text-blue-600 mt-2">
                        {rolesConfig[roleKey].permissions.length} permisos
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    <strong>Rol seleccionado:</strong>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-900">{rolesConfig[selectedRole].name}</div>
                      <div className="text-xs text-gray-500 mt-1">{rolesConfig[selectedRole].description}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de permisos */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {Object.entries(permissionsGroups).map(([groupKey, group]) => {
                  const Icon = group.icon;
                  return (
                    <div key={groupKey} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Icon className="h-5 w-5 text-gray-600" />
                        {group.name}
                      </h3>
                      
                      <div className="space-y-3">
                        {group.permissions.map((permission) => {
                          const enabled = hasPermission(permission.id);
                          return (
                            <div
                              key={permission.id}
                              className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                                enabled 
                                  ? 'border-green-200 bg-green-50' 
                                  : 'border-gray-200 bg-gray-50 opacity-50'
                              }`}
                            >
                              <div className="flex-shrink-0 mt-1">
                                {enabled ? (
                                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                ) : (
                                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{permission.name}</div>
                                <div className="text-sm text-gray-600 mt-1">{permission.description}</div>
                                <div className="text-xs text-gray-500 mt-2 font-mono">{permission.id}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Resumen */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mt-6 rounded-r-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Resumen de Permisos</h3>
                <p className="text-sm text-blue-800">
                  El rol <strong>{rolesConfig[selectedRole].name}</strong> tiene <strong>{rolesConfig[selectedRole].permissions.length}</strong> permisos activos
                  de un total de {Object.values(permissionsGroups).reduce((sum, g) => sum + g.permissions.length, 0)} permisos disponibles en el sistema.
                </p>
              </div>
            </div>
          </div>

          {/* Footer informativo */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Ventajas del Sistema RBAC:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Control Granular</div>
                  <div className="text-sm text-gray-600">Permisos específicos por función</div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Roles Personalizables</div>
                  <div className="text-sm text-gray-600">Crea roles según necesidades</div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Seguridad Mejorada</div>
                  <div className="text-sm text-gray-600">Principio de mínimo privilegio</div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Auditoría Detallada</div>
                  <div className="text-sm text-gray-600">Registro de cambios de permisos</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RBACMockup;

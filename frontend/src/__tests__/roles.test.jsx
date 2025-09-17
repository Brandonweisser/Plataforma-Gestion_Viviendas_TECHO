import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ProtectedRoute, RoleRoute } from '../components/ProtectedRoute';
import AdminDashboard from '../pages/admin/Dashboard';
import BeneficiarioDashboard from '../pages/beneficiario/Dashboard';
import Unauthorized from '../pages/Unauthorized';

function renderWithAuth(ui, { route = '/admin', auth } = {}) {
  window.history.pushState({}, 'Test', route);
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[route]}>
        {ui}
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('Role based routing', () => {
  const baseAuth = {
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
    user: { email: 'test@example.com' }
  };

  test('Administrador accede a /admin', () => {
    renderWithAuth(
      <Routes>
        <Route element={<ProtectedRoute />}> 
          <Route element={<RoleRoute allowed={['administrador']} />}> 
            <Route path='/admin' element={<AdminDashboard />} />
          </Route>
        </Route>
      </Routes>,
      { route: '/admin', auth: { ...baseAuth, role: 'administrador' } }
    );
    expect(screen.getByText(/Panel Administrador/i)).toBeInTheDocument();
  });

  test('Técnico bloqueado en /admin', () => {
    renderWithAuth(
      <Routes>
        <Route path='/unauthorized' element={<Unauthorized />} />
        <Route element={<ProtectedRoute />}> 
          <Route element={<RoleRoute allowed={['administrador']} />}> 
            <Route path='/admin' element={<AdminDashboard />} />
          </Route>
        </Route>
      </Routes>,
      { route: '/admin', auth: { ...baseAuth, role: 'tecnico' } }
    );
    expect(screen.getByText(/Acceso no autorizado/i)).toBeInTheDocument();
  });

  test('Beneficiario accede a /beneficiario', () => {
    renderWithAuth(
      <Routes>
        <Route element={<ProtectedRoute />}> 
          <Route element={<RoleRoute allowed={['beneficiario']} />}> 
            <Route path='/beneficiario' element={<BeneficiarioDashboard />} />
          </Route>
        </Route>
      </Routes>,
      { route: '/beneficiario', auth: { ...baseAuth, role: 'beneficiario' } }
    );
    expect(screen.getByText(/Panel Beneficiario/i)).toBeInTheDocument();
  });

  test('Acceso no autenticado redirige', () => {
    renderWithAuth(
      <Routes>
        <Route path='/' element={<div>Login Page</div>} />
        <Route element={<ProtectedRoute />}> 
          <Route element={<RoleRoute allowed={['administrador']} />}> 
            <Route path='/admin' element={<AdminDashboard />} />
          </Route>
        </Route>
      </Routes>,
      { route: '/admin', auth: { ...baseAuth, isAuthenticated: false, role: null } }
    );
    expect(screen.getByText(/Login Page/i)).toBeInTheDocument();
  });

  test('Rol normalizado (admin -> administrador)', () => {
    renderWithAuth(
      <Routes>
        <Route element={<ProtectedRoute />}> 
          <Route element={<RoleRoute allowed={['administrador']} />}> 
            <Route path='/admin' element={<AdminDashboard />} />
          </Route>
        </Route>
      </Routes>,
      { route: '/admin', auth: { ...baseAuth, role: 'admin' } }
    );
    expect(screen.getByText(/Panel Administrador/i)).toBeInTheDocument();
  });
});

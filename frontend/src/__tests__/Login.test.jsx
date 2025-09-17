import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Login from '../pages/Login.jsx';
import { AuthContext } from '../context/AuthContext.jsx';
import { login as loginApi, getMe } from '../services/api';

jest.mock('../services/api', () => ({
  login: jest.fn(),
  getMe: jest.fn(),
}));

function renderWithContext(ui) {
  const login = jest.fn();
  return {
    login,
    ...render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user: null, login, logout: jest.fn(), isAuthenticated: false }}>
          {ui}
        </AuthContext.Provider>
      </MemoryRouter>
    ),
  };
}

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('muestra error si email vacío', async () => {
    const { login } = renderWithContext(<Login />);
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    expect(await screen.findByText(/correo es obligatorio/i)).toBeInTheDocument();
    expect(loginApi).not.toHaveBeenCalled();
    expect(login).not.toHaveBeenCalled();
  });

  test('muestra error si formato email inválido', async () => {
    renderWithContext(<Login />);
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'bademail' }});
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: '123456' }});
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    expect(await screen.findByText(/correo no es válido/i)).toBeInTheDocument();
    expect(loginApi).not.toHaveBeenCalled();
  });

  test('muestra error credenciales incorrectas (401)', async () => {
    loginApi.mockRejectedValueOnce(Object.assign(new Error('Correo o contraseña incorrectos'), { status: 401 }));
    renderWithContext(<Login />);
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'user@test.com' }});
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: '123456' }});
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    expect(await screen.findByText(/correo o contraseña incorrectos/i)).toBeInTheDocument();
  });

  test('login exitoso guarda token y llama login context', async () => {
    loginApi.mockResolvedValueOnce({ token: 'fake.jwt.token' });
    getMe.mockResolvedValueOnce({ success: true, data: { rol: 'beneficiario', nombre: 'Juan' } });
    const { login } = renderWithContext(<Login />);
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'user@test.com' }});
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: '123456' }});
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => expect(loginApi).toHaveBeenCalled());
    expect(localStorage.getItem('token')).toBe('fake.jwt.token');
    expect(login).toHaveBeenCalled();
  });
});

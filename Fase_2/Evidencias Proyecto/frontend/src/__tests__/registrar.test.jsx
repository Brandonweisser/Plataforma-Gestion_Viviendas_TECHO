import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Registro from '../pages/registrar.jsx';
import { AuthContext } from '../context/AuthContext.jsx';
import { registerUser, getMe } from '../services/api';

jest.mock('../services/api', () => ({
  registerUser: jest.fn(),
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

describe('Registro Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('error si campos vacíos', async () => {
    renderWithContext(<Registro />);
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));
    expect(await screen.findByText(/el nombre es obligatorio/i)).toBeInTheDocument();
    expect(registerUser).not.toHaveBeenCalled();
  });

  test('error si email inválido', async () => {
    renderWithContext(<Registro />);
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Juan' }});
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'bad' }});
    fireEvent.change(screen.getByLabelText(/^contraseña$/i), { target: { value: '123456' }});
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), { target: { value: '123456' }});
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));
    expect(await screen.findByText(/correo no es válido/i)).toBeInTheDocument();
  });

  test('error contraseñas distintas', async () => {
    renderWithContext(<Registro />);
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Juan' }});
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'juan@test.com' }});
    fireEvent.change(screen.getByLabelText(/^contraseña$/i), { target: { value: '123456' }});
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), { target: { value: '654321' }});
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));
    expect(await screen.findByText(/no coinciden/i)).toBeInTheDocument();
  });

  test('error email duplicado (409)', async () => {
    registerUser.mockRejectedValueOnce(Object.assign(new Error('El correo ya está registrado'), { status: 409 }));
    renderWithContext(<Registro />);
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Juan' }});
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'juan@test.com' }});
    fireEvent.change(screen.getByLabelText(/^contraseña$/i), { target: { value: '123456' }});
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), { target: { value: '123456' }});
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));
    expect(await screen.findByText(/ya está registrado/i)).toBeInTheDocument();
  });

  test('registro exitoso guarda token y llama login context', async () => {
    registerUser.mockResolvedValueOnce({ token: 'fake.jwt.token' });
    getMe.mockResolvedValueOnce({ success: true, data: { rol: 'beneficiario', nombre: 'Juan' } });
    const { login } = renderWithContext(<Registro />);
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Juan' }});
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'juan@test.com' }});
    fireEvent.change(screen.getByLabelText(/^contraseña$/i), { target: { value: '123456' }});
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), { target: { value: '123456' }});
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));

    await waitFor(() => expect(registerUser).toHaveBeenCalled());
    expect(localStorage.getItem('token')).toBe('fake.jwt.token');
    expect(login).toHaveBeenCalled();
  });
});

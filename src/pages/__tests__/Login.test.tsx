import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Login } from '../Login';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

// Hoisting dos mocks
const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  signIn: vi.fn(),
}));

// Mock do useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

describe('Login Page (Admin/Staff)', () => {
  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider
          value={{
            signIn: mocks.signIn,
            isAuthenticating: false,
            // Valores dummy para satisfazer o tipo
            user: null, session: null, profile: null, clinics: [],
            currentClinicId: null, loading: false, signUp: vi.fn(),
            signInWithPassword: vi.fn(), signOut: vi.fn(), setCurrentClinic: vi.fn()
          } as any}
        >
          <Login />
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o formulário de login corretamente', () => {
    renderLogin();
    expect(screen.getByText('Acesso VetHub')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument();
  });

  it('deve chamar a função signIn com email e senha', async () => {
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'admin@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: '123456' } });
    
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(mocks.signIn).toHaveBeenCalledWith('admin@test.com', '123456');
    });
  });

  it('deve exibir mensagem de erro se o login falhar', async () => {
    // Configura erro
    mocks.signIn.mockRejectedValueOnce(new Error('Credenciais inválidas'));
    renderLogin();

    // IMPORTANTE: Preencher campos para disparar o submit
    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'admin@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrongpass' } });

    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    const errorMessage = await screen.findByText('Credenciais inválidas');
    expect(errorMessage).toBeInTheDocument();
  });

  it('deve navegar para dashboard após sucesso', async () => {
    // Configura sucesso
    mocks.signIn.mockResolvedValueOnce(undefined);
    renderLogin();

    // IMPORTANTE: Preencher campos para disparar o submit
    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'admin@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: '123456' } });

    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith('/clinic/dashboard');
    });
  });
});
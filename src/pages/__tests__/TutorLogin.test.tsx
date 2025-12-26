import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TutorLogin } from '../TutorLogin';
import { BrowserRouter } from 'react-router-dom';

// Hoisting para garantir disponibilidade dos mocks
const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  supabaseSignIn: vi.fn(),
}));

// Mock do React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mocks.navigate };
});

// Mock do Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: mocks.supabaseSignIn,
    }
  }
}));

describe('TutorLogin Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve redirecionar para /tutor após login com sucesso', async () => {
    mocks.supabaseSignIn.mockResolvedValue({ 
      data: { user: { id: '123' } }, 
      error: null 
    });

    render(
      <BrowserRouter>
        <TutorLogin />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'tutor@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith('/tutor');
    });
  });

  it('deve exibir mensagem de erro genérica em caso de falha', async () => {
    // Configura o mock para retornar um erro
    mocks.supabaseSignIn.mockResolvedValue({ 
      data: null, 
      error: { message: 'Erro Supabase' } 
    });

    render(
      <BrowserRouter>
        <TutorLogin />
      </BrowserRouter>
    );

    // IMPORTANTE: Preencher os campos obrigatórios para permitir o submit
    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'erro@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: '123456' } });
    
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    // Aguarda a mensagem aparecer na tela
    const errorMessage = await screen.findByText('Erro Supabase');
    expect(errorMessage).toBeInTheDocument();
  });
});
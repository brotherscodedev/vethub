import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ReceptionistLogin } from '../ReceptionistLogin';
import { BrowserRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
const mockSupabaseSignIn = vi.fn();
const mockSupabaseSelect = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock do Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: any) => mockSupabaseSignIn(...args),
      signOut: vi.fn(),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: mockSupabaseSelect
        })
      })
    })
  }
}));

describe('ReceptionistLogin Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve redirecionar para /reception-portal se for recepcionista', async () => {
    mockSupabaseSignIn.mockResolvedValue({
      data: { user: { id: 'rec-123' } },
      error: null
    });
    
    mockSupabaseSelect.mockResolvedValue({
      data: { id: 'rec-profile-1', name: 'Maria' },
      error: null
    });

    render(
      <BrowserRouter>
        <ReceptionistLogin />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'rec@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/reception-portal');
    });
  });

  it('deve bloquear acesso se não encontrar registro na tabela receptionists', async () => {
    mockSupabaseSignIn.mockResolvedValue({
      data: { user: { id: 'fake-rec' } },
      error: null
    });
    
    mockSupabaseSelect.mockResolvedValue({
      data: null,
      error: null
    });

    render(<BrowserRouter><ReceptionistLogin /></BrowserRouter>);
    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'rec@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText('Usuário não é um recepcionista')).toBeInTheDocument();
    });
  });
});
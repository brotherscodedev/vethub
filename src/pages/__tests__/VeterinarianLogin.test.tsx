import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import VeterinarianLogin from '../VeterinarianLogin';
import { BrowserRouter } from 'react-router-dom';

// Mocks
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
          single: mockSupabaseSelect
        })
      })
    })
  }
}));

describe('VeterinarianLogin Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve realizar login e redirecionar para o portal veterinário se ativo', async () => {
    mockSupabaseSignIn.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    });

    mockSupabaseSelect.mockResolvedValue({
      data: { is_active: true },
      error: null
    });

    render(
      <BrowserRouter>
        <VeterinarianLogin />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'vet@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/veterinarian-portal');
    });
  });

  it('deve exibir erro se o usuário não for veterinário', async () => {
    mockSupabaseSignIn.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    // Mock veterinário não encontrado
    mockSupabaseSelect.mockResolvedValue({ data: null, error: null });

    render(<BrowserRouter><VeterinarianLogin /></BrowserRouter>);
    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'vet@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText('Usuário não é um veterinário')).toBeInTheDocument();
    });
  });
});
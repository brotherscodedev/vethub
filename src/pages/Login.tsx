import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PublicLayout } from '../components/layouts/PublicLayout';
import { Activity } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const { signIn, isAuthenticating } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('Login - isAuthenticating changed:', isAuthenticating);
  }, [isAuthenticating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    console.log('Login form submitted', { email, isAuthenticating });

    try {
      await signIn(email, password);
      console.log('Login successful, navigating to dashboard');
      navigate('/clinic/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Erro ao fazer login');
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex justify-center mb-8">
              <div className="flex items-center gap-2">
                <Activity className="w-8 h-8 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">VetHub</span>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">Login</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {isAuthenticating ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <p className="mt-6 text-center text-gray-600">
              Não tem conta?{' '}
              <button
                onClick={() => navigate('/auth/signup')}
                className="text-blue-600 font-semibold hover:underline"
              >
                Criar agora
              </button>
            </p>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600 mb-3">Acesso para profissionais e tutores</p>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/veterinarian-login')}
                  className="w-full py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition text-sm font-medium"
                >
                  Sou Veterinário
                </button>
                <button
                  onClick={() => navigate('/tutor/login')}
                  className="w-full py-2 text-pink-600 border border-pink-600 rounded-lg hover:bg-pink-50 transition text-sm font-medium"
                >
                  Sou Tutor
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Stethoscope, Mail, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PublicLayout } from '../components/layouts/PublicLayout';

export default function VeterinarianLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Erro ao fazer login');
      }

      const { data: veterinarian, error: vetError } = await supabase
        .from('veterinarians')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (vetError || !veterinarian) {
        await supabase.auth.signOut();
        throw new Error('Usuário não é um veterinário');
      }

      if (!veterinarian.is_active) {
        await supabase.auth.signOut();
        throw new Error('Conta de veterinário inativa');
      }

      navigate('/veterinarian-portal');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
      setIsLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                <Stethoscope className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Portal do Veterinário</h2>
              <p className="text-gray-600 mt-2">Acesse sua área profissional</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Seu CPF (senha inicial)"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Senha inicial: seu CPF (pode ser alterada após o login)
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <Link
                to="/tutor/login"
                className="block text-sm text-pink-600 hover:text-pink-700"
              >
                Sou Tutor
              </Link>
              <Link
                to="/auth/login"
                className="block text-sm text-gray-600 hover:text-gray-700"
              >
                Acessar como Staff da Clínica
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

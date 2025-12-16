import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicLayout } from '../components/layouts/PublicLayout';
import { Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function TutorLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      navigate('/tutor');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-4 rounded-2xl">
                <Heart className="w-10 h-10 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">
              Portal do Tutor
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Acesse as informações dos seus pets
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
                  placeholder="Digite seu CPF"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Sua senha inicial é o seu CPF (sem pontos ou traços)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 transition transform hover:scale-105 active:scale-95"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Não tem acesso ainda?
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Peça para sua clínica veterinária criar seu acesso
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

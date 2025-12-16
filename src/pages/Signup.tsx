import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PublicLayout } from '../components/layouts/PublicLayout';
import { Activity } from 'lucide-react';

export function Signup() {
  const navigate = useNavigate();
  const { signUp, isAuthenticating } = useAuth();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  const [clinicData, setClinicData] = useState({
    name: '',
    cnpj: '',
    phone: '',
    city: '',
  });

  const [profileData, setProfileData] = useState({
    full_name: '',
    cpf: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });

  const handleSignUp = async () => {
    setError('');

    if (!clinicData.name || !clinicData.cnpj) {
      setError('Dados da clínica incompletos');
      return;
    }

    if (!profileData.full_name || !profileData.email || !profileData.password) {
      setError('Dados do usuário incompletos');
      return;
    }

    if (profileData.password !== profileData.passwordConfirm) {
      setError('As senhas não conferem');
      return;
    }

    try {
      await signUp(profileData.email, profileData.password, clinicData, {
        full_name: profileData.full_name,
        cpf: profileData.cpf,
      });
      navigate('/clinic/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta');
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

            <h2 className="text-2xl font-bold text-center mb-2 text-gray-900">
              Criar sua clínica
            </h2>
            <p className="text-center text-gray-600 text-sm mb-6">Passo {step} de 2</p>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>
            )}

            {step === 1 ? (
              <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Clínica
                  </label>
                  <input
                    type="text"
                    value={clinicData.name}
                    onChange={(e) => setClinicData({ ...clinicData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={clinicData.cnpj}
                    onChange={(e) => setClinicData({ ...clinicData, cnpj: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Próximo
                </button>
              </form>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleSignUp(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seu Nome Completo
                  </label>
                  <input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                  <input
                    type="password"
                    value={profileData.password}
                    onChange={(e) => setProfileData({ ...profileData, password: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirme a Senha
                  </label>
                  <input
                    type="password"
                    value={profileData.passwordConfirm}
                    onChange={(e) => setProfileData({ ...profileData, passwordConfirm: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {isAuthenticating ? 'Criando...' : 'Criar Conta'}
                  </button>
                </div>
              </form>
            )}

            <p className="mt-6 text-center text-gray-600">
              Já tem conta?{' '}
              <button
                onClick={() => navigate('/auth/login')}
                className="text-blue-600 font-semibold hover:underline"
              >
                Fazer login
              </button>
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

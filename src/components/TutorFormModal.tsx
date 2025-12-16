import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Tutor } from '../types';

interface TutorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tutor?: Tutor;
}

export function TutorFormModal({ isOpen, onClose, onSuccess, tutor }: TutorFormModalProps) {
  const { currentClinicId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [createAccess, setCreateAccess] = useState(false);
  const [password, setPassword] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
  });

  useEffect(() => {
    if (tutor) {
      setFormData({
        name: tutor.name || '',
        cpf: tutor.cpf || '',
        email: tutor.email || '',
        phone: tutor.phone || '',
        address: tutor.address || '',
        city: tutor.city || '',
        state: tutor.state || '',
        zip_code: tutor.zip_code || '',
      });
    }
  }, [tutor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('TutorFormModal - handleSubmit called');
    console.log('TutorFormModal - currentClinicId:', currentClinicId);
    console.log('TutorFormModal - formData:', formData);

    if (!currentClinicId) {
      console.error('TutorFormModal - No clinic ID');
      alert('Erro: Nenhuma clínica selecionada. Por favor, recarregue a página.');
      return;
    }

    setLoading(true);
    console.log('TutorFormModal - Loading set to true');

    try {
      let tutorId = tutor?.id;

      if (tutor) {
        console.log('TutorFormModal - Updating tutor:', tutor.id);
        const { data, error } = await supabase.from('tutors').update(formData).eq('id', tutor.id);
        console.log('TutorFormModal - Update result:', { data, error });
        if (error) throw error;
      } else {
        const payload = { ...formData, clinic_id: currentClinicId };
        console.log('TutorFormModal - Inserting tutor with payload:', payload);
        const { data, error } = await supabase.from('tutors').insert(payload).select().single();
        console.log('TutorFormModal - Insert result:', { data, error });
        if (error) throw error;
        tutorId = data.id;
      }

      if (createAccess && formData.email && password && tutorId) {
        console.log('TutorFormModal - Creating portal access for tutor');
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-tutor-account`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email: formData.email,
            password: password,
            tutorId: tutorId,
          }),
        });

        const result = await response.json();
        console.log('TutorFormModal - Create account result:', result);

        if (!result.success) {
          throw new Error(result.error || 'Erro ao criar acesso ao portal');
        }
      }

      console.log('TutorFormModal - Success!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('TutorFormModal - Error saving tutor:', error);
      console.error('TutorFormModal - Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      alert(`Erro ao salvar tutor: ${error.message || 'Erro desconhecido'}\n\nDetalhes: ${error.details || error.hint || ''}`);
    } finally {
      setLoading(false);
      console.log('TutorFormModal - Loading set to false');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {tutor ? 'Editar Tutor' : 'Novo Tutor'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
              <input
                type="text"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {!tutor && formData.email && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="createAccess"
                  checked={createAccess}
                  onChange={(e) => setCreateAccess(e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="createAccess" className="text-sm text-gray-700 cursor-pointer">
                  <span className="font-medium">Criar acesso ao Portal do Tutor</span>
                  <p className="text-xs text-gray-600 mt-1">
                    O tutor poderá acessar informações dos seus pets pelo aplicativo
                  </p>
                </label>
              </div>

              {createAccess && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha inicial *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={createAccess}
                    placeholder="Senha para o tutor acessar o portal"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Esta senha será usada para o primeiro acesso do tutor
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={2}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

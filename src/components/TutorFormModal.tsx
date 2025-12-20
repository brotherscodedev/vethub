import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Tutor } from '../types';
import { maskCPF, maskPhone, validateEmail } from '../utils/validationsMasks';
import { BRAZILIAN_STATES } from '../types/brazilian-states';

interface TutorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tutor?: Tutor;
}

export function TutorFormModal({
  isOpen,
  onClose,
  onSuccess,
  tutor,
}: TutorFormModalProps) {
  const { currentClinicId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [createAccess, setCreateAccess] = useState(() =>
    tutor ? false : true
  );
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    email: '',
    phone: '',
    address: '',
    number: '',
    city: '',
    state: '',
    zip_code: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (tutor) {
      setFormData({
        name: tutor.name || '',
        cpf: tutor.cpf || '',
        email: tutor.email || '',
        phone: tutor.phone || '',
        address: tutor.address || '',
        number: tutor.number || '',
        city: tutor.city || '',
        state: tutor.state || '',
        zip_code: tutor.zip_code || '',
      });
      setCreateAccess(false);
    } else {
      setCreateAccess(true);
    }
  }, [tutor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    if (!currentClinicId) {
      console.error('TutorFormModal - No clinic ID');
      alert(
        'Erro: Nenhuma clínica selecionada. Por favor, recarregue a página.'
      );
      return;
    }

    setLoading(true);

    try {
      let tutorId = tutor?.id;

      if (tutor) {
        const { error } = await supabase
          .from('tutors')
          .update(formData)
          .eq('id', tutor.id);
        if (error) throw error;
      } else {
        const payload = {
          ...formData,
          clinic_id: currentClinicId,
          cpf: formData.cpf.replace(/\D/g, ''),
          phone: formData.phone.replace(/\D/g, ''),
        };
        const { data, error } = await supabase
          .from('tutors')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        tutorId = data.id;
      }

      if (createAccess && formData.email && formData.cpf && tutorId) {
        const apiUrl = `${
          import.meta.env.VITE_SUPABASE_URL
        }/functions/v1/create-tutor-account`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.cpf,
            tutorId: tutorId,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Erro ao criar acesso ao portal');
        }
      }

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
      alert(
        `Erro ao salvar tutor: ${
          error.message || 'Erro desconhecido'
        }\n\nDetalhes: ${error.details || error.hint || ''}`
      );
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'O nome é obrigatório';
    if (!formData.cpf || formData.cpf.length < 14)
      newErrors.cpf = 'CPF inválido';
    if (formData.email && validateEmail(formData.email))
      newErrors.email = 'E-mail inválido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {tutor ? 'Editar Tutor' : 'Novo Tutor'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              required
              maxLength={100}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-colors ${
                errors.name
                  ? 'border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {errors.name && (
              <span className="text-red-500 text-xs mt-1 font-medium">
                {errors.name}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPF *
              </label>
              <input
                type="text"
                value={maskCPF(formData.cpf)}
                onChange={(e) => {
                  setFormData({ ...formData, cpf: maskCPF(e.target.value) });
                  if (errors.cpf) setErrors({ ...errors, cpf: '' });
                }}
                placeholder="000.000.000-00"
                maxLength={14}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-colors ${
                  errors.cpf
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.cpf && (
                <span className="text-red-500 text-xs mt-1 font-medium">
                  {errors.cpf}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="tel"
                value={maskPhone(formData.phone)}
                onChange={(e) =>
                  setFormData({ ...formData, phone: maskPhone(e.target.value) })
                }
                placeholder="(00) 00000-0000"
                maxLength={15}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              required
              maxLength={255}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.email && (
              <span className="text-red-500 text-xs mt-1 font-medium">
                {errors.email}
              </span>
            )}
          </div>

          {formData.email && formData.cpf && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                Acesso ao Portal do Tutor será criado automaticamente ao criar o
                cadastro. A senha inicial será o CPF do tutor.
              </p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endereço
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                maxLength={150}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número
              </label>
              <input
                type="text"
                value={formData.number}
                onChange={(e) =>
                  setFormData({ ...formData, number: e.target.value })
                }
                maxLength={150}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cidade
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                maxLength={100}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Selecione...</option>
                {BRAZILIAN_STATES.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>
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

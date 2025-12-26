import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  maskCPF,
  maskCRMV,
  maskPhone,
  validateEmail,
} from '../utils/validationsMasks';

interface VeterinarianFormModalProps {
  onClose: () => void;
  onSuccess: () => void;
  clinicId: string;
}

export default function VeterinarianFormModal({
  onClose,
  onSuccess,
  clinicId,
}: VeterinarianFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    crmv: '',
    phone: '',
    specialization: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!validate()) return;

      const { data: veterinarian, error: vetError } = await supabase
        .from('veterinarians')
        .insert([
          {
            clinic_id: clinicId,
            name: formData.name,
            email: formData.email,
            cpf: formData.cpf,
            crmv: formData.crmv,
            phone: formData.phone,
            specialization: formData.specialization,
          },
        ])
        .select()
        .single();

      if (vetError) throw vetError;

      // Cria automaticamente conta de acesso ao portal se tiver email e CPF
      if (veterinarian && veterinarian.email && veterinarian.cpf) {
        const apiUrl = `${
          import.meta.env.VITE_SUPABASE_URL
        }/functions/v1/create-veterinarian-account`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email: veterinarian.email,
            password: veterinarian.cpf,
            veterinarianId: veterinarian.id,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Erro ao criar conta de acesso');
        }
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar veterinário');
    } finally {
      setIsLoading(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'O nome é obrigatório';
    if (!formData.cpf || formData.cpf.length < 14)
      newErrors.cpf = 'CPF inválido';
    if (!formData.email || validateEmail(formData.email))
      newErrors.email = 'E-mail inválido';
    if (!formData.crmv) newErrors.crmv = 'CRMV inválido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Novo Veterinário
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                placeholder="Fulano da Silva Junior"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                placeholder="teste@gmail.com"
                maxLength={255}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-colors ${
                  errors.name
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.email && (
                <span className="text-red-500 text-xs mt-1 font-medium">
                  {errors.email}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPF *
              </label>
              <input
                type="text"
                required
                value={maskCPF(formData.cpf)}
                onChange={(e) => {
                  setFormData({ ...formData, cpf: e.target.value });
                  if (errors.cpf) setErrors({ ...errors, cpf: '' });
                }}
                placeholder="000.000.000-00"
                maxLength={14}
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
                CRMV *
              </label>
              <input
                type="text"
                required
                value={maskCRMV(formData.crmv)}
                onChange={(e) => {
                  setFormData({ ...formData, crmv: e.target.value });
                  if (errors.crmv) setErrors({ ...errors, crmv: '' });
                }}
                placeholder="CRMV-SP"
                maxLength={9}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-colors ${
                  errors.crmv
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.crmv && (
                <span className="text-red-500 text-xs mt-1 font-medium">
                  {errors.crmv}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={maskPhone(formData.phone)}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="(11) 98765-4321"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Especialização
              </label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) =>
                  setFormData({ ...formData, specialization: e.target.value })
                }
                placeholder="Ex: Cirurgia, Dermatologia, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {formData.email && formData.cpf && (
              <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  Acesso ao Portal do Veterinário será criado automaticamente. A
                  senha inicial será o CPF do veterinário.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

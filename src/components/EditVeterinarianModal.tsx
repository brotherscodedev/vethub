import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  maskCPF,
  maskCRMV,
  maskPhone,
  validateEmail,
} from '../utils/validationsMasks';

interface EditVeterinarianModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  veterinarianId: string;
  initialName?: string;
  initialEmail?: string;
  initialCPF?: string;
  initialCRMV?: string;
  initialPhone?: string | null;
  initialSpecialization?: string | null;
  initialUserId?: string | null;
}

export default function EditVeterinarianModal({
  isOpen,
  onClose,
  onSuccess,
  veterinarianId,
  initialName = '',
  initialEmail = '',
  initialCPF = '',
  initialCRMV = '',
  initialPhone = '',
  initialSpecialization = '',
  initialUserId = null,
}: EditVeterinarianModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    crmv: '',
    phone: '',
    specialization: '',
    password: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData({
      name: initialName || '',
      email: initialEmail || '',
      cpf: initialCPF || '',
      crmv: initialCRMV || '',
      phone: initialPhone || '',
      specialization: initialSpecialization || '',
      password: '',
    });
    setError('');
  }, [
    initialName,
    initialEmail,
    initialCPF,
    initialCRMV,
    initialPhone,
    initialSpecialization,
    isOpen,
  ]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'O nome é obrigatório';
    if (!formData.cpf || formData.cpf.replace(/\D/g, '').length < 11)
      newErrors.cpf = 'CPF inválido';
    if (!formData.email && validateEmail(formData.email))
      newErrors.email = 'E-mail inválido';
    if (!formData.crmv || formData.crmv.replace(/\D/g, '').length < 5)
      newErrors.crmv = 'CRMV inválido';

    setError(Object.values(newErrors).join(' | '));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!validate()) return;

      const payload = {
        name: formData.name,
        email: formData.email,
        cpf: formData.cpf.replace(/\D/g, ''),
        crmv: formData.crmv,
        phone: formData.phone.replace(/\D/g, ''),
        specialization: formData.specialization,
      };

      const { error: updateVetError } = await supabase
        .from('veterinarians')
        .update(payload)
        .eq('id', veterinarianId);

      if (updateVetError) throw updateVetError;

      if (
        initialUserId &&
        (formData.email !== initialEmail || formData.password)
      ) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) throw new Error('Sessão não encontrada');

        const apiUrl = `${
          import.meta.env.VITE_SUPABASE_URL
        }/functions/v1/update-veterinarian-user`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            veterinarianId,
            email: formData.email || undefined,
            password: formData.password || undefined,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Erro ao atualizar usuário');
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Editar Veterinário
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
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
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                maxLength={100}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-colors`}
              />
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
                  if (error) setError('');
                }}
                placeholder="teste@gmail.com"
                maxLength={255}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-colors`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPF *
              </label>
              <input
                type="text"
                required
                value={maskCPF(formData.cpf)}
                onChange={(e) =>
                  setFormData({ ...formData, cpf: maskCPF(e.target.value) })
                }
                placeholder="000.000.000-00"
                maxLength={14}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-colors`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CRMV *
              </label>
              <input
                type="text"
                required
                value={maskCRMV(formData.crmv)}
                onChange={(e) =>
                  setFormData({ ...formData, crmv: maskCRMV(e.target.value) })
                }
                placeholder="CRMV-SP"
                maxLength={9}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-colors`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={maskPhone(formData.phone)}
                onChange={(e) =>
                  setFormData({ ...formData, phone: maskPhone(e.target.value) })
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

            <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                Atualizações de email/senha irão também atualizar o usuário de
                acesso (se houver). Deixe o campo de senha em branco para manter
                a senha atual.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha (opcional)
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Deixe em branco para manter a senha atual"
              />
            </div>
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
              {isLoading ? 'Atualizando...' : 'Atualizar Veterinário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

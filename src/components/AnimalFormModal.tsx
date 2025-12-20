import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Animal, Tutor } from '../types';
import { SPECIES } from '../types/species';
import { maskWeight } from '../utils/validationsMasks';

interface AnimalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  animal?: Animal;
  tutorId?: string;
}

export function AnimalFormModal({
  isOpen,
  onClose,
  onSuccess,
  animal,
  tutorId,
}: AnimalFormModalProps) {
  const { currentClinicId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    species: 'Cão',
    breed: '',
    weight_kg: '',
    birth_date: '',
    microchip: '',
    coat_color: '',
    notes: '',
    tutor_id: tutorId || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currentClinicId) {
      fetchTutors();
    }
    if (animal) {
      setFormData({
        name: animal.name || '',
        species: animal.species || 'Cão',
        breed: animal.breed || '',
        weight_kg: animal.weight_kg?.toString() || '',
        birth_date: animal.birth_date || '',
        microchip: animal.microchip || '',
        coat_color: animal.coat_color || '',
        notes: animal.notes || '',
        tutor_id: animal.tutor_id || '',
      });
    } else {
      setFormData({
        name: '',
        species: 'Cão',
        breed: '',
        weight_kg: '',
        birth_date: '',
        microchip: '',
        coat_color: '',
        notes: '',
        tutor_id: tutorId || '',
      });
    }
  }, [animal, currentClinicId, tutorId]);

  const fetchTutors = async () => {
    const { data } = await supabase
      .from('tutors')
      .select('*')
      .eq('clinic_id', currentClinicId)
      .order('name');
    if (data) setTutors(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    if (!currentClinicId) {
      console.error('AnimalFormModal - No clinic ID');
      alert(
        'Erro: Nenhuma clínica selecionada. Por favor, recarregue a página.'
      );
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        weight_kg: formData.weight_kg
          ? parseFloat(formData.weight_kg.replace(/\D/g, ''))
          : null,
        clinic_id: currentClinicId,
      };

      if (animal) {
        const { error } = await supabase
          .from('animals')
          .update(payload)
          .eq('id', animal.id)
          .select();
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('animals')
          .insert(payload)
          .select();
        if (error) throw error;
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('AnimalFormModal - Error saving animal:', error);
      console.error('AnimalFormModal - Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      alert(
        `Erro ao salvar animal: ${
          error.message || 'Erro desconhecido'
        }\n\nDetalhes: ${error.details || error.hint || ''}`
      );
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.tutor_id) newErrors.tutor_id = 'O tutor é obrigatório.';

    if (!formData.name.trim())
      newErrors.name = 'O nome do animal é obrigatório.';

    if (!formData.species) newErrors.species = 'A espécie é obrigatória.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {animal ? 'Editar Animal' : 'Novo Animal'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tutor *
            </label>
            <select
              value={formData.tutor_id}
              onChange={(e) => {
                setFormData({ ...formData, tutor_id: e.target.value });
                if (errors.tutor_id) setErrors({ ...errors, tutor_id: '' });
              }}
              required
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-colors ${
                errors.tutor_id
                  ? 'border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            >
              <option value="">Selecione um tutor</option>
              {tutors.map((tutor) => (
                <option key={tutor.id} value={tutor.id}>
                  {tutor.name}
                </option>
              ))}
            </select>
            {errors.tutor_id && (
              <span className="text-red-500 text-xs mt-1 font-medium">
                {errors.tutor_id}
              </span>
            )}
          </div>

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
                Espécie *
              </label>
              <select
                value={formData.species}
                onChange={(e) => {
                  setFormData({ ...formData, species: e.target.value });
                  if (errors.species) setErrors({ ...errors, species: '' });
                }}
                required
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition-colors ${
                  errors.species
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              >
                {SPECIES.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>
              {errors.species && (
                <span className="text-red-500 text-xs mt-1 font-medium">
                  {errors.species}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Raça
              </label>
              <input
                type="text"
                value={formData.breed}
                onChange={(e) =>
                  setFormData({ ...formData, breed: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peso (kg)
              </label>
              <input
                type="text"
                value={formData.weight_kg}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    weight_kg: maskWeight(e.target.value),
                  })
                }
                placeholder="00,0"
                maxLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Nascimento
              </label>
              <input
                type="date"
                value={formData.birth_date}
                onChange={(e) =>
                  setFormData({ ...formData, birth_date: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Microchip
              </label>
              <input
                type="text"
                value={formData.microchip}
                onChange={(e) =>
                  setFormData({ ...formData, microchip: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pelagem
              </label>
              <input
                type="text"
                value={formData.coat_color}
                onChange={(e) =>
                  setFormData({ ...formData, coat_color: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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

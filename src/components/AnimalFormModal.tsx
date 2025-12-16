import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Animal, Tutor } from '../types';

interface AnimalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  animal?: Animal;
  tutorId?: string;
}

export function AnimalFormModal({ isOpen, onClose, onSuccess, animal, tutorId }: AnimalFormModalProps) {
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
    }
  }, [animal, currentClinicId]);

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

    console.log('AnimalFormModal - handleSubmit called');
    console.log('AnimalFormModal - currentClinicId:', currentClinicId);
    console.log('AnimalFormModal - formData:', formData);

    if (!currentClinicId) {
      console.error('AnimalFormModal - No clinic ID');
      alert('Erro: Nenhuma clínica selecionada. Por favor, recarregue a página.');
      return;
    }

    setLoading(true);
    console.log('AnimalFormModal - Loading set to true');

    try {
      const payload = {
        ...formData,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        clinic_id: currentClinicId,
      };

      console.log('AnimalFormModal - Payload:', payload);

      if (animal) {
        console.log('AnimalFormModal - Updating animal:', animal.id);
        const { data, error } = await supabase.from('animals').update(payload).eq('id', animal.id).select();
        console.log('AnimalFormModal - Update result:', { data, error });
        if (error) throw error;
      } else {
        console.log('AnimalFormModal - Inserting animal');
        const { data, error } = await supabase.from('animals').insert(payload).select();
        console.log('AnimalFormModal - Insert result:', { data, error });
        if (error) throw error;
      }
      console.log('AnimalFormModal - Success!');
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
      alert(`Erro ao salvar animal: ${error.message || 'Erro desconhecido'}\n\nDetalhes: ${error.details || error.hint || ''}`);
    } finally {
      setLoading(false);
      console.log('AnimalFormModal - Loading set to false');
    }
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tutor *</label>
            <select
              value={formData.tutor_id}
              onChange={(e) => setFormData({ ...formData, tutor_id: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione um tutor</option>
              {tutors.map((tutor) => (
                <option key={tutor.id} value={tutor.id}>
                  {tutor.name}
                </option>
              ))}
            </select>
          </div>

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
              <label className="block text-sm font-medium text-gray-700 mb-1">Espécie *</label>
              <select
                value={formData.species}
                onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Cão">Cão</option>
                <option value="Gato">Gato</option>
                <option value="Ave">Ave</option>
                <option value="Réptil">Réptil</option>
                <option value="Roedor">Roedor</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Raça</label>
              <input
                type="text"
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.weight_kg}
                onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Microchip</label>
              <input
                type="text"
                value={formData.microchip}
                onChange={(e) => setFormData({ ...formData, microchip: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pelagem</label>
              <input
                type="text"
                value={formData.coat_color}
                onChange={(e) => setFormData({ ...formData, coat_color: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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

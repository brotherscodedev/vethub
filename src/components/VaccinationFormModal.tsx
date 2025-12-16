import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Vaccination, Animal, Tutor } from '../types';

interface VaccinationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vaccination?: Vaccination;
}

export function VaccinationFormModal({ isOpen, onClose, onSuccess, vaccination }: VaccinationFormModalProps) {
  const { currentClinicId, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [formData, setFormData] = useState({
    animal_id: '',
    vaccine_name: '',
    batch_number: '',
    manufacturer: '',
    administered_at: '',
    next_dose_date: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen && currentClinicId) {
      fetchTutors();
      if (vaccination) {
        setFormData({
          animal_id: vaccination.animal_id,
          vaccine_name: vaccination.vaccine_name,
          batch_number: vaccination.batch_number || '',
          manufacturer: vaccination.manufacturer || '',
          administered_at: vaccination.administered_at.split('T')[0],
          next_dose_date: vaccination.next_dose_date?.split('T')[0] || '',
          notes: vaccination.notes || '',
        });
        fetchAnimalsByTutor(vaccination.animal_id);
      }
    }
  }, [isOpen, vaccination, currentClinicId]);

  const fetchTutors = async () => {
    if (!currentClinicId) return;

    const { data } = await supabase
      .from('tutors')
      .select('*')
      .eq('clinic_id', currentClinicId)
      .order('name');
    if (data) setTutors(data);
  };

  const fetchAnimalsByTutor = async (animalId?: string) => {
    if (animalId) {
      const { data: animal } = await supabase
        .from('animals')
        .select('*')
        .eq('id', animalId)
        .maybeSingle();

      if (animal) {
        const { data } = await supabase
          .from('animals')
          .select('*')
          .eq('tutor_id', animal.tutor_id)
          .eq('clinic_id', currentClinicId)
          .order('name');
        if (data) setAnimals(data);
      }
    }
  };

  const handleTutorChange = async (tutorId: string) => {
    const { data } = await supabase
      .from('animals')
      .select('*')
      .eq('tutor_id', tutorId)
      .eq('clinic_id', currentClinicId)
      .order('name');
    if (data) {
      setAnimals(data);
      setFormData({ ...formData, animal_id: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentClinicId) {
      alert('Erro: Nenhuma clínica selecionada. Por favor, recarregue a página.');
      return;
    }

    if (!user?.id) {
      alert('Erro: Usuário não identificado. Por favor, faça login novamente.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        animal_id: formData.animal_id,
        vaccine_name: formData.vaccine_name,
        batch_number: formData.batch_number || null,
        manufacturer: formData.manufacturer || null,
        administered_at: new Date(formData.administered_at).toISOString(),
        next_dose_date: formData.next_dose_date ? new Date(formData.next_dose_date).toISOString() : null,
        notes: formData.notes || null,
        clinic_id: currentClinicId,
        veterinarian_id: user.id,
      };

      if (vaccination) {
        const { error } = await supabase.from('vaccinations').update(payload).eq('id', vaccination.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('vaccinations').insert(payload);
        if (error) throw error;
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error saving vaccination:', error);
      alert(`Erro ao salvar vacina: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      animal_id: '',
      vaccine_name: '',
      batch_number: '',
      manufacturer: '',
      administered_at: '',
      next_dose_date: '',
      notes: '',
    });
    setAnimals([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {vaccination ? 'Editar Vacinação' : 'Nova Vacinação'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!vaccination && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tutor *</label>
                <select
                  onChange={(e) => handleTutorChange(e.target.value)}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Animal *</label>
                <select
                  value={formData.animal_id}
                  onChange={(e) => setFormData({ ...formData, animal_id: e.target.value })}
                  required
                  disabled={animals.length === 0}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">Selecione um animal</option>
                  {animals.map((animal) => (
                    <option key={animal.id} value={animal.id}>
                      {animal.name} ({animal.species})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Vacina *</label>
            <input
              type="text"
              value={formData.vaccine_name}
              onChange={(e) => setFormData({ ...formData, vaccine_name: e.target.value })}
              required
              placeholder="Ex: V10, Antirrábica, FeLV..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lote</label>
              <input
                type="text"
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fabricante</label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Aplicação *</label>
              <input
                type="date"
                value={formData.administered_at}
                onChange={(e) => setFormData({ ...formData, administered_at: e.target.value })}
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Próxima Dose</label>
              <input
                type="date"
                value={formData.next_dose_date}
                onChange={(e) => setFormData({ ...formData, next_dose_date: e.target.value })}
                min={formData.administered_at}
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
              placeholder="Reações adversas, observações..."
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

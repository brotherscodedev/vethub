import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Animal {
  id: string;
  name: string;
  clinic_id: string;
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export function VetMedicalRecordModal({ onClose, onSuccess }: Props) {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [formData, setFormData] = useState({
    animal_id: '',
    anamnesis: '',
    temperature_celsius: '',
    heart_rate: '',
    respiratory_rate: '',
    weight_kg: '',
    clinical_impression: '',
    diagnosis: '',
    treatment_plan: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnimals();
  }, []);

  const loadAnimals = async () => {
    const { data } = await supabase
      .from('animals')
      .select('id, name, clinic_id')
      .order('name');

    if (data) setAnimals(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // --- CORREÇÃO: Buscar o ID do veterinário baseado no usuário logado ---
      const { data: vetProfile, error: vetError } = await supabase
        .from('veterinarians')
        .select('id, clinic_id')
        .eq('user_id', user.id)
        .single();

      if (vetError || !vetProfile) {
        throw new Error('Perfil de veterinário não encontrado. Entre em contato com o administrador.');
      }
      // -----------------------------------------------------------------------

      const selectedAnimal = animals.find(a => a.id === formData.animal_id);
      if (!selectedAnimal) throw new Error('Animal não encontrado');

      const { error: insertError } = await supabase
        .from('medical_records')
        .insert({
          clinic_id: selectedAnimal.clinic_id,
          animal_id: formData.animal_id,
          veterinarian_id: vetProfile.id, 
          anamnesis: formData.anamnesis || null,
          temperature_celsius: formData.temperature_celsius ? parseFloat(formData.temperature_celsius) : null,
          heart_rate: formData.heart_rate ? parseInt(formData.heart_rate) : null,
          respiratory_rate: formData.respiratory_rate ? parseInt(formData.respiratory_rate) : null,
          weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
          clinical_impression: formData.clinical_impression || null,
          diagnosis: formData.diagnosis || null,
          treatment_plan: formData.treatment_plan || null,
        });

      if (insertError) throw insertError;

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao criar prontuário');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Novo Prontuário Médico</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Animal *
            </label>
            <select
              required
              value={formData.animal_id}
              onChange={(e) => setFormData({ ...formData, animal_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione um animal</option>
              {animals.map((animal) => (
                <option key={animal.id} value={animal.id}>
                  {animal.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anamnese
            </label>
            <textarea
              rows={3}
              value={formData.anamnesis}
              onChange={(e) => setFormData({ ...formData, anamnesis: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Histórico e queixa principal"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperatura (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.temperature_celsius}
                onChange={(e) => setFormData({ ...formData, temperature_celsius: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                FC (bpm)
              </label>
              <input
                type="number"
                value={formData.heart_rate}
                onChange={(e) => setFormData({ ...formData, heart_rate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                FR (rpm)
              </label>
              <input
                type="number"
                value={formData.respiratory_rate}
                onChange={(e) => setFormData({ ...formData, respiratory_rate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peso (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.weight_kg}
                onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Impressão Clínica
            </label>
            <textarea
              rows={2}
              value={formData.clinical_impression}
              onChange={(e) => setFormData({ ...formData, clinical_impression: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Diagnóstico
            </label>
            <textarea
              rows={2}
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plano de Tratamento
            </label>
            <textarea
              rows={3}
              value={formData.treatment_plan}
              onChange={(e) => setFormData({ ...formData, treatment_plan: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
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
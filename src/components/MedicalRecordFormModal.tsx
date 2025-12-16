import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MedicalRecord, Animal, Tutor } from '../types';

interface MedicalRecordFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  record?: MedicalRecord;
}

export function MedicalRecordFormModal({ isOpen, onClose, onSuccess, record }: MedicalRecordFormModalProps) {
  const { currentClinicId, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [formData, setFormData] = useState({
    animal_id: '',
    anamnesis: '',
    temperature_celsius: '',
    heart_rate: '',
    respiratory_rate: '',
    capillary_refill_time: '',
    weight_kg: '',
    clinical_impression: '',
    diagnosis: '',
    treatment_plan: '',
  });

  useEffect(() => {
    if (isOpen && currentClinicId) {
      fetchTutors();
      if (record) {
        setFormData({
          animal_id: record.animal_id,
          anamnesis: record.anamnesis || '',
          temperature_celsius: record.temperature_celsius?.toString() || '',
          heart_rate: record.heart_rate?.toString() || '',
          respiratory_rate: record.respiratory_rate?.toString() || '',
          capillary_refill_time: record.capillary_refill_time?.toString() || '',
          weight_kg: record.weight_kg?.toString() || '',
          clinical_impression: record.clinical_impression || '',
          diagnosis: record.diagnosis || '',
          treatment_plan: record.treatment_plan || '',
        });
        fetchAnimalsByTutor(record.animal_id);
      }
    }
  }, [isOpen, record, currentClinicId]);

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
        anamnesis: formData.anamnesis || null,
        temperature_celsius: formData.temperature_celsius ? parseFloat(formData.temperature_celsius) : null,
        heart_rate: formData.heart_rate ? parseInt(formData.heart_rate) : null,
        respiratory_rate: formData.respiratory_rate ? parseInt(formData.respiratory_rate) : null,
        capillary_refill_time: formData.capillary_refill_time ? parseFloat(formData.capillary_refill_time) : null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        clinical_impression: formData.clinical_impression || null,
        diagnosis: formData.diagnosis || null,
        treatment_plan: formData.treatment_plan || null,
        clinic_id: currentClinicId,
        veterinarian_id: user.id,
      };

      if (record) {
        const { error } = await supabase.from('medical_records').update(payload).eq('id', record.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('medical_records').insert(payload);
        if (error) throw error;
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error saving medical record:', error);
      alert(`Erro ao salvar prontuário: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      animal_id: '',
      anamnesis: '',
      temperature_celsius: '',
      heart_rate: '',
      respiratory_rate: '',
      capillary_refill_time: '',
      weight_kg: '',
      clinical_impression: '',
      diagnosis: '',
      treatment_plan: '',
    });
    setAnimals([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {record ? 'Editar Prontuário' : 'Novo Prontuário'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!record && (
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
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Sinais Vitais</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temperatura (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.temperature_celsius}
                  onChange={(e) => setFormData({ ...formData, temperature_celsius: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TPC (segundos)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.capillary_refill_time}
                  onChange={(e) => setFormData({ ...formData, capillary_refill_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Anamnese</label>
            <textarea
              value={formData.anamnesis}
              onChange={(e) => setFormData({ ...formData, anamnesis: e.target.value })}
              rows={4}
              placeholder="Histórico, sintomas relatados, comportamento..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Impressão Clínica</label>
            <textarea
              value={formData.clinical_impression}
              onChange={(e) => setFormData({ ...formData, clinical_impression: e.target.value })}
              rows={3}
              placeholder="Observações do exame físico..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico</label>
            <textarea
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              rows={3}
              placeholder="Diagnóstico presuntivo ou definitivo..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plano de Tratamento</label>
            <textarea
              value={formData.treatment_plan}
              onChange={(e) => setFormData({ ...formData, treatment_plan: e.target.value })}
              rows={4}
              placeholder="Medicações, exames solicitados, procedimentos..."
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

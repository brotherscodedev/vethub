import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Appointment, Animal, Tutor } from '../types';

interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointment?: Appointment;
}

interface UserProfile {
  id: string;
  full_name: string;
  role: string;
}

export function AppointmentFormModal({ isOpen, onClose, onSuccess, appointment }: AppointmentFormModalProps) {
  const { currentClinicId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [veterinarians, setVeterinarians] = useState<UserProfile[]>([]);
  const [formData, setFormData] = useState({
    animal_id: '',
    veterinarian_id: '',
    scheduled_at: '',
    scheduled_time: '',
    duration_minutes: '30',
    status: 'scheduled',
    notes: '',
  });

  useEffect(() => {
    if (isOpen && currentClinicId) {
      fetchTutors();
      fetchVeterinarians();
      if (appointment) {
        const scheduledDate = new Date(appointment.scheduled_at);
        setFormData({
          animal_id: appointment.animal_id,
          veterinarian_id: appointment.veterinarian_id,
          scheduled_at: scheduledDate.toISOString().split('T')[0],
          scheduled_time: scheduledDate.toTimeString().slice(0, 5),
          duration_minutes: appointment.duration_minutes.toString(),
          status: appointment.status,
          notes: appointment.notes || '',
        });
        fetchAnimalsByTutor(appointment.animal_id);
      }
    }
  }, [isOpen, appointment, currentClinicId]);

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

  const fetchVeterinarians = async () => {
    if (!currentClinicId) return;

    const { data: clinicUsers } = await supabase
      .from('clinic_users')
      .select('user_id')
      .eq('clinic_id', currentClinicId)
      .eq('role', 'veterinarian')
      .eq('is_active', true);

    if (clinicUsers && clinicUsers.length > 0) {
      const { data } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', clinicUsers.map(cu => cu.user_id))
        .order('full_name');

      if (data) {
        setVeterinarians(data.map(d => ({ ...d, role: 'veterinarian' })));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentClinicId) {
      alert('Erro: Nenhuma clínica selecionada. Por favor, recarregue a página.');
      return;
    }

    setLoading(true);

    try {
      const scheduledAt = new Date(`${formData.scheduled_at}T${formData.scheduled_time}`);

      const payload = {
        animal_id: formData.animal_id,
        veterinarian_id: formData.veterinarian_id,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: parseInt(formData.duration_minutes),
        status: formData.status,
        notes: formData.notes || null,
        clinic_id: currentClinicId,
      };

      if (appointment) {
        const { error } = await supabase.from('appointments').update(payload).eq('id', appointment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('appointments').insert(payload);
        if (error) throw error;
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error saving appointment:', error);
      alert(`Erro ao salvar agendamento: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      animal_id: '',
      veterinarian_id: '',
      scheduled_at: '',
      scheduled_time: '',
      duration_minutes: '30',
      status: 'scheduled',
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
            {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!appointment && (
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
          )}

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Veterinário *</label>
            <select
              value={formData.veterinarian_id}
              onChange={(e) => setFormData({ ...formData, veterinarian_id: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione um veterinário</option>
              {veterinarians.map((vet) => (
                <option key={vet.id} value={vet.id}>
                  {vet.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
              <input
                type="date"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horário *</label>
              <input
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duração (minutos) *</label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                required
                min="15"
                step="15"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="scheduled">Agendado</option>
                <option value="confirmed">Confirmado</option>
                <option value="reception">Na Recepção</option>
                <option value="in_progress">Em Atendimento</option>
                <option value="completed">Concluído</option>
                <option value="cancelled">Cancelado</option>
              </select>
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

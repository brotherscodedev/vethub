import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '../components/layouts/AuthenticatedLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar, Plus, Clock, User, Dog, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Appointment, Animal, Tutor } from '../types';
import { AppointmentFormModal } from '../components/AppointmentFormModal';

interface AppointmentWithDetails extends Appointment {
  animal?: Animal & { tutor?: Tutor };
  veterinarian_name?: string;
}

export function Appointments() {
  const { currentClinicId } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNewModal, setShowNewModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (!currentClinicId) return;
    fetchAppointments();
  }, [currentClinicId, selectedDate, filterStatus]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      let query = supabase
        .from('appointments')
        .select('*')
        .eq('clinic_id', currentClinicId)
        .gte('scheduled_at', startOfDay.toISOString())
        .lte('scheduled_at', endOfDay.toISOString())
        .order('scheduled_at');

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data: appointmentsData } = await query;

      if (appointmentsData) {
        const appointmentsWithDetails = await Promise.all(
          appointmentsData.map(async (apt) => {
            const { data: animal } = await supabase
              .from('animals')
              .select('*, tutor:tutors(*)')
              .eq('id', apt.animal_id)
              .maybeSingle();

            const { data: vet } = await supabase
              .from('user_profiles')
              .select('full_name')
              .eq('id', apt.veterinarian_id)
              .maybeSingle();

            return {
              ...apt,
              animal,
              veterinarian_name: vet?.full_name || 'Veterinário',
            };
          })
        );
        setAppointments(appointmentsWithDetails);
      }
    } finally {
      setLoading(false);
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const updateStatus = async (appointmentId: string, newStatus: string) => {
    await supabase
      .from('appointments')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', appointmentId);
    fetchAppointments();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'reception': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'scheduled': return 'Agendado';
      case 'in_progress': return 'Em Atendimento';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      case 'reception': return 'Na Recepção';
      case 'pending': return 'Pendente';
      default: return status;
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agenda</h1>
            <p className="text-gray-600">Gerenciar agendamentos e fila de atendimento</p>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Novo Agendamento
          </button>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => changeDate(-1)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-semibold">
                    {selectedDate.toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h2>
                </div>
                <button
                  onClick={() => changeDate(1)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                >
                  Hoje
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos os status</option>
                  <option value="scheduled">Agendado</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="reception">Na Recepção</option>
                  <option value="in_progress">Em Atendimento</option>
                  <option value="completed">Concluído</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Carregando agendamentos...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">Nenhum agendamento para esta data</p>
                <p className="text-sm text-gray-400">
                  Clique em "Novo Agendamento" para criar um
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4 flex-1">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Clock className="w-5 h-5 text-gray-500" />
                          <span className="font-semibold text-gray-900">
                            {new Date(apt.scheduled_at).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Dog className="w-5 h-5 text-gray-600" />
                            <span className="font-semibold text-gray-900">
                              {apt.animal?.name || 'Animal'}
                            </span>
                            <span className="text-gray-500 text-sm">
                              ({apt.animal?.species})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="w-4 h-4" />
                            <span>Tutor: {apt.animal?.tutor?.name || 'Não informado'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <User className="w-4 h-4" />
                            <span>Veterinário: {apt.veterinarian_name}</span>
                          </div>
                          {apt.notes && (
                            <p className="text-sm text-gray-500 mt-2">{apt.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                          {getStatusText(apt.status)}
                        </span>
                        <select
                          value={apt.status}
                          onChange={(e) => updateStatus(apt.id, e.target.value)}
                          className="text-sm px-2 py-1 border border-gray-300 rounded"
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <AppointmentFormModal
          isOpen={showNewModal}
          onClose={() => setShowNewModal(false)}
          onSuccess={fetchAppointments}
        />
      </div>
    </AuthenticatedLayout>
  );
}
